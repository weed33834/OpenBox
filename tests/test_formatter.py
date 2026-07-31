import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

from formatter import (
    _compute_stats,
    to_clash_yaml,
    to_nodes_detail,
    to_proxy_list,
    to_v2ray_subscription,
)

from utils import is_private_host


def test_to_clash_yaml_basic():
    links = [
        "ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ=@example.com:443#test",
        "trojan://pass@example.com:443#trojan-test",
    ]
    yaml = to_clash_yaml(links)
    assert "proxies:" in yaml
    assert 'name: "test"' in yaml or "name: test" in yaml
    assert 'name: "trojan-test"' in yaml or "name: trojan-test" in yaml
    assert "proxy-groups:" in yaml


def test_to_clash_yaml_duplicate_names():
    links = [
        "ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ=@example.com:443#same",
        "trojan://pass@example.com:443#same",
    ]
    yaml = to_clash_yaml(links)
    assert ('name: "same"' in yaml or "name: same" in yaml)
    assert ('name: "same_2"' in yaml or "name: same_2" in yaml)


def test_to_clash_yaml_private_ip_filtered():
    links = [
        "ss://YWVzLTI1Ni1nY206cGFzcw==@127.0.0.1:1080#local",
        "ss://YWVzLTI1Ni1nY206cGFzcw==@192.168.1.1:1080#local",
    ]
    yaml = to_clash_yaml(links)
    # Proxies section starts after "proxies:" and ends before "proxy-groups:"
    proxies_section = yaml.split("proxies:")[1].split("proxy-groups:")[0]
    assert "127.0.0.1" not in proxies_section
    assert "192.168.1.1" not in proxies_section
    # No nodes should be written, so group falls back to DIRECT
    assert "DIRECT" in yaml


def test_to_clash_yaml_disclaimer():
    yaml = to_clash_yaml([])
    assert "DISCLAIMER" in yaml
    assert "educational" in yaml.lower() or "research" in yaml.lower()


def test_to_v2ray_subscription():
    links = ["ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ=@example.com:443#test"]
    sub = to_v2ray_subscription(links)
    assert sub
    assert not sub.startswith("#")
    import base64
    decoded = base64.b64decode(sub).decode()
    assert "example.com" in decoded


def test_to_v2ray_subscription_private_ip_filtered():
    links = [
        "ss://YWVzLTI1Ni1nY206cGFzcw==@127.0.0.1:1080#local",
        "ss://YWVzLTI1Ni1nY206cGFzcw==@example.com:443#public",
    ]
    sub = to_v2ray_subscription(links)
    import base64
    decoded = base64.urlsafe_b64decode(sub + "=" * (-len(sub) % 4)).decode()
    assert "127.0.0.1" not in decoded
    assert "example.com" in decoded


def test_to_proxy_list():
    proxies = ["http://1.2.3.4:8080", "socks5://5.6.7.8:1080"]
    text = to_proxy_list(proxies)
    assert "http://1.2.3.4:8080" in text
    assert "socks5://5.6.7.8:1080" in text


def test_to_proxy_list_private_ip_filtered():
    proxies = ["http://127.0.0.1:8080", "http://1.2.3.4:8080"]
    text = to_proxy_list(proxies)
    assert "127.0.0.1" not in text
    assert "1.2.3.4" in text


def test_to_proxy_list_ipv6_private_filtered():
    # Link-local IPv6 proxies must be filtered; public IPv6 proxies kept.
    proxies = ["http://[fe80::1]:8080", "http://[2606:4700:4700::1111]:8080"]
    text = to_proxy_list(proxies)
    assert "fe80::1" not in text
    assert "2606:4700:4700::1111" in text


def test_write_outputs_v2ray_txt_is_pure_base64(tmp_path, monkeypatch):
    """v2ray.txt 必须是纯 base64（回归 B2）：客户端对整个响应体解码，
    '#'-开头的统计注释行会让 base64 解码失败。"""
    import base64

    from formatter import write_outputs

    monkeypatch.setattr("formatter.NODES_DIR", tmp_path)

    results = [
        {"link": "ss://YWVzLTI1Ni1nY206cGFzcw==@example.com:443#test", "alive": True, "latency_ms": 50}
    ]
    write_outputs(results, [], verified=True)

    content = (tmp_path / "v2ray.txt").read_text(encoding="utf-8")
    # 非空订阅必须不含 '#' 注释行，否则破坏客户端 base64 解码
    assert not content.startswith("#"), "v2ray.txt must not start with '#' comment"
    # 整个文件体必须能被 base64 解码
    padded = content + "=" * (-len(content) % 4)
    decoded = base64.urlsafe_b64decode(padded).decode("utf-8", errors="ignore")
    assert "example.com" in decoded


def test_is_private_host():
    assert is_private_host("127.0.0.1") is True
    assert is_private_host("192.168.1.1") is True
    assert is_private_host("10.0.0.1") is True
    assert is_private_host("example.com") is False
    assert is_private_host("localhost.local") is True


def test_compute_stats_all_dead():
    items = [
        {"link": "ss://a", "alive": False, "latency_ms": None, "region": "unknown"},
        {"link": "ss://b", "alive": False, "latency_ms": None, "region": "unknown"},
    ]
    stats = _compute_stats(items)
    assert stats["total"] == 2
    assert stats["alive"] == 0
    assert stats["survival_rate"] == 0.0


def test_compute_stats_mixed():
    items = [
        {"link": "ss://a", "alive": True, "latency_ms": 120, "region": "HK"},
        {"link": "ss://b", "alive": False, "latency_ms": None, "region": "unknown"},
    ]
    stats = _compute_stats(items)
    assert stats["total"] == 2
    assert stats["alive"] == 1
    assert stats["survival_rate"] == 50.0
    assert stats["avg_latency"] == 120.0


def test_compute_stats_raw_links():
    items = ["ss://a", "ss://b"]
    stats = _compute_stats(items)
    assert stats["total"] == 2
    # Raw links carry no liveness flag; survival must be reported as unknown.
    assert stats["alive"] is None
    assert stats["survival_rate"] is None


# ─── to_nodes_detail ───────────────────────────────────────────────────


def test_to_nodes_detail_verified():
    """Verified dict items keep alive / latency_ms / region per node."""
    items = [
        {
            "link": "ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ=@example.com:443#test",
            "alive": True,
            "latency_ms": 120,
            "region": "HK",
        },
        {
            "link": "trojan://pass@example.com:443#trojan-test",
            "alive": False,
            "latency_ms": None,
            "region": "US",
        },
    ]
    result = json.loads(to_nodes_detail(items, verified=True))
    assert result["total"] == 2
    assert result["verified"] is True

    node0 = result["nodes"][0]
    assert node0["alive"] is True
    assert node0["latency_ms"] == 120
    assert node0["region"] == "HK"

    node1 = result["nodes"][1]
    assert node1["alive"] is False
    assert node1["latency_ms"] is None
    assert node1["region"] == "US"


def test_to_nodes_detail_unverified():
    """Unverified plain-string links yield alive/latency None, region unknown."""
    items = [
        "ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ=@example.com:443#test",
        "trojan://pass@example.com:443#trojan-test",
    ]
    result = json.loads(to_nodes_detail(items, verified=False))
    assert result["total"] == 2
    assert result["verified"] is False
    for node in result["nodes"]:
        assert node["alive"] is None
        assert node["latency_ms"] is None
        assert node["region"] == "unknown"


def test_to_nodes_detail_private_host_filtered():
    """Nodes whose server resolves to a private host are dropped."""
    items = [
        "ss://YWVzLTI1Ni1nY206cGFzcw==@127.0.0.1:1080#local",
        "ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ=@example.com:443#public",
    ]
    result = json.loads(to_nodes_detail(items))
    assert result["total"] == 1
    assert result["nodes"][0]["server"] == "example.com"
    assert "127.0.0.1" not in [n["server"] for n in result["nodes"]]


def test_to_nodes_detail_fields():
    """Each node exposes name/protocol/server/port/region/alive/latency_ms."""
    items = [
        {
            "link": "ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ=@example.com:443#test",
            "alive": True,
            "latency_ms": 120,
            "region": "HK",
        },
    ]
    result = json.loads(to_nodes_detail(items, verified=True))
    node = result["nodes"][0]
    expected_fields = {"name", "protocol", "server", "port", "region", "alive", "latency_ms"}
    assert expected_fields.issubset(node.keys())
    assert node["name"] == "test"
    assert node["protocol"] == "ss"
    assert node["server"] == "example.com"
    assert node["port"] == 443
    assert node["region"] == "HK"
    assert node["alive"] is True
    assert node["latency_ms"] == 120


def test_to_nodes_detail_summary():
    """regions_summary and protocols_summary are computed and count-sorted desc."""
    items = [
        {
            "link": "ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ=@example.com:443#t1",
            "alive": True,
            "latency_ms": 120,
            "region": "HK",
        },
        {
            "link": "ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ=@other.com:8388#t2",
            "alive": True,
            "latency_ms": 200,
            "region": "HK",
        },
        {
            "link": "trojan://pass@example.com:443#t3",
            "alive": False,
            "latency_ms": None,
            "region": "US",
        },
    ]
    result = json.loads(to_nodes_detail(items))
    assert result["regions_summary"] == {"HK": 2, "US": 1}
    assert result["protocols_summary"] == {"ss": 2, "trojan": 1}


def test_to_nodes_detail_empty():
    """Empty input yields total=0 with empty nodes and summaries."""
    result = json.loads(to_nodes_detail([]))
    assert result["total"] == 0
    assert result["nodes"] == []
    assert result["regions_summary"] == {}
    assert result["protocols_summary"] == {}
    assert result["verified"] is False


if __name__ == "__main__":
    test_to_clash_yaml_basic()
    test_to_clash_yaml_duplicate_names()
    test_to_clash_yaml_private_ip_filtered()
    test_to_clash_yaml_disclaimer()
    test_to_v2ray_subscription()
    test_to_v2ray_subscription_private_ip_filtered()
    test_to_proxy_list()
    test_to_proxy_list_private_ip_filtered()
    test_to_proxy_list_ipv6_private_filtered()
    test_is_private_host()
    test_compute_stats_all_dead()
    test_compute_stats_mixed()
    test_compute_stats_raw_links()
    test_to_nodes_detail_verified()
    test_to_nodes_detail_unverified()
    test_to_nodes_detail_private_host_filtered()
    test_to_nodes_detail_fields()
    test_to_nodes_detail_summary()
    test_to_nodes_detail_empty()
    print("formatter tests passed")
