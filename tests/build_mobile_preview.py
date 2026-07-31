"""构建移动端测试用的静态预览站点。

用 liquid_lite 把 docs/ 下的真实模板 + _data 渲染成纯静态 HTML,
复制到临时目录,供 Playwright 在移动/桌面视口下做端到端断言。

说明:预览把 site.baseurl 置空,以让本地静态服务器按根路径解析
/assets/... 资源(生产环境为 /freenode 子路径,不影响 DOM 与样式测试)。
"""
from __future__ import annotations

import os
import shutil

from liquid_lite import (
    build_site_context,
    parse_front_matter,
    render,
)

try:
    import markdown as _md

    def _md_to_html(text: str) -> str:
        return _md.markdown(text, extensions=["extra", "tables"])
except Exception:  # pragma: no cover
    def _md_to_html(text: str) -> str:
        return "<p>" + text.replace("\n\n", "</p><p>") + "</p>"


PAGES = [
    ("index.html", "/"),
    ("nodes.html", "/nodes.html"),
    ("sources.html", "/sources.html"),
    ("status.html", "/status.html"),
    ("guides.html", "/guides.html"),
    ("about.md", "/about.html"),
]


def _make_loader(includes_dir: str):
    cache = {}

    def loader(name: str):
        if name in cache:
            return cache[name]
        path = os.path.join(includes_dir, name)
        if not os.path.isfile(path):
            cache[name] = None
            return None
        with open(path, encoding="utf-8") as f:
            cache[name] = f.read()
        return cache[name]

    return loader


def build_preview(docs_dir: str, out_dir: str) -> str:
    os.makedirs(out_dir, exist_ok=True)
    layout_path = os.path.join(docs_dir, "_layouts", "default.html")
    includes_dir = os.path.join(docs_dir, "_includes")
    with open(layout_path, encoding="utf-8") as f:
        layout = f.read()

    ctx = build_site_context(docs_dir)
    # 预览时置空 baseurl,便于本地按根路径解析资源
    ctx["site"]["baseurl"] = ""
    ctx["_loader"] = _make_loader(includes_dir)

    for fname, page_url in PAGES:
        src = os.path.join(docs_dir, fname)
        if not os.path.isfile(src):
            continue
        with open(src, encoding="utf-8") as f:
            raw = f.read()
        fm, body = parse_front_matter(raw)
        fm["url"] = page_url
        if fname.endswith(".md"):
            body_html = _md_to_html(body)
        else:
            body_html = render(body, dict(ctx, page=fm, content=""))
        page_ctx = dict(ctx, page=fm, content=body_html)
        html = render(layout, page_ctx)

        out_path = os.path.join(out_dir, fname if not fname.endswith(".md") else "about.html")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(html)

    # 复制静态资源
    assets_src = os.path.join(docs_dir, "assets")
    if os.path.isdir(assets_src):
        shutil.copytree(assets_src, os.path.join(out_dir, "assets"), dirs_exist_ok=True)
    return out_dir


if __name__ == "__main__":
    import sys
    docs = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..", "docs")
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), "_site_mobile")
    build_preview(docs, out)
    print("preview built at", os.path.abspath(out))
