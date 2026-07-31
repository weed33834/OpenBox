"""SourceAdapter 协议定义。

每个 adapter 对应 sources.json 里的一种 ``type``，负责把一个 source 条目
抓成文本（行为和 ``crawler.fetch_source`` 一致）。
"""

from __future__ import annotations

from typing import Protocol, runtime_checkable


@runtime_checkable
class SourceAdapter(Protocol):
    """采集源适配器协议：按 ``source["type"]`` 分发。"""

    @property
    def source_type(self) -> str:
        """对应 sources.json 里的 type 字段。"""
        ...

    def fetch(self, source: dict) -> str:
        """抓取 source，返回文本内容。"""
        ...
