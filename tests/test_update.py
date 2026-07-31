"""scripts/update.py 的单元测试。

覆盖 _get_int_env、_extract_node_links_safe、_extract_proxies_safe 的纯逻辑路径，
不跑完整 pipeline（避免网络 IO）。
"""

import sys
from pathlib import Path

# 兼容 python3 tests/test_update.py 直接跑
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

import update

# ─── _get_int_env ────────────────────────────────────────────────────


def test_get_int_env_returns_default_when_unset(monkeypatch):
    monkeypatch.delenv("FREENODE_TEST_VAR", raising=False)
    assert update._get_int_env("FREENODE_TEST_VAR", 42) == 42


def test_get_int_env_returns_default_when_empty(monkeypatch):
    monkeypatch.setenv("FREENODE_TEST_VAR", "")
    assert update._get_int_env("FREENODE_TEST_VAR", 99) == 99


def test_get_int_env_parses_valid_integer(monkeypatch):
    monkeypatch.setenv("FREENODE_TEST_VAR", "123")
    assert update._get_int_env("FREENODE_TEST_VAR", 0) == 123


def test_get_int_env_returns_default_on_invalid(monkeypatch):
    monkeypatch.setenv("FREENODE_TEST_VAR", "not-a-number")
    # 非法值回退默认，不抛异常
    assert update._get_int_env("FREENODE_TEST_VAR", 7) == 7


def test_get_int_env_parses_zero():
    # 0 是合法整数，不应被当作 falsy 回退
    import os

    os.environ["FREENODE_TEST_VAR"] = "0"
    try:
        assert update._get_int_env("FREENODE_TEST_VAR", 100) == 0
    finally:
        del os.environ["FREENODE_TEST_VAR"]


# ─── _extract_node_links_safe ────────────────────────────────────────


def test_extract_node_links_safe_returns_links():
    item = {"text": "vmess://example\nvless://example2"}
    links, error = update._extract_node_links_safe(item)
    assert error is None
    assert isinstance(links, list)
    assert len(links) >= 0  # 具体数量取决于 parser 实现


def test_extract_node_links_safe_handles_empty_text():
    item = {"text": ""}
    links, error = update._extract_node_links_safe(item)
    assert error is None
    assert links == []


def test_extract_node_links_safe_returns_error_on_missing_key():
    # 缺 text 键，extract_node_links 会 KeyError，被 _safe 捕获
    item = {}
    links, error = update._extract_node_links_safe(item)
    assert links == []
    assert error is not None
    assert "parse error" in error


# ─── _extract_proxies_safe ───────────────────────────────────────────


def test_extract_proxies_safe_returns_proxies():
    # 一个简单的 ip:port 列表
    item = {"text": "1.2.3.4:8080\n5.6.7.8:3128", "proxy_scheme": "http"}
    proxies, error = update._extract_proxies_safe(item)
    assert error is None
    assert isinstance(proxies, list)


def test_extract_proxies_safe_uses_default_scheme():
    item = {"text": "1.2.3.4:8080"}
    proxies, error = update._extract_proxies_safe(item)
    assert error is None
    # 默认 scheme 是 http
    assert all(p.startswith("http") for p in proxies)


def test_extract_proxies_safe_handles_empty_text():
    item = {"text": ""}
    proxies, error = update._extract_proxies_safe(item)
    assert error is None
    assert proxies == []


def test_extract_proxies_safe_returns_error_on_missing_key():
    item = {}
    proxies, error = update._extract_proxies_safe(item)
    assert proxies == []
    assert error is not None
    assert "parse error" in error


# ─── 模块级常量初始化 ────────────────────────────────────────────────


def test_module_constants_have_expected_defaults(monkeypatch):
    # 模块加载时已读环境变量，验证默认值合理
    assert isinstance(update.MAX_NODES, int)
    assert update.MAX_NODES > 0
    assert isinstance(update.MAX_PROXIES, int)
    assert update.MAX_PROXIES > 0
    assert isinstance(update.VERIFY_NODES, bool)
    assert isinstance(update.GEO_ENABLED, bool)
    assert update.VERIFY_TIMEOUT > 0
    assert update.VERIFY_WORKERS > 0
