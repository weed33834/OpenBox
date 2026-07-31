"""根级测试共享 fixture。

scripts/ 已通过 pyproject.toml 的 pythonpath 配置自动加入 import 搜索路径，
所以测试文件不需要再手动 sys.path.insert。这里只放共享 fixture。
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest


@pytest.fixture
def tmp_sources_file(tmp_path: Path) -> Path:
    """生成一个最小可用的 sources.json 临时文件，返回路径。"""
    config = {
        "free_node_sources": [
            {
                "name": "test-node-src",
                "url": "https://raw.githubusercontent.com/test/nodes",
                "enabled": True,
            }
        ],
        "free_proxy_apis": [
            {
                "name": "test-proxy-src",
                "url": "https://raw.githubusercontent.com/test/proxies",
                "enabled": True,
                "proxy_scheme": "http",
            }
        ],
    }
    path = tmp_path / "sources.json"
    path.write_text(json.dumps(config), encoding="utf-8")
    return path


@pytest.fixture
def sample_vmess_link() -> str:
    """一个可解析的 vmess 测试链接。"""
    import base64

    payload = {
        "v": "2",
        "ps": "test-node",
        "add": "1.2.3.4",
        "port": "443",
        "id": "b831381d-6324-4d53-ad4f-8cda48b30811",
        "aid": "0",
        "net": "ws",
        "type": "none",
        "host": "example.com",
        "path": "/path",
        "tls": "tls",
    }
    encoded = base64.b64encode(json.dumps(payload).encode("utf-8")).decode("ascii")
    return f"vmess://{encoded}"


@pytest.fixture
def sample_ss_link() -> str:
    """一个可解析的 ss 测试链接。"""
    import base64

    # method:password@host:port 的 base64
    raw = "aes-256-gcm:password@1.2.3.4:8388"
    encoded = base64.urlsafe_b64encode(raw.encode("utf-8")).decode("ascii").rstrip("=")
    return f"ss://{encoded}#test-ss"
