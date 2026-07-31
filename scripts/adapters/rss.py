"""rss 适配器：抓 RSS/Atom feed，提取 item/entry 的正文文本。

用 ``feedparser`` 库解析，自动处理 RSS/Atom 差异、命名空间（如
``content:encoded``）、日期与内容抽取等边界情况。
"""

from __future__ import annotations

import feedparser

from utils import validate_url


def parse_feed(xml_text: str) -> str:
    """解析 RSS/Atom feed，返回 entry 正文拼成的字符串（每条之间换行）。

    每条 entry 的 ``summary``/``description`` 与所有 ``content`` 字段都视作正文，
    按出现顺序拼起来；``title`` 不算正文。空 feed 或解析失败时返回空字符串。
    """
    # feedparser 对畸形 XML 不会抛异常，而是置 bozo 位并尽量解析，故此处无需 try。
    parsed = feedparser.parse(xml_text)
    chunks: list[str] = []
    for entry in parsed.entries:
        parts: list[str] = []
        # summary 与 description 通常是同义别名，取一次即可
        summary = entry.get("summary") or entry.get("description")
        if summary:
            parts.append(summary)
        # content:encoded（RSS）或 <content>（Atom），可能有多段
        for content in entry.get("content") or []:
            value = content.get("value")
            if value:
                parts.append(value)
        if parts:
            chunks.append("\n".join(parts))
    return "\n".join(chunks)


class RssAdapter:
    """rss 源：抓 feed XML，提取所有 item/entry 正文。"""

    @property
    def source_type(self) -> str:
        return "rss"

    def fetch(self, source: dict) -> str:
        validate_url(source["url"])
        import crawler

        xml_text = crawler.fetch(
            source["url"],
            timeout=source.get("timeout", 20),
            max_bytes=source.get("max_size", 10 * 1024 * 1024),
        )
        return parse_feed(xml_text)
