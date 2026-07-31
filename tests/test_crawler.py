"""crawler.py 的单元测试。

覆盖 maybe_decode_base64 / fetch_source / _fetch_source_safe / crawl 的纯逻辑路径，
不发起真实网络请求。
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

import crawler

from utils import FetchError

# ─── maybe_decode_base64 ─────────────────────────────────────────────


def test_maybe_decode_base64_plain_text_passthrough():
    # 含 "://" 的明文订阅直接返回原文
    assert crawler.maybe_decode_base64("vmess://example") == "vmess://example"


def test_maybe_decode_base64_multiline_passthrough():
    # 多行文本不当作整体 base64
    text = "line1\nline2"
    assert crawler.maybe_decode_base64(text) == text


def test_maybe_decode_base64_decodes_valid():
    # "vmess://abc" 的 base64
    encoded = "dm1lc3M6Ly9hYmM="
    assert crawler.maybe_decode_base64(encoded) == "vmess://abc"


def test_maybe_decode_base64_unpadded():
    # 缺少 padding 也要能解
    assert crawler.maybe_decode_base64("dm1lc3M6Ly9hYmM") == "vmess://abc"


def test_maybe_decode_base64_invalid_returns_original():
    # 非法 base64 回退原文
    assert crawler.maybe_decode_base64("!!!not-base64!!!") == "!!!not-base64!!!"


def test_maybe_decode_base64_empty():
    assert crawler.maybe_decode_base64("") == ""
    assert crawler.maybe_decode_base64("   \n  ") == ""


# ─── fetch_source / _fetch_source_safe ───────────────────────────────


def test_fetch_source_decodes_base64_when_flag_set(monkeypatch):
    captured = {}

    def fake_fetch(url, timeout=20, retries=1, max_bytes=10485760):
        captured["url"] = url
        return "dm1lc3M6Ly9hYmM="  # vmess://abc

    monkeypatch.setattr(crawler, "fetch", fake_fetch)

    source = {"url": "https://raw.githubusercontent.com/x/y", "decode_base64": True}
    text = crawler.fetch_source(source)
    assert text == "vmess://abc"
    assert captured["url"] == "https://raw.githubusercontent.com/x/y"


def test_fetch_source_skips_decode_when_flag_false(monkeypatch):
    monkeypatch.setattr(crawler, "fetch", lambda *a, **kw: "dm1lc3M6Ly9hYmM=")
    source = {"url": "https://raw.githubusercontent.com/x/y"}
    assert crawler.fetch_source(source) == "dm1lc3M6Ly9hYmM="


def test_fetch_source_respects_custom_timeout_and_maxsize(monkeypatch):
    captured = {}

    def fake_fetch(url, timeout=20, retries=1, max_bytes=10485760):
        captured["timeout"] = timeout
        captured["max_bytes"] = max_bytes
        return ""

    monkeypatch.setattr(crawler, "fetch", fake_fetch)
    crawler.fetch_source(
        {"url": "https://raw.githubusercontent.com/x/y", "timeout": 5, "max_size": 1024}
    )
    assert captured["timeout"] == 5
    assert captured["max_bytes"] == 1024


def test_fetch_source_safe_returns_none_on_fetch_error(monkeypatch):
    def boom(*a, **kw):
        raise FetchError("network down")

    monkeypatch.setattr(crawler, "fetch", boom)
    result = crawler._fetch_source_safe({"name": "dead-src"}, "nodes")
    assert result is None


def test_fetch_source_safe_returns_entry_with_proxy_scheme(monkeypatch):
    monkeypatch.setattr(crawler, "fetch", lambda *a, **kw: "1.2.3.4:8080")
    result = crawler._fetch_source_safe(
        {"name": "src", "url": "https://raw.githubusercontent.com/x/y", "proxy_scheme": "http"},
        "proxies",
    )
    assert result is not None
    assert result["name"] == "src"
    assert result["proxy_scheme"] == "http"
    assert result["text"] == "1.2.3.4:8080"
    assert result["category"] == "proxies"


def test_fetch_source_safe_uses_unknown_when_name_missing(monkeypatch):
    monkeypatch.setattr(crawler, "fetch", lambda *a, **kw: "data")
    result = crawler._fetch_source_safe(
        {"url": "https://raw.githubusercontent.com/x/y"}, "nodes"
    )
    assert result is not None
    assert result["name"] == "unknown"


# ─── crawl ────────────────────────────────────────────────────────────


def test_crawl_aggregates_enabled_sources_by_category(tmp_path, monkeypatch):
    config = {
        "free_node_sources": [
            {"name": "n1", "url": "https://raw.githubusercontent.com/a/b", "enabled": True},
            {"name": "n2", "url": "https://raw.githubusercontent.com/c/d", "enabled": False},
        ],
        "free_proxy_apis": [
            {"name": "p1", "url": "https://raw.githubusercontent.com/e/f", "enabled": True},
        ],
    }
    config_path = tmp_path / "sources.json"
    config_path.write_text(__import__("json").dumps(config), encoding="utf-8")

    # 让 fetch 直接返回源名字，便于断言归类
    monkeypatch.setattr(crawler, "fetch", lambda url, *a, **kw: url.split("/")[-1])

    result = crawler.crawl(config_path=config_path, max_workers=2)
    assert len(result["nodes"]) == 1
    assert result["nodes"][0]["name"] == "n1"
    assert len(result["proxies"]) == 1
    assert result["proxies"][0]["name"] == "p1"


def test_crawl_returns_empty_when_all_disabled(tmp_path, monkeypatch):
    config = {
        "free_node_sources": [{"name": "n", "url": "https://raw.githubusercontent.com/a/b", "enabled": False}],
        "free_proxy_apis": [],
    }
    config_path = tmp_path / "sources.json"
    config_path.write_text(__import__("json").dumps(config), encoding="utf-8")
    result = crawler.crawl(config_path=config_path)
    assert result == {"nodes": [], "proxies": []}


def test_crawl_respects_env_workers(tmp_path, monkeypatch):
    config = {
        "free_node_sources": [
            {"name": f"n{i}", "url": f"https://raw.githubusercontent.com/a/b{i}", "enabled": True}
            for i in range(5)
        ],
        "free_proxy_apis": [],
    }
    config_path = tmp_path / "sources.json"
    config_path.write_text(__import__("json").dumps(config), encoding="utf-8")
    monkeypatch.setattr(crawler, "fetch", lambda *a, **kw: "")
    monkeypatch.setenv("FREENODE_CRAWL_WORKERS", "3")
    result = crawler.crawl(config_path=config_path)
    assert len(result["nodes"]) == 5
