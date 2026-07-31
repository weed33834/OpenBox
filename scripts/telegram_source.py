"""Telegram 频道数据源抓取。

独立工具，不接入 crawler 主流程。
依赖 Telethon（可选），需要预先登录拿到 session 文件：
    python3 -m telethon_quickstart  # 或者用任意 Telethon 示例登录一次
"""

from __future__ import annotations

import argparse
import asyncio
import io
import json
import os
import sys
from pathlib import Path

# Telethon 是可选依赖，没装时 TelegramClient 为 None，调用时再报错
try:
    from telethon import TelegramClient
except ImportError:
    TelegramClient = None  # type: ignore[assignment]

# 让脚本能直接 import parser/utils（pytest 走 pyproject 的 pythonpath 也能找到）
sys.path.insert(0, str(Path(__file__).parent))

from parser import extract_node_links

from utils import get_logger

logger = get_logger("telegram")

# session 文件默认存放目录
DEFAULT_SESSION_DIR = Path.home() / ".freenode"
# 每条消息之间 sleep 多少秒，避免 flood ban
DEFAULT_RATE_LIMIT_SECONDS = 1.0
# 当作文本附件处理的扩展名
TEXT_ATTACHMENT_EXTS = {".txt", ".base64", ".yaml", ".yml"}


def _get_document_filename(document) -> str | None:
    """从 Telethon Document 对象里捞文件名，捞不到返回 None。"""
    if document is None:
        return None
    attributes = getattr(document, "attributes", None) or []
    for attr in attributes:
        file_name = getattr(attr, "file_name", None)
        if file_name:
            return file_name
    return None


def _is_text_attachment(filename: str | None) -> bool:
    """根据扩展名判断是不是文本类附件。"""
    if not filename:
        return False
    return Path(filename).suffix.lower() in TEXT_ATTACHMENT_EXTS


async def extract_links_from_document(document, client) -> list[str]:
    """从 Telethon Document 下载文本附件并提取链接。

    只处理 .txt/.base64/.yaml/.yml 之类文本附件，其他跳过。
    """
    filename = _get_document_filename(document)
    if not _is_text_attachment(filename):
        return []
    buf = io.BytesIO()
    try:
        await client.download_media(document, file=buf)
    except Exception as exc:
        logger.warning("下载附件 %s 失败: %s", filename, exc)
        return []
    text = buf.getvalue().decode("utf-8", errors="ignore")
    return extract_node_links(text)


def _resolve_session_path(session_name: str) -> Path:
    """根据 session_name 解析 session 文件路径。

    绝对路径直接用；否则放到 ~/.freenode/ 下，Telethon 会自动加 .session 后缀。
    """
    path = Path(session_name)
    if path.is_absolute():
        return path
    session_dir = DEFAULT_SESSION_DIR
    session_dir.mkdir(parents=True, exist_ok=True)
    return session_dir / session_name


def _resolve_api_credentials(
    api_id: int | None, api_hash: str | None
) -> tuple[int, str]:
    """api_id/api_hash 优先用参数，其次读环境变量。"""
    if api_id is None:
        env_api_id = os.environ.get("TELEGRAM_API_ID")
        if env_api_id:
            try:
                api_id = int(env_api_id)
            except ValueError as exc:
                raise RuntimeError(
                    f"TELEGRAM_API_ID 不是合法整数: {env_api_id}"
                ) from exc
    if api_hash is None:
        api_hash = os.environ.get("TELEGRAM_API_HASH")
    if api_id is None or not api_hash:
        raise RuntimeError(
            "缺少 Telegram API 凭证。请传 api_id/api_hash 参数，"
            "或设置 TELEGRAM_API_ID / TELEGRAM_API_HASH 环境变量。"
            "从 https://my.telegram.org 获取。"
        )
    return api_id, api_hash


def _normalize_channel(channel: str) -> str | int:
    """规范化频道标识。

    - t.me 链接 → @username
    - 纯数字（可能带 -）→ int，当 channel ID 用
    - 其他（@username）原样返回
    """
    if not channel:
        raise ValueError("channel 不能为空")
    channel = channel.strip()
    lower = channel.lower()
    for prefix in (
        "https://t.me/",
        "http://t.me/",
        "https://telegram.me/",
        "http://telegram.me/",
    ):
        if lower.startswith(prefix):
            tail = channel[len(prefix):].lstrip("/")
            tail = tail.split("?", 1)[0].split("#", 1)[0]
            if not tail:
                raise ValueError(f"无法从 {channel} 解析出频道名")
            return tail if tail.startswith("@") else "@" + tail
    # 纯数字（可能带前导 -）当 channel ID
    if channel.lstrip("-").isdigit():
        try:
            return int(channel)
        except ValueError:
            return channel
    return channel


async def _sleep(seconds: float) -> None:
    """每条消息之间 sleep 一下，避免 flood ban。单独抽出来方便测试 mock。"""
    await asyncio.sleep(seconds)


async def _fetch_telegram_channel(
    channel: str | int,
    limit: int,
    session_path: Path,
    api_id: int,
    api_hash: str,
    rate_limit_seconds: float,
) -> tuple[list[str], int]:
    """异步拉取频道消息并提取链接，返回 (链接列表, 扫描消息数)。"""
    links: list[str] = []
    seen: set[str] = set()
    messages_scanned = 0

    async with TelegramClient(str(session_path), api_id, api_hash) as client:
        async for message in client.iter_messages(channel, limit=limit):
            messages_scanned += 1
            text = getattr(message, "text", None) or ""
            for link in extract_node_links(text):
                if link not in seen:
                    seen.add(link)
                    links.append(link)
            document = getattr(message, "document", None)
            if document is not None:
                try:
                    doc_links = await extract_links_from_document(document, client)
                except Exception as exc:
                    logger.warning("处理附件失败: %s", exc)
                    doc_links = []
                for link in doc_links:
                    if link not in seen:
                        seen.add(link)
                        links.append(link)
            # 速率限制：每条消息后 sleep 一下，避免 flood ban
            await _sleep(rate_limit_seconds)

    return links, messages_scanned


def fetch_telegram_channel_with_stats(
    channel: str,
    limit: int = 100,
    session_name: str = "freenode",
    api_id: int | None = None,
    api_hash: str | None = None,
) -> tuple[list[str], int]:
    """抓取频道并返回 (链接列表, 扫描消息数)，给 CLI 与调用方用。"""
    if TelegramClient is None:
        raise RuntimeError("Telethon not installed. pip install telethon")
    norm_channel = _normalize_channel(channel)
    resolved_api_id, resolved_api_hash = _resolve_api_credentials(api_id, api_hash)
    session_path = _resolve_session_path(session_name)
    return asyncio.run(
        _fetch_telegram_channel(
            channel=norm_channel,
            limit=limit,
            session_path=session_path,
            api_id=resolved_api_id,
            api_hash=resolved_api_hash,
            rate_limit_seconds=DEFAULT_RATE_LIMIT_SECONDS,
        )
    )


def _build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="抓取 Telegram 频道历史消息，提取节点链接。",
    )
    parser.add_argument(
        "channel",
        help="频道用户名（@xxx）或 t.me 链接或 channel ID",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=100,
        help="抓取最近多少条消息，默认 100",
    )
    parser.add_argument(
        "--session",
        default="freenode",
        help="Telethon session 名称（默认 freenode，存到 ~/.freenode/ 下）",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="输出 JSON 路径，默认打到 stdout",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = _build_arg_parser()
    args = parser.parse_args(argv)

    try:
        links, messages_scanned = fetch_telegram_channel_with_stats(
            channel=args.channel,
            limit=args.limit,
            session_name=args.session,
        )
    except (RuntimeError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    payload = {
        "channel": args.channel,
        "messages_scanned": messages_scanned,
        "links_found": links,
    }
    output_text = json.dumps(payload, ensure_ascii=False, indent=2)

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(output_text, encoding="utf-8")
        print(f"wrote {len(links)} links to {output_path}", file=sys.stderr)
    else:
        print(output_text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
