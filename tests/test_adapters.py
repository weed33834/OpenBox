"""adapters 单元测试。

mock 网络请求和 subprocess，不发真实请求、不真克隆 git 仓库。
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path
from unittest.mock import patch

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

import crawler
from adapters import get_adapter, register_adapter
from adapters.base import SourceAdapter
from adapters.git_repo import GitRepoAdapter
from adapters.github_raw import GithubRawAdapter
from adapters.html import HtmlAdapter
from adapters.rss import RssAdapter, parse_feed
from adapters.web_url import WebUrlAdapter

from utils import ConfigurationError, FetchError

# 一个能过 validate_url 的合法 URL（raw.githubusercontent.com 在白名单里）
_VALID_URL = "https://raw.githubusercontent.com/x/y/main/sub"


# ─── 协议 ──────────────────────────────────────────────────────────────


def test_builtin_adapters_satisfy_protocol():
    # runtime_checkable Protocol，验证所有内置 adapter 都满足接口
    for cls in (GithubRawAdapter, WebUrlAdapter, HtmlAdapter, GitRepoAdapter, RssAdapter):
        assert isinstance(cls(), SourceAdapter)


# ─── github_raw ────────────────────────────────────────────────────────


def test_github_raw_adapter_normal_fetch():
    adapter = GithubRawAdapter()
    source = {"url": _VALID_URL, "decode_base64": True}
    # crawler.fetch_source 内部会调 crawler.fetch（这里 mock 掉）
    with patch.object(crawler, "fetch", return_value="dm1lc3M6Ly9hYmM="):
        text = adapter.fetch(source)
    assert text == "vmess://abc"


def test_github_raw_adapter_rejects_invalid_url():
    adapter = GithubRawAdapter()
    # http 协议不在 allowed schemes 里
    source = {"url": "http://raw.githubusercontent.com/x/y"}
    with pytest.raises(ConfigurationError):
        adapter.fetch(source)


# ─── web_url ───────────────────────────────────────────────────────────


def test_web_url_adapter_normal_fetch():
    adapter = WebUrlAdapter()
    source = {"url": _VALID_URL}
    with patch.object(crawler, "fetch", return_value="raw-text"):
        text = adapter.fetch(source)
    assert text == "raw-text"


# ─── html ──────────────────────────────────────────────────────────────


def test_html_adapter_default_selector():
    # 不配 selector，默认抓所有 <pre> 和 <code>
    html = (
        "<html><body>"
        "<pre>line1\nline2</pre>"
        "<code>code1</code>"
        "<p>not me</p>"
        "</body></html>"
    )
    adapter = HtmlAdapter()
    source = {"url": _VALID_URL}
    with patch.object(crawler, "fetch", return_value=html):
        text = adapter.fetch(source)
    assert "line1" in text
    assert "line2" in text
    assert "code1" in text
    assert "not me" not in text


def test_html_adapter_custom_selector():
    # 配了 selector 只取对应元素
    html = (
        '<div class="sub"><pre>vless://a</pre></div>'
        "<pre>vless://b</pre>"
    )
    adapter = HtmlAdapter()
    source = {"url": _VALID_URL, "selector": "div.sub"}
    with patch.object(crawler, "fetch", return_value=html):
        text = adapter.fetch(source)
    assert "vless://a" in text
    assert "vless://b" not in text


def test_html_adapter_id_selector():
    # 顺带验一下 #id selector
    html = '<div id="main">aaa</div><div id="other">bbb</div>'
    adapter = HtmlAdapter()
    source = {"url": _VALID_URL, "selector": "#main"}
    with patch.object(crawler, "fetch", return_value=html):
        text = adapter.fetch(source)
    assert text == "aaa"


def test_html_adapter_attr_selector():
    # tag attr=value 形式
    html = '<pre data-kind="sub">ss-content</pre><pre>other</pre>'
    adapter = HtmlAdapter()
    source = {"url": _VALID_URL, "selector": "pre data-kind=sub"}
    with patch.object(crawler, "fetch", return_value=html):
        text = adapter.fetch(source)
    assert text == "ss-content"


def test_html_adapter_no_match():
    # selector 匹配不到返回空字符串
    html = "<html><body><div>nothing here</div></body></html>"
    adapter = HtmlAdapter()
    source = {"url": _VALID_URL, "selector": "pre"}
    with patch.object(crawler, "fetch", return_value=html):
        text = adapter.fetch(source)
    assert text == ""


# ─── git_repo ──────────────────────────────────────────────────────────


def test_git_repo_adapter():
    adapter = GitRepoAdapter()
    source = {
        "repo_url": "https://github.com/x/y.git",
        "file_patterns": ["*.txt", "sub/*"],
    }

    def fake_run(cmd, **kwargs):
        # cmd 最后一个参数是临时目录，往里塞点文件模拟 clone 结果
        tmpdir = cmd[-1]
        Path(tmpdir, "a.txt").write_text("content-a", encoding="utf-8")
        Path(tmpdir, "sub").mkdir()
        Path(tmpdir, "sub", "b.txt").write_text("content-b", encoding="utf-8")
        Path(tmpdir, "ignore.md").write_text("nope", encoding="utf-8")
        return subprocess.CompletedProcess(cmd, 0)

    with patch("shutil.which", return_value="/usr/bin/git"), \
            patch("subprocess.run", side_effect=fake_run):
        text = adapter.fetch(source)

    assert "content-a" in text
    assert "content-b" in text
    assert "nope" not in text


def test_git_repo_adapter_timeout():
    adapter = GitRepoAdapter()
    source = {"repo_url": "https://github.com/x/y.git", "file_patterns": ["*.txt"]}
    err = subprocess.TimeoutExpired(cmd=["git", "clone"], timeout=60)
    with patch("shutil.which", return_value="/usr/bin/git"), \
            patch("subprocess.run", side_effect=err), pytest.raises(FetchError, match="timed out"):
        adapter.fetch(source)


def test_git_repo_adapter_git_missing():
    adapter = GitRepoAdapter()
    source = {"repo_url": "https://github.com/x/y.git", "file_patterns": ["*.txt"]}
    with patch("shutil.which", return_value=None), \
            pytest.raises(FetchError, match="git command not found"):
        adapter.fetch(source)


# ─── rss ───────────────────────────────────────────────────────────────


def test_rss_adapter():
    rss_xml = """<?xml version="1.0"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Test</title>
    <item>
      <title>i1</title>
      <description>desc-1</description>
      <content:encoded><![CDATA[encoded-1]]></content:encoded>
    </item>
    <item>
      <description>desc-2</description>
    </item>
  </channel>
</rss>"""
    adapter = RssAdapter()
    source = {"url": _VALID_URL}
    with patch.object(crawler, "fetch", return_value=rss_xml):
        text = adapter.fetch(source)
    assert "desc-1" in text
    assert "encoded-1" in text
    assert "desc-2" in text
    # <title> 不是正文，不该出现 channel 级别的 Test
    assert "Test" not in text


def test_rss_adapter_atom():
    atom_xml = """<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Test Feed</title>
  <entry>
    <title>e1</title>
    <summary>sum-1</summary>
    <content>content-1</content>
  </entry>
  <entry>
    <summary>sum-2</summary>
  </entry>
</feed>"""
    adapter = RssAdapter()
    source = {"url": _VALID_URL}
    with patch.object(crawler, "fetch", return_value=atom_xml):
        text = adapter.fetch(source)
    assert "sum-1" in text
    assert "content-1" in text
    assert "sum-2" in text


def test_parse_feed_empty():
    # 没 item/entry 返回空
    assert parse_feed("<rss><channel><title>x</title></channel></rss>") == ""


# ─── 注册表 ────────────────────────────────────────────────────────────


def test_get_adapter_unknown_type():
    assert get_adapter("totally_unknown_type_xyz") is None


def test_get_adapter_returns_builtin():
    assert isinstance(get_adapter("github_raw"), GithubRawAdapter)
    assert isinstance(get_adapter("web_url"), WebUrlAdapter)
    assert isinstance(get_adapter("html"), HtmlAdapter)
    assert isinstance(get_adapter("git_repo"), GitRepoAdapter)
    assert isinstance(get_adapter("rss"), RssAdapter)


def test_register_custom_adapter():
    from adapters import _REGISTRY

    class _MyAdapter:
        @property
        def source_type(self) -> str:
            return "my_custom_test_type"

        def fetch(self, source: dict) -> str:
            return "custom"

    adapter = _MyAdapter()
    register_adapter(adapter)
    try:
        assert get_adapter("my_custom_test_type") is adapter
        assert "my_custom_test_type" in _REGISTRY
    finally:
        _REGISTRY.pop("my_custom_test_type", None)
    # 注销后拿不到了
    assert get_adapter("my_custom_test_type") is None


# ─── crawler 接入 adapter ──────────────────────────────────────────────


def test_fetch_source_safe_uses_adapter_when_type_registered(monkeypatch):
    # type 命中 adapter 时走 adapter.fetch，不走旧 fetch_source
    calls = []

    class _SpyAdapter:
        source_type = "github_raw"

        def fetch(self, source):
            calls.append(source["name"])
            return "from-adapter"

    monkeypatch.setattr(crawler, "get_adapter", lambda t: _SpyAdapter() if t == "github_raw" else None)
    result = crawler._fetch_source_safe(
        {"name": "src", "type": "github_raw", "url": _VALID_URL}, "nodes"
    )
    assert result is not None
    assert result["text"] == "from-adapter"
    assert calls == ["src"]


def test_fetch_source_safe_falls_back_when_no_adapter(monkeypatch):
    # 没 adapter 时退回旧 fetch_source，保证向后兼容
    monkeypatch.setattr(crawler, "get_adapter", lambda t: None)
    monkeypatch.setattr(crawler, "fetch", lambda *a, **kw: "fallback-text")
    result = crawler._fetch_source_safe(
        {"name": "src", "type": "weird_type", "url": _VALID_URL}, "nodes"
    )
    assert result is not None
    assert result["text"] == "fallback-text"
