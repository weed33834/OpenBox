"""github_raw 适配器：抓 raw.githubusercontent.com 上的 raw 文件。"""

from __future__ import annotations

from utils import validate_url


class GithubRawAdapter:
    """github_raw 源：raw 文件直链，可选 base64 解码。"""

    @property
    def source_type(self) -> str:
        return "github_raw"

    def fetch(self, source: dict) -> str:
        # 提前做 SSRF 校验，给一个清晰错误，避免进到 fetch 才挂
        validate_url(source["url"])
        # 复用 crawler 里的 fetch_source（httpx 抓取 + base64 解码 + 重试）。
        # lazy import 避免和 crawler 互相 import 打架。
        import crawler

        return crawler.fetch_source(source)
