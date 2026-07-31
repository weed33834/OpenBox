"""scripts/formatter.py 排序与按协议分组输出的单元测试。"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

from formatter import _sort_by_latency, to_clash_yaml_by_protocol

# ─── _sort_by_latency ────────────────────────────────────────────────


def test_sort_by_latency():
    """延迟排序正确：升序，低的排前面。"""
    items = [
        {"link": "ss://a", "alive": True, "latency_ms": 300, "region": "unknown"},
        {"link": "ss://b", "alive": True, "latency_ms": 100, "region": "unknown"},
        {"link": "ss://c", "alive": True, "latency_ms": 200, "region": "unknown"},
    ]
    sorted_items = _sort_by_latency(items)
    assert [i["latency_ms"] for i in sorted_items] == [100, 200, 300]


def test_sort_none_latency_last():
    """None 延迟排最后。"""
    items = [
        {"link": "ss://a", "alive": True, "latency_ms": None, "region": "unknown"},
        {"link": "ss://b", "alive": True, "latency_ms": 100, "region": "unknown"},
        {"link": "ss://c", "alive": False, "latency_ms": None, "region": "unknown"},
        {"link": "ss://d", "alive": True, "latency_ms": 50, "region": "unknown"},
    ]
    sorted_items = _sort_by_latency(items)
    # 前两个有延迟，按升序
    assert sorted_items[0]["latency_ms"] == 50
    assert sorted_items[1]["latency_ms"] == 100
    # 后两个是 None
    assert sorted_items[2]["latency_ms"] is None
    assert sorted_items[3]["latency_ms"] is None


def test_sort_stable():
    """相同延迟保持原相对顺序（稳定排序）。"""
    items = [
        {"link": "ss://a", "alive": True, "latency_ms": 100, "name": "a"},
        {"link": "ss://b", "alive": True, "latency_ms": 100, "name": "b"},
        {"link": "ss://c", "alive": True, "latency_ms": 100, "name": "c"},
    ]
    sorted_items = _sort_by_latency(items)
    assert [i["name"] for i in sorted_items] == ["a", "b", "c"]


def test_sort_raw_links_preserved():
    """字符串列表（未验证）保持原顺序，不重排。"""
    items = ["ss://a", "ss://b", "ss://c"]
    sorted_items = _sort_by_latency(items)
    assert sorted_items == items


# ─── to_clash_yaml_by_protocol ───────────────────────────────────────


def test_to_clash_yaml_by_protocol():
    """分协议输出：每个协议一个独立 YAML 字符串。"""
    items = [
        {
            "link": "ss://YWVzLTI1Ni1nY206cGFzcw==@example.com:443#s1",
            "alive": True,
            "latency_ms": 100,
            "region": "unknown",
        },
        {
            "link": "trojan://pass@example.com:443#t1",
            "alive": True,
            "latency_ms": 200,
            "region": "unknown",
        },
    ]
    result = to_clash_yaml_by_protocol(items)
    assert "ss" in result
    assert "trojan" in result
    assert "example.com" in result["ss"]
    assert "example.com" in result["trojan"]
    # 没有节点的协议不出现
    assert "vmess" not in result
    assert "vless" not in result


def test_to_clash_yaml_by_protocol_empty():
    """某协议无节点不生成对应条目。"""
    items = [
        {
            "link": "ss://YWVzLTI1Ni1nY206cGFzcw==@example.com:443#s1",
            "alive": True,
            "latency_ms": 100,
            "region": "unknown",
        },
    ]
    result = to_clash_yaml_by_protocol(items)
    assert "ss" in result
    assert "trojan" not in result
    assert "vmess" not in result
    assert "vless" not in result
    assert "hysteria" not in result
    assert "hysteria2" not in result
    assert "tuic" not in result


def test_to_clash_yaml_by_protocol_hy2_normalized():
    """hy2 链接归一化到 hysteria2 分组。"""
    items = [
        {
            "link": "hy2://auth@example.com:443?sni=example.com#h1",
            "alive": True,
            "latency_ms": 100,
            "region": "unknown",
        },
    ]
    result = to_clash_yaml_by_protocol(items)
    assert "hysteria2" in result
    assert "hy2" not in result


def test_to_clash_yaml_by_protocol_raw_links():
    """字符串列表也能分组。"""
    items = [
        "ss://YWVzLTI1Ni1nY206cGFzcw==@example.com:443#s1",
        "trojan://pass@example.com:443#t1",
    ]
    result = to_clash_yaml_by_protocol(items)
    assert "ss" in result
    assert "trojan" in result


if __name__ == "__main__":
    test_sort_by_latency()
    test_sort_none_latency_last()
    test_sort_stable()
    test_sort_raw_links_preserved()
    test_to_clash_yaml_by_protocol()
    test_to_clash_yaml_by_protocol_empty()
    test_to_clash_yaml_by_protocol_hy2_normalized()
    test_to_clash_yaml_by_protocol_raw_links()
    print("formatter sort tests passed")
