"""安全加固回归测试。

覆盖本轮安全审计修复的高优先级问题：
- SSRF：云元数据端点、IPv6 映射 IPv4、is_private_host 边界
- 解析器内存爆炸：超长 base64/vmess 链接被拒
- YAML 注入：节点 name 含特殊字符时不污染输出
- verifier 资源：异常路径 socket 不泄漏
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

import formatter
import parser as parser_mod
import verifier

import utils
from utils import ConfigurationError, is_private_host, safe_b64decode, validate_url

# ─── SSRF：metadata endpoint / IPv6 映射 ──────────────────────────────


def test_validate_url_blocks_metadata_endpoint(monkeypatch):
    """169.254.169.254 即便被误加进白名单也必须被拒。"""
    monkeypatch.setenv("FREENODE_ALLOWED_HOSTS", "169.254.169.254,raw.githubusercontent.com")
    try:
        validate_url("https://169.254.169.254/latest/meta-data/iam/security-credentials/")
        raise AssertionError("metadata endpoint should be blocked")
    except ConfigurationError as exc:
        assert "private or reserved" in str(exc)


def test_validate_url_blocks_ipv6_mapped(monkeypatch):
    """::ffff:127.0.0.1 即便被误加进白名单也必须被拒。"""
    monkeypatch.setenv("FREENODE_ALLOWED_HOSTS", "::ffff:127.0.0.1")
    try:
        validate_url("https://[::ffff:127.0.0.1]/")
        raise AssertionError("ipv6-mapped loopback should be blocked")
    except ConfigurationError as exc:
        assert "private or reserved" in str(exc)


def test_is_private_host_ipv6_mapped():
    """IPv4-mapped IPv6 地址必须被识别为私有。"""
    assert is_private_host("::ffff:127.0.0.1") is True
    assert is_private_host("::FFFF:127.0.0.1") is True  # 大小写无关
    assert is_private_host("::ffff:7f00:1") is True  # 十六进制写法
    assert is_private_host("::ffff:169.254.169.254") is True  # 映射后的元数据端点
    assert is_private_host("::ffff:10.0.0.1") is True
    assert is_private_host("::ffff:192.168.1.1") is True
    # bracketed 形式也要拦
    assert is_private_host("[::ffff:127.0.0.1]") is True
    # 映射后的公网 IP 不应误判
    assert is_private_host("::ffff:8.8.8.8") is False


def test_is_private_host_cgnat_blocked():
    """CGNAT 100.64.0.0/10 属于非全局地址，也应被拦。"""
    assert is_private_host("100.64.0.1") is True
    assert is_private_host("100.127.255.255") is True
    # 100.128.0.0 之后是公网，不应误拦
    assert is_private_host("100.128.0.1") is False


# ─── 解析器内存爆炸 ───────────────────────────────────────────────────


def test_parser_size_limit():
    """超大 base64 输入与超长 vmess 链接都必须被拒，不能解出来。"""
    # safe_b64decode 直接拒掉超长输入
    huge = "A" * (utils.MAX_B64_DECODE_LEN + 1)
    assert safe_b64decode(huge) is None

    # 超长 vmess 链接解码返回 None，不进 json.loads
    big_payload = "A" * (parser_mod.MAX_VMESS_LINK_LEN + 1)
    assert parser_mod.decode_vmess("vmess://" + big_payload) is None

    # 正常的小 payload 不受影响（回归保护）
    import base64
    import json

    payload = {"add": "example.com", "port": "443", "id": "uuid"}
    b64 = base64.b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    cfg = parser_mod.decode_vmess("vmess://" + b64)
    assert cfg is not None
    assert cfg["add"] == "example.com"


# ─── formatter YAML 注入 ─────────────────────────────────────────────


def _malicious_ss_link() -> str:
    """构造一个 name fragment 含换行/冒号/引号的恶意 ss 链接。

    fragment 会被 unquote 还原成 'evil\n\nhost: "127.0.0.1"'，
    试图在 YAML 里注入新的 host 键。
    """
    import base64

    auth = base64.urlsafe_b64encode(b"aes-256-gcm:password").decode().rstrip("=")
    # URL 编码换行/冒号/引号/空格
    fragment = "evil%0A%0Ahost%3A%20%22127.0.0.1%22"
    return f"ss://{auth}@example.com:443#{fragment}"


def test_formatter_yaml_injection():
    """主路径（PyYAML 可用）：恶意 name 不能注入额外键或覆盖 server。"""
    import re

    try:
        import yaml
    except ImportError:  # pragma: no cover
        return

    output = formatter.to_clash_yaml([_malicious_ss_link()])
    parsed = yaml.safe_load(output)
    proxies = parsed["proxies"]
    # 只有一个 proxy，注入的 'host:' 没有造出第二个 proxy
    assert len(proxies) == 1
    name = proxies[0]["name"]
    # name 只能是安全字符，不含换行/冒号
    assert re.match(r"^[A-Za-z0-9\-_.]+$", name), f"unsafe name: {name!r}"
    assert "\n" not in name and ":" not in name
    # 注入的 host 键不应作为独立字段出现，server 仍是真实的 example.com
    assert proxies[0]["server"] == "example.com"
    # 不能多出注入的 'host' 键
    assert "host" not in proxies[0]


# ─── verifier 资源：异常路径 socket 关闭 ─────────────────────────────


def test_verifier_socket_closed_on_error(monkeypatch):
    """tcp_check 在成功路径与异常路径下都不应泄漏 socket。"""

    closed = {"count": 0}

    class TrackingSocket:
        def __enter__(self):
            return self

        def __exit__(self, *args):
            closed["count"] += 1
            return False

    # 1) 成功路径：socket 必须被 context manager 关闭
    monkeypatch.setattr(
        verifier.socket, "create_connection", lambda addr, timeout=None: TrackingSocket()
    )
    ok, _lat, err = verifier.tcp_check("example.com", 443, timeout=1)
    assert ok is True and err is None
    assert closed["count"] == 1, "success path must close the socket"

    # 2) create_connection 抛错：没有 socket 被创建，自然不会泄漏
    closed["count"] = 0

    def raise_refused(addr, timeout=None):
        raise ConnectionRefusedError(111, "Connection refused")

    monkeypatch.setattr(verifier.socket, "create_connection", raise_refused)
    ok, _lat, err = verifier.tcp_check("example.com", 443, timeout=1)
    assert ok is False
    assert err == "connection refused"
    assert closed["count"] == 0, "no socket created on connect failure -> no leak"

    # 3) socket 已创建后再抛异常：context manager 仍要关闭 socket
    closed["count"] = 0
    monkeypatch.setattr(
        verifier.socket, "create_connection", lambda addr, timeout=None: TrackingSocket()
    )

    call_state = {"n": 0}

    def perf_counter_boom():
        call_state["n"] += 1
        # 第一次调用是 start=perf_counter()（连接前），放行；
        # 第二次是连接后的 latency 计算，抛错模拟连接成功后的异常
        if call_state["n"] == 2:
            raise RuntimeError("boom after connect")
        return 0.0

    monkeypatch.setattr(verifier.time, "perf_counter", perf_counter_boom)
    ok, _lat, err = verifier.tcp_check("example.com", 443, timeout=1)
    assert ok is False
    assert err == "error: RuntimeError"
    assert closed["count"] == 1, "socket created before error must still be closed"


if __name__ == "__main__":
    test_validate_url_blocks_metadata_endpoint(__import__("pytest").monkeypatch())
    test_validate_url_blocks_ipv6_mapped(__import__("pytest").monkeypatch())
    test_is_private_host_ipv6_mapped()
    test_is_private_host_cgnat_blocked()
    test_parser_size_limit()
    test_formatter_yaml_injection()
    test_verifier_socket_closed_on_error(__import__("pytest").monkeypatch())
    print("security hardening tests passed")
