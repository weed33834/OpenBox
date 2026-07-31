import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

from verifier import (
    is_private_host,
    parse_endpoint,
    query_geo_api,
    stats_summary,
    verify_node,
    verify_node_protocol,
    verify_nodes,
)


class FakeSocket:
    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass

    def close(self):
        pass


class _Monkeypatch:
    """Minimal stand-in for pytest's monkeypatch fixture.

    Saves original values on ``setattr`` so they can be restored via ``undo()``.
    """

    def __init__(self):
        self._originals: list = []

    def setattr(self, obj, name, value):
        original = getattr(obj, name)
        self._originals.append((obj, name, original))
        setattr(obj, name, value)

    def undo(self):
        while self._originals:
            obj, name, original = self._originals.pop()
            setattr(obj, name, original)


def _mp(monkeypatch):
    return monkeypatch if monkeypatch is not None else _Monkeypatch()


def test_parse_endpoint_ss():
    host, port = parse_endpoint("ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ=@example.com:443")
    assert host == "example.com"
    assert port == 443


def test_parse_endpoint_trojan():
    host, port = parse_endpoint("trojan://pass@example.com:443")
    assert host == "example.com"
    assert port == 443


def test_parse_endpoint_vless():
    host, port = parse_endpoint("vless://uuid@example.com:443?type=tcp")
    assert host == "example.com"
    assert port == 443


def test_parse_endpoint_vmess():
    host, port = parse_endpoint(
        "vmess://eyJhZGQiOiJleGFtcGxlLmNvbSIsInBvcnQiOiI0NDMifQ=="
    )
    assert host == "example.com"
    assert port == 443


def test_parse_endpoint_ipv6():
    host, port = parse_endpoint("vless://uuid@[2001:db8::1]:443?type=tcp")
    assert host == "2001:db8::1"
    assert port == 443


def test_parse_endpoint_invalid():
    host, port = parse_endpoint("not-a-link")
    assert host is None
    assert port is None


def test_verify_node_alive(monkeypatch):
    import verifier

    mp = _mp(monkeypatch)

    def fake_create_connection(addr, timeout=None):
        return FakeSocket()

    mp.setattr(verifier.socket, "create_connection", fake_create_connection)

    # Mock socket.create_connection so no real network request is made.
    result = verify_node("ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ=@example.com:443", timeout=5, geo_enabled=False)
    assert "link" in result
    assert "alive" in result
    assert result["alive"] is True
    assert "latency_ms" in result


def test_verify_node_unreachable(monkeypatch=None):
    import verifier

    mp = _mp(monkeypatch)

    def fake_create_connection(addr, timeout=None):
        raise ConnectionRefusedError(111, "Connection refused")

    mp.setattr(verifier.socket, "create_connection", fake_create_connection)

    # Deterministic: no real network connection is attempted.
    result = verify_node("ss://YWVzLTI1Ni1nY206cGFzcw==@127.0.0.1:1", timeout=1, geo_enabled=False)
    assert result["alive"] is False
    assert result["region"] == "private"


def test_verify_node_latency_ms(monkeypatch):
    import verifier

    mp = _mp(monkeypatch)

    def fake_create_connection(addr, timeout=None):
        time.sleep(0.01)
        return FakeSocket()

    mp.setattr(verifier.socket, "create_connection", fake_create_connection)

    link = "ss://YWVzLTI1Ni1nY206cGFzcw==@1.2.3.4:443#test"
    result = verify_node(link, timeout=2, geo_enabled=False)
    assert result["alive"] is True
    assert result["latency_ms"] is not None
    assert 5 <= result["latency_ms"] < 200


def test_verify_node_region(monkeypatch):
    import verifier

    mp = _mp(monkeypatch)

    def fake_create_connection(addr, timeout=None):
        return FakeSocket()

    mp.setattr(verifier.socket, "create_connection", fake_create_connection)
    mp.setattr(verifier, "resolve_ip", lambda host: "8.8.8.8")
    mp.setattr(verifier, "query_geo_api", lambda ip: "US/California")

    link = "ss://YWVzLTI1Ni1nY206cGFzcw==@1.2.3.4:443#test"
    result = verify_node(link, timeout=2, geo_enabled=True)
    assert result["alive"] is True
    assert result["region"] == "US/California"


def test_verify_node_private_host_blocked(monkeypatch):
    """SSRF defence: private hosts must be blocked before any TCP connection."""
    import verifier

    mp = _mp(monkeypatch)

    called = []

    def fake_tcp_check(host, port, timeout=None):
        called.append((host, port))
        return True, 1.0, None

    mp.setattr(verifier, "tcp_check", fake_tcp_check)

    result = verify_node(
        "ss://YWVzLTI1Ni1nY206cGFzcw==@127.0.0.1:443#test",
        timeout=2,
        geo_enabled=False,
    )
    assert result["alive"] is False
    assert result["region"] == "private"
    assert result["error"] == "private host blocked"
    assert len(called) == 0  # tcp_check was never called


def test_verify_node_dns_rebinding(monkeypatch):
    """DNS rebinding defence: domain resolving to a private IP must be blocked."""
    import verifier

    mp = _mp(monkeypatch)

    def fake_create_connection(addr, timeout=None):
        return FakeSocket()

    mp.setattr(verifier.socket, "create_connection", fake_create_connection)
    # Domain resolves to a private IP → must be blocked after resolution.
    mp.setattr(verifier, "resolve_ip", lambda host: "127.0.0.1")

    result = verify_node(
        "ss://YWVzLTI1Ni1nY206cGFzcw==@evil.com:443#test",
        timeout=2,
        geo_enabled=False,
    )
    assert result["alive"] is False
    assert result["region"] == "private"
    assert result["error"] == "resolved to private IP"


def test_is_private_host():
    assert is_private_host("127.0.0.1") is True
    assert is_private_host("192.168.1.1") is True
    assert is_private_host("10.0.0.1") is True
    assert is_private_host("::1") is True
    assert is_private_host("example.com") is False
    assert is_private_host("localhost.local") is True


def test_geo_cache(monkeypatch):
    import verifier

    mp = _mp(monkeypatch)
    calls = []

    def fake_fetch(ip):
        calls.append(ip)
        return {"country": "JP", "regionName": "Tokyo"}

    mp.setattr(verifier, "_fetch_geo_data", fake_fetch)
    verifier.query_geo_api.cache_clear()

    assert query_geo_api("9.9.9.9") == "JP/Tokyo"
    assert query_geo_api("9.9.9.9") == "JP/Tokyo"
    assert len(calls) == 1


def test_stats_summary():
    results = [
        {"alive": True, "latency_ms": 100, "region": "US/California"},
        {"alive": True, "latency_ms": 200, "region": "CN/Beijing"},
        {"alive": False, "latency_ms": None, "region": "unknown"},
    ]
    stats = stats_summary(results)
    assert stats["total"] == 3
    assert stats["alive"] == 2
    assert stats["avg_latency"] == 150.0
    assert abs(stats["survival_rate"] - 66.7) < 0.01
    assert stats["regions"]["US/California"] == 1
    assert stats["regions"]["CN/Beijing"] == 1


def test_stats_summary_includes_verify_level():
    """stats_summary 要带上 verify_level 信息。"""
    results = [
        {"alive": True, "latency_ms": 100, "region": "US"},
    ]
    stats = stats_summary(results, verify_level="protocol")
    assert stats["verify_level"] == "protocol"
    # 默认值是 tcp
    stats_default = stats_summary(results)
    assert stats_default["verify_level"] == "tcp"


# ─── verify_node_protocol：二段协议级握手验证 ──────────────────────────


def test_verify_node_protocol_tcp_only(monkeypatch):
    """vmess 节点只做 TCP 验证，不跑协议握手。"""
    import verifier

    mp = _mp(monkeypatch)
    mp.setattr(verifier.socket, "create_connection", lambda addr, timeout=None: FakeSocket())

    link = "vmess://eyJhZGQiOiJleGFtcGxlLmNvbSIsInBvcnQiOiI0NDMifQ=="
    result = verify_node_protocol(link, timeout=2)
    assert result["alive"] is True
    assert result["verify_method"] == "tcp_only"
    assert result["latency_ms"] is not None
    assert "tls_handshake_ok" not in result  # vmess 不做 TLS


def test_verify_node_protocol_trojan_tls(monkeypatch):
    """trojan 节点做 TLS 握手（mock ssl）。"""
    import verifier

    class FakeSSLSocket:
        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

    class FakeSSLContext:
        def __init__(self):
            self.check_hostname = True
            self.verify_mode = None

        def wrap_socket(self, sock, server_hostname=None):
            return FakeSSLSocket()

    mp = _mp(monkeypatch)
    mp.setattr(verifier.socket, "create_connection", lambda addr, timeout=None: FakeSocket())
    mp.setattr(verifier.ssl, "create_default_context", lambda: FakeSSLContext())

    link = "trojan://pass@example.com:443"
    result = verify_node_protocol(link, timeout=2)
    assert result["alive"] is True
    assert result["verify_method"] == "tls_handshake"
    assert result.get("tls_handshake_ok") is True


def test_verify_node_protocol_ss_probe(monkeypatch):
    """ss 节点发一字节探测，无 RST 视为活。"""

    class FakeProbeSocket:
        def settimeout(self, t):
            pass

        def send(self, data):
            return len(data)

        def recv(self, size):
            # 没回包也没 RST，触发 TimeoutError 分支
            raise TimeoutError("timed out")

        def close(self):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

    mp = _mp(monkeypatch)
    mp.setattr(
        "verifier.socket.create_connection", lambda addr, timeout=None: FakeProbeSocket()
    )

    link = "ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ=@example.com:443"
    result = verify_node_protocol(link, timeout=2)
    assert result["alive"] is True
    assert result["verify_method"] == "ss_probe"


def test_verify_nodes_protocol_level(monkeypatch):
    """verify_level=protocol 时跑二段验证：TCP 成功的节点会被 verify_node_protocol 复核。"""
    import verifier

    mp = _mp(monkeypatch)
    mp.setattr(verifier.socket, "create_connection", lambda addr, timeout=None: FakeSocket())
    mp.setattr(verifier, "resolve_ip", lambda host: "1.2.3.4")
    mp.setattr(verifier, "query_geo_api", lambda ip: "unknown")
    # 显式清掉环境变量，避免外部环境污染
    mp.setattr(verifier.os, "environ", {})

    called = []

    def fake_proto(link, timeout=5.0):
        called.append(link)
        return {"alive": True, "latency_ms": 50, "verify_method": "tcp_only"}

    mp.setattr(verifier, "verify_node_protocol", fake_proto)

    links = ["ss://YWVzLTI1Ni1nY206cGFzcw==@1.2.3.4:443#test"]
    results = verify_nodes(links, geo_enabled=False, verify_level="protocol")
    assert len(results) == 1
    assert results[0]["alive"] is True
    assert results[0]["verify_method"] == "tcp_only"
    # 二段验证被调用了一次
    assert len(called) == 1


def test_verify_nodes_tcp_level(monkeypatch):
    """verify_level=tcp 时只做 TCP，不跑二段验证（向后兼容）。"""
    import verifier

    mp = _mp(monkeypatch)
    mp.setattr(verifier.socket, "create_connection", lambda addr, timeout=None: FakeSocket())
    mp.setattr(verifier, "resolve_ip", lambda host: "1.2.3.4")
    mp.setattr(verifier, "query_geo_api", lambda ip: "unknown")
    mp.setattr(verifier.os, "environ", {})

    called = []

    def fake_proto(link, timeout=5.0):
        called.append(link)
        return {"alive": True, "latency_ms": 50, "verify_method": "tcp_only"}

    mp.setattr(verifier, "verify_node_protocol", fake_proto)

    links = ["ss://YWVzLTI1Ni1nY206cGFzcw==@1.2.3.4:443#test"]
    results = verify_nodes(links, geo_enabled=False, verify_level="tcp")
    assert len(results) == 1
    assert results[0]["alive"] is True
    assert results[0]["verify_method"] == "tcp_only"
    # tcp 模式不调用协议验证
    assert len(called) == 0


if __name__ == "__main__":
    test_parse_endpoint_ss()
    test_parse_endpoint_trojan()
    test_parse_endpoint_vless()
    test_parse_endpoint_vmess()
    test_parse_endpoint_ipv6()
    test_parse_endpoint_invalid()

    mp = _Monkeypatch()
    test_verify_node_alive(mp)
    mp.undo()

    mp = _Monkeypatch()
    test_verify_node_unreachable(mp)
    mp.undo()

    mp = _Monkeypatch()
    test_verify_node_latency_ms(mp)
    mp.undo()

    mp = _Monkeypatch()
    test_verify_node_region(mp)
    mp.undo()

    mp = _Monkeypatch()
    test_verify_node_private_host_blocked(mp)
    mp.undo()

    mp = _Monkeypatch()
    test_verify_node_dns_rebinding(mp)
    mp.undo()

    test_is_private_host()

    mp = _Monkeypatch()
    test_geo_cache(mp)
    mp.undo()

    test_stats_summary()
    test_stats_summary_includes_verify_level()

    mp = _Monkeypatch()
    test_verify_node_protocol_tcp_only(mp)
    mp.undo()

    mp = _Monkeypatch()
    test_verify_node_protocol_trojan_tls(mp)
    mp.undo()

    mp = _Monkeypatch()
    test_verify_node_protocol_ss_probe(mp)
    mp.undo()

    mp = _Monkeypatch()
    test_verify_nodes_protocol_level(mp)
    mp.undo()

    mp = _Monkeypatch()
    test_verify_nodes_tcp_level(mp)
    mp.undo()

    print("verifier tests passed")
