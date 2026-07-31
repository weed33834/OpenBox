"""web_url 适配器：抓允许的 HTTPS web 页面直链。"""

from __future__ import annotations

from utils import validate_url


class WebUrlAdapter:
    """web_url 源：普通 HTTPS 直链，行为和 github_raw 一致。"""

    @property
    def source_type(self) -> str:
        return "web_url"

    def fetch(self, source: dict) -> str:
        validate_url(source["url"])
        # 和 github_raw 走同一条 fetch_source，区分 type 是为了将来分流
        import crawler

        return crawler.fetch_source(source)
