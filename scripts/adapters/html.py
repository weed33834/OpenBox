"""html 适配器：抓 HTML 页面，按简易 selector 提取 <pre>/<code> 文本。

用 BeautifulSoup4（html.parser 后端，无需 lxml）做解析，支持
``tag`` / ``tag.class`` / ``#id`` / ``tag attr=value`` 这几种 selector。
"""

from __future__ import annotations

from bs4 import BeautifulSoup

from utils import validate_url


def _parse_selector(
    selector: str,
) -> tuple[str | None, str | None, str | None, dict[str, str]]:
    """解析简易 selector，返回 (tag, class, id, attr_filters)。

    支持: ``tag`` / ``tag.class`` / ``#id`` / ``tag attr=value``
    """
    parts = selector.strip().split()
    main = parts[0] if parts else ""
    attr_filters: dict[str, str] = {}
    for p in parts[1:]:
        if "=" in p:
            k, v = p.split("=", 1)
            attr_filters[k.strip()] = v.strip().strip("\"'")
    tag: str | None = None
    cls: str | None = None
    id_: str | None = None
    if main.startswith("#"):
        id_ = main[1:]
    elif "." in main:
        tag, cls = main.split(".", 1)
    elif main:
        tag = main
    return tag, cls, id_, attr_filters


def extract(html_text: str, selector: str | None = None) -> str:
    """从 HTML 提取 selector 指向的元素文本。

    selector 为 None 时默认抓所有 ``<pre>`` 和 ``<code>``。
    """
    soup = BeautifulSoup(html_text, "html.parser")
    if not selector:
        matched = soup.find_all(["pre", "code"])
    else:
        tag, cls, id_, attr_filters = _parse_selector(selector)
        kwargs: dict = {}
        if cls:
            kwargs["class_"] = cls
        if id_:
            kwargs["id"] = id_
        if attr_filters:
            kwargs["attrs"] = attr_filters
        # tag 为 None（纯 #id）时 find_all(None, ...) 匹配任意标签
        matched = soup.find_all(tag, **kwargs)

    return "\n".join(el.get_text().strip() for el in matched if el.get_text().strip())


class HtmlAdapter:
    """html 源：抓 HTML，按 selector 提取 ``<pre>``/``<code>`` 块文本。"""

    @property
    def source_type(self) -> str:
        return "html"

    def fetch(self, source: dict) -> str:
        validate_url(source["url"])
        import crawler

        html_text = crawler.fetch(
            source["url"],
            timeout=source.get("timeout", 20),
            max_bytes=source.get("max_size", 10 * 1024 * 1024),
        )
        return extract(html_text, source.get("selector"))
