"""FreeNode 移动端适配 · 自动化端到端测试 (Playwright)

验证移动端独立设计语言确实生效,且与桌面端解耦:
  - 移动视口:底部 Tab 栏出现(5 项、fixed)、桌面顶栏隐藏、订阅卡片单栏、
    协议环横向滑动、首页 Top10 表格卡片化、点击"更多"联动抽屉、
    当前页 Tab 高亮、i18n 短标签生效、无 JS 运行时错误。
  - 桌面视口:底部 Tab 栏隐藏、桌面顶栏可见。
"""
from __future__ import annotations

import functools
import http.server
import socketserver
import threading
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright

from build_mobile_preview import build_preview

DOCS_DIR = Path(__file__).resolve().parent.parent / "docs"
CHROME = "/usr/bin/chromium"
MOBILE = {"viewport": {"width": 390, "height": 844}, "device_scale_factor": 2, "is_mobile": True, "has_touch": True}
DESKTOP = {"viewport": {"width": 1280, "height": 800}}


@pytest.fixture(scope="session")
def preview_dir(tmp_path_factory):
    out = tmp_path_factory.mktemp("mobile_preview")
    build_preview(str(DOCS_DIR), str(out))
    return out


@pytest.fixture(scope="session")
def base_url(preview_dir):
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(preview_dir))
    with socketserver.TCPServer(("127.0.0.1", 0), handler) as httpd:
        port = httpd.server_address[1]
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        try:
            yield f"http://127.0.0.1:{port}"
        finally:
            httpd.shutdown()


def _new_page(base_url, context_opts):
    pw = sync_playwright().start()
    browser = pw.chromium.launch(executable_path=CHROME, args=["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"])
    ctx = browser.new_context(**context_opts)
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page._errors = errors
    return pw, browser, ctx, page


def _load(page, base_url, path):
    page.goto(base_url + path, wait_until="domcontentloaded")
    # 等待前端脚本初始化(导航高亮 / i18n)
    page.wait_for_timeout(600)


# --------------------------------------------------------------------------
# 移动端核心断言
# --------------------------------------------------------------------------
def test_mobile_tabbar_present_and_fixed(base_url):
    pw, browser, ctx, page = _new_page(base_url, MOBILE)
    try:
        _load(page, base_url, "/")
        assert page.is_visible(".mobile-tabbar"), "移动端底部 Tab 栏应当可见"
        assert page.locator(".tab-item").count() == 5, "底部 Tab 栏应有 5 个入口"
        pos = page.eval_on_selector(".mobile-tabbar", "el => getComputedStyle(el).position")
        assert pos == "fixed", "底部 Tab 栏应为 fixed 定位"
        # 安全区 / 高度生效
        h = page.eval_on_selector(".mobile-tabbar", "el => getComputedStyle(el).height")
        assert "58px" in h, f"Tab 栏高度应含 58px,实际 {h}"
    finally:
        browser.close()
        pw.stop()


def test_mobile_desktop_nav_hidden(base_url):
    pw, browser, ctx, page = _new_page(base_url, MOBILE)
    try:
        _load(page, base_url, "/")
        assert not page.is_visible(".site-nav"), "移动端应隐藏桌面横向顶栏"
    finally:
        browser.close()
        pw.stop()


def test_mobile_subscriptions_single_column(base_url):
    pw, browser, ctx, page = _new_page(base_url, MOBILE)
    try:
        _load(page, base_url, "/")
        cols = page.eval_on_selector(".sub-grid", "el => getComputedStyle(el).gridTemplateColumns")
        assert len(cols.split()) == 1, f"订阅卡片应单栏,实际列数: {cols}"
        # 动作区:复制按钮独占整行(网格 3 列中跨满)
        span = page.eval_on_selector(".sub-card-actions .btn-primary",
                                     "el => el.getBoundingClientRect().width")
        grid_w = page.eval_on_selector(".sub-card-actions", "el => el.getBoundingClientRect().width")
        assert span >= grid_w * 0.9, "复制按钮应占满整行"
    finally:
        browser.close()
        pw.stop()


def test_mobile_protocol_rings_horizontal_scroll(base_url):
    pw, browser, ctx, page = _new_page(base_url, MOBILE)
    try:
        _load(page, base_url, "/")
        of = page.eval_on_selector(".protocol-rings-grid", "el => getComputedStyle(el).overflowX")
        assert of in ("auto", "scroll"), f"协议环应可横向滑动,实际 overflow-x: {of}"
    finally:
        browser.close()
        pw.stop()


def test_mobile_top_sources_table_cardified(base_url):
    pw, browser, ctx, page = _new_page(base_url, MOBILE)
    try:
        _load(page, base_url, "/")
        disp = page.eval_on_selector(".source-table.top-sources tbody tr",
                                     "el => getComputedStyle(el).display")
        assert disp == "block", f"首页 Top10 表格行应卡片化(display:block),实际 {disp}"
    finally:
        browser.close()
        pw.stop()


def test_mobile_more_tab_toggles_drawer(base_url):
    pw, browser, ctx, page = _new_page(base_url, MOBILE)
    try:
        _load(page, base_url, "/")
        page.click("#tab-more")
        page.wait_for_selector("#nav-menu-panel.is-open", state="attached", timeout=2000)
        aria = page.get_attribute("#nav-menu-panel", "aria-hidden")
        assert aria == "false", "点击更多后抽屉应展开"
        # 再次点击关闭
        page.click("#tab-more")
        page.wait_for_function(
            "document.getElementById('nav-menu-panel').classList.contains('is-open') === false",
            timeout=2000)
    finally:
        browser.close()
        pw.stop()


def test_mobile_drawer_has_lang_switcher(base_url):
    pw, browser, ctx, page = _new_page(base_url, MOBILE)
    try:
        _load(page, base_url, "/")
        # 移动端顶栏的语言切换应被隐藏
        assert not page.is_visible(".site-header .lang-switcher"), "移动端顶栏语言切换应隐藏"
        # 打开"更多"抽屉
        page.click("#tab-more")
        page.wait_for_selector("#nav-menu-panel.is-open", state="attached", timeout=2000)
        # 抽屉内必须存在语言切换器且可见
        count = page.locator("#nav-menu-panel .lang-switcher button[data-lang]").count()
        assert count == 3, f"抽屉内应有 3 个语言按钮(EN/中/日),实际 {count}"
        assert page.is_visible("#nav-menu-panel .lang-switcher"), "抽屉内语言切换应可见"
        disp = page.eval_on_selector(
            "#nav-menu-panel .lang-switcher", "el => getComputedStyle(el).display")
        assert disp != "none", f"抽屉内语言切换不应为 display:none,实际 {disp}"
    finally:
        browser.close()
        pw.stop()


def test_mobile_drawer_lang_switch_works(base_url):
    pw, browser, ctx, page = _new_page(base_url, MOBILE)
    try:
        _load(page, base_url, "/")
        # 默认应为 en
        lang0 = page.eval_on_selector("html", "el => el.lang")
        assert lang0 == "en", f"默认语言应为 en,实际 {lang0}"
        # 打开抽屉并切到中文
        page.click("#tab-more")
        page.wait_for_selector("#nav-menu-panel.is-open", state="attached", timeout=2000)
        page.click("#nav-menu-panel .lang-switcher button[data-lang='zh']")
        page.wait_for_function("document.documentElement.lang === 'zh'", timeout=3000)
        # 标签应即时切换为中文(首页 Tab)
        label = page.text_content(".mobile-tabbar a[data-nav=\"/\"] .tab-label")
        assert label.strip() == "首页", f"切中文后首页 Tab 应为 首页,实际 {label!r}"
        # 抽屉内按钮高亮态应同步
        pressed = page.get_attribute(
            "#nav-menu-panel .lang-switcher button[data-lang='zh']", "aria-pressed")
        assert pressed == "true", "中文按钮 aria-pressed 应为 true"
        # 持久化
        stored = page.evaluate("localStorage.getItem('freenode-lang')")
        assert stored == "zh", f"语言应写入 localStorage,实际 {stored}"
    finally:
        browser.close()
        pw.stop()


def test_mobile_active_tab_highlight(base_url):
    pw, browser, ctx, page = _new_page(base_url, MOBILE)
    try:
        _load(page, base_url, "/")
        page.wait_for_function(
            "document.querySelector('.mobile-tabbar a[data-nav=\"/\"]').classList.contains('is-active')",
            timeout=3000)
        assert True
        # 切换到节点页,Home 高亮消失、Nodes 高亮
        page.goto(base_url + "/nodes.html", wait_until="domcontentloaded")
        page.wait_for_timeout(600)
        page.wait_for_function(
            "document.querySelector('.mobile-tabbar a[data-nav=\"/nodes.html\"]').classList.contains('is-active')",
            timeout=3000)
    finally:
        browser.close()
        pw.stop()


def test_mobile_i18n_short_labels(base_url):
    pw, browser, ctx, page = _new_page(base_url, MOBILE)
    try:
        _load(page, base_url, "/")
        label = page.text_content(".mobile-tabbar a[data-nav=\"/\"] .tab-label")
        assert label.strip() == "Home", f"默认语言下首页 Tab 标签应为 Home,实际 {label!r}"
    finally:
        browser.close()
        pw.stop()


def test_mobile_sources_page_single_column(base_url):
    pw, browser, ctx, page = _new_page(base_url, MOBILE)
    try:
        _load(page, base_url, "/sources.html")
        cols = page.eval_on_selector(".source-cards", "el => getComputedStyle(el).gridTemplateColumns")
        assert len(cols.split()) == 1, f"数据源卡片应单栏,实际列数: {cols}"
    finally:
        browser.close()
        pw.stop()


def test_mobile_nodes_table_full_bleed(base_url):
    pw, browser, ctx, page = _new_page(base_url, MOBILE)
    try:
        _load(page, base_url, "/nodes.html")
        assert page.is_visible(".nodes-table-wrap")
        minw = page.eval_on_selector(".nodes-table", "el => getComputedStyle(el).minWidth")
        assert minw not in ("", "0px", "auto"), f"节点表格应设最小宽度以触发横向滚动,实际 {minw}"
    finally:
        browser.close()
        pw.stop()


def test_mobile_no_js_errors(base_url):
    pw, browser, ctx, page = _new_page(base_url, MOBILE)
    try:
        for path in ("/", "/nodes.html", "/sources.html", "/status.html"):
            _load(page, base_url, path)
        assert not page._errors, f"移动端加载产生 JS 运行时错误: {page._errors}"
    finally:
        browser.close()
        pw.stop()


# --------------------------------------------------------------------------
# 桌面端解耦断言
# --------------------------------------------------------------------------
def test_desktop_tabbar_hidden(base_url):
    pw, browser, ctx, page = _new_page(base_url, DESKTOP)
    try:
        _load(page, base_url, "/")
        assert not page.is_visible(".mobile-tabbar"), "桌面端应隐藏移动端底部 Tab 栏"
        assert page.is_visible(".site-nav"), "桌面端应显示横向顶栏"
    finally:
        browser.close()
        pw.stop()


def test_desktop_subscriptions_multi_column(base_url):
    pw, browser, ctx, page = _new_page(base_url, DESKTOP)
    try:
        _load(page, base_url, "/")
        cols = page.eval_on_selector(".sub-grid", "el => getComputedStyle(el).gridTemplateColumns")
        assert len(cols.split()) >= 2, f"桌面端订阅卡片应多列,实际列数: {cols}"
    finally:
        browser.close()
        pw.stop()
