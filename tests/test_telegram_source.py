"""telegram_source 单元测试。

mock Telethon，不发真实请求。不安装 Telethon 也能跑（mock 掉 import）。
"""

from __future__ import annotations

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

import telegram_source

# ─── 测试夹具 ──────────────────────────────────────────────────────────


def _make_message(text: str, document=None) -> MagicMock:
    """构造一个最小可用的 Telethon Message mock。"""
    msg = MagicMock()
    msg.text = text
    msg.document = document
    return msg


def _make_async_iter(items):
    """把列表包成 async iterator。"""

    async def _gen():
        for item in items:
            yield item

    return _gen()


def _build_mock_client_class(messages):
    """构造一个 mock TelegramClient 类，async with 后能拿到 iter_messages。"""
    client = AsyncMock()
    client.iter_messages = MagicMock(return_value=_make_async_iter(messages))
    # async with client as c 时 c 绑定到 client 自己
    client.__aenter__.return_value = client
    client.__aexit__.return_value = None
    cls = MagicMock(return_value=client)
    return cls


# ─── extract_node_links ───────────────────────────────────────────


def test_extract_links_from_text():
    text = (
        "vmess://eyJhZGQiOiJhLmNvbSJ9 "
        "ss://bWV0aG9kOnBhc3M=@b.com:443 "
        "trojan://pass@c.com:443"
    )
    links = telegram_source.extract_node_links(text)
    assert len(links) == 3
    assert any(link.startswith("vmess://") for link in links)
    assert any(link.startswith("ss://") for link in links)
    assert any(link.startswith("trojan://") for link in links)


def test_extract_links_from_text_empty():
    # 空文本、None、没链接的文本都应返回空列表
    assert telegram_source.extract_node_links("") == []
    assert telegram_source.extract_node_links(None) == []
    assert telegram_source.extract_node_links("no links here") == []


# ─── fetch_telegram_channel_with_stats ──────────────────────────────


def test_fetch_telegram_channel_no_telethon():
    """Telethon 不可用时抛 RuntimeError。"""
    with (
        patch.object(telegram_source, "TelegramClient", None),
        pytest.raises(RuntimeError, match="Telethon not installed"),
    ):
        telegram_source.fetch_telegram_channel_with_stats("@test")


def test_fetch_telegram_channel_mock():
    """mock TelegramClient + iter_messages，验证链接提取和去重。"""
    # 两条消息，第二条带一条和第一条重复的 ss 链接
    msg1 = _make_message(
        "ss://bWV0aG9kOnBhc3M=@b.com:443 vmess://eyJhZGQiOiJhLmNvbSJ9"
    )
    msg2 = _make_message(
        "ss://bWV0aG9kOnBhc3M=@b.com:443 trojan://pass@c.com:443"
    )
    mock_cls = _build_mock_client_class([msg1, msg2])

    with (
        patch.object(telegram_source, "TelegramClient", mock_cls),
        patch.object(telegram_source, "_sleep", new_callable=AsyncMock),
    ):
        links, _ = telegram_source.fetch_telegram_channel_with_stats(
            "@test", limit=10, api_id=1, api_hash="x"
        )

    # ss 在两条消息里重复，去重后应剩 3 条
    assert len(links) == 3
    assert "ss://bWV0aG9kOnBhc3M=@b.com:443" in links
    assert any(link.startswith("vmess://") for link in links)
    assert any(link.startswith("trojan://") for link in links)


def test_fetch_telegram_channel_rate_limit():
    """3 条消息 → _sleep 被调 3 次。"""
    messages = [
        _make_message("ss://bWV0aG9kOnBhc3M=@b.com:443"),
        _make_message("vmess://eyJhZGQiOiJhLmNvbSJ9"),
        _make_message("trojan://pass@c.com:443"),
    ]
    mock_cls = _build_mock_client_class(messages)

    with (
        patch.object(telegram_source, "TelegramClient", mock_cls),
        patch.object(telegram_source, "_sleep", new_callable=AsyncMock) as mock_sleep,
    ):
        telegram_source.fetch_telegram_channel_with_stats(
            "@test", limit=10, api_id=1, api_hash="x"
        )

    assert mock_sleep.call_count == 3


def test_fetch_telegram_channel_missing_credentials():
    """没装 Telethon 时（mock 成可用），但缺 api 凭证应报错。"""
    # TelegramClient 设置成可用的 mock，但不传 api_id/api_hash、也不设环境变量
    mock_cls = _build_mock_client_class([])
    env = {"TELEGRAM_API_ID": "", "TELEGRAM_API_HASH": ""}
    with (
        patch.object(telegram_source, "TelegramClient", mock_cls),
        patch.dict("os.environ", env, clear=False),
    ):
        # os.environ 里可能本来就有，用 monkeypatch 思路：直接删
        import os

        for key in ("TELEGRAM_API_ID", "TELEGRAM_API_HASH"):
            os.environ.pop(key, None)
        with pytest.raises(RuntimeError, match="缺少 Telegram API 凭证"):
            telegram_source.fetch_telegram_channel_with_stats("@test")


# ─── CLI 参数解析 ─────────────────────────────────────────────────────


def test_cli_args():
    parser = telegram_source._build_arg_parser()

    # 默认值
    args = parser.parse_args(["@channel_name", "--limit", "200"])
    assert args.channel == "@channel_name"
    assert args.limit == 200
    assert args.output is None
    assert args.session == "freenode"

    # --output 写文件
    args2 = parser.parse_args(["@chan", "--output", "/tmp/out.json"])
    assert args2.output == "/tmp/out.json"

    # --session 自定义
    args3 = parser.parse_args(["@chan", "--session", "mybot"])
    assert args3.session == "mybot"

    # 缺必填 channel 应报错
    with pytest.raises(SystemExit):
        parser.parse_args([])


if __name__ == "__main__":
    test_extract_links_from_text()
    test_extract_links_from_text_empty()
    test_fetch_telegram_channel_no_telethon()
    test_fetch_telegram_channel_mock()
    test_fetch_telegram_channel_rate_limit()
    test_fetch_telegram_channel_missing_credentials()
    test_cli_args()
    print("telegram_source tests passed")
