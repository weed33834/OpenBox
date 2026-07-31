"""site_builder.py 新增函数的单元测试。

覆盖 build_nodes / build_trend / build_pipeline_status 三个在最近提交中
新增但缺少测试覆盖的函数。
"""
import json
import sys
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

import site_builder

# ─── build_nodes ────────────────────────────────────────────────────────


def _write_clash_yaml(nodes_dir: Path, proxies: list[dict]) -> None:
    """Write a minimal clash.yaml with the given proxies list."""
    import yaml

    data = {"proxies": proxies}
    (nodes_dir / "clash.yaml").write_text(
        yaml.dump(data, allow_unicode=True, sort_keys=False), encoding="utf-8"
    )


def test_build_nodes_basic(tmp_path: Path):
    """build_nodes 从 clash.yaml 提取节点并输出结构化 JSON。"""
    proxies = [
        {"name": "node-1", "type": "vmess", "server": "1.2.3.4", "port": 443},
        {"name": "node-2", "type": "ss", "server": "5.6.7.8", "port": 8388},
    ]
    _write_clash_yaml(tmp_path, proxies)

    with patch.object(site_builder, "NODES_DIR", tmp_path):
        result = site_builder.build_nodes()

    assert result["total"] == 2
    assert len(result["nodes"]) == 2
    assert result["nodes"][0]["name"] == "node-1"
    assert result["nodes"][0]["protocol"] == "vmess"
    assert result["nodes"][0]["port"] == 443
    assert result["nodes"][0]["alive"] is None  # 未验证
    assert result["nodes"][0]["latency_ms"] is None
    assert "vmess" in result["protocols_summary"]
    assert result["protocols_summary"]["vmess"] == 1


def test_build_nodes_empty(tmp_path: Path):
    """clash.yaml 不存在时返回空结果，不抛异常。"""
    with patch.object(site_builder, "NODES_DIR", tmp_path):
        result = site_builder.build_nodes()

    assert result["total"] == 0
    assert result["nodes"] == []
    assert result["regions_summary"] == {}
    assert result["protocols_summary"] == {}


def test_build_nodes_region_lookup(tmp_path: Path):
    """regions.json 中的节点能正确关联到地区。"""
    proxies = [
        {"name": "hk-node", "type": "vmess", "server": "1.2.3.4", "port": 443},
    ]
    _write_clash_yaml(tmp_path, proxies)

    # 写一个 regions.json，包含一条 vmess 链接指向 1.2.3.4:443
    vmess_link = "vmess://eyJhZGQiOiIxLjIuMy40IiwicG9ydCI6IjQ0MyIsImlkIjoiYWJjIiwibmV0IjoidGNwIiwidHlwZSI6Im5vbmUifQ=="
    regions = {"Hong Kong": [vmess_link]}
    (tmp_path / "regions.json").write_text(
        json.dumps(regions), encoding="utf-8"
    )

    with patch.object(site_builder, "NODES_DIR", tmp_path):
        result = site_builder.build_nodes()

    assert result["total"] == 1
    assert result["nodes"][0]["region"] == "Hong Kong"
    assert "Hong Kong" in result["regions_summary"]


def test_build_nodes_protocols_summary_sorted(tmp_path: Path):
    """protocols_summary 按数量降序排列。"""
    proxies = [
        {"name": "n1", "type": "ss", "server": "1.1.1.1", "port": 8388},
        {"name": "n2", "type": "ss", "server": "2.2.2.2", "port": 8388},
        {"name": "n3", "type": "vmess", "server": "3.3.3.3", "port": 443},
    ]
    _write_clash_yaml(tmp_path, proxies)

    with patch.object(site_builder, "NODES_DIR", tmp_path):
        result = site_builder.build_nodes()

    keys = list(result["protocols_summary"].keys())
    assert keys[0] == "ss"  # 2 个，排第一
    assert keys[1] == "vmess"


# ─── build_nodes: nodes-detail.json 优先 ───────────────────────────────


def _write_nodes_detail(nodes_dir: Path, detail: dict) -> None:
    """Write a nodes-detail.json file with the given detail payload."""
    (nodes_dir / "nodes-detail.json").write_text(
        json.dumps(detail), encoding="utf-8"
    )


def test_build_nodes_reads_nodes_detail(tmp_path: Path):
    """nodes-detail.json 存在时优先读取，返回其中包含的验证信息。"""
    detail = {
        "generated_at": "2026-07-29T10:00:00Z",
        "total": 2,
        "verified": True,
        "nodes": [
            {
                "name": "n1",
                "protocol": "ss",
                "server": "1.2.3.4",
                "port": 8388,
                "server_sni": None,
                "region": "HK",
                "alive": True,
                "latency_ms": 100,
            },
            {
                "name": "n2",
                "protocol": "vmess",
                "server": "5.6.7.8",
                "port": 443,
                "server_sni": None,
                "region": "US",
                "alive": False,
                "latency_ms": None,
            },
        ],
        "regions_summary": {"HK": 1, "US": 1},
        "protocols_summary": {"ss": 1, "vmess": 1},
    }
    _write_nodes_detail(tmp_path, detail)

    with patch.object(site_builder, "NODES_DIR", tmp_path):
        result = site_builder.build_nodes()

    assert result["total"] == 2
    assert result["verified"] is True
    assert result["nodes"][0]["alive"] is True
    assert result["nodes"][0]["latency_ms"] == 100
    assert result["nodes"][1]["alive"] is False
    assert result["regions_summary"] == {"HK": 1, "US": 1}


def test_build_nodes_detail_returned_as_is(tmp_path: Path):
    """nodes-detail.json 路径原样返回写入的数据，不重新计算/重构。"""
    detail = {
        "generated_at": "2026-07-29T10:00:00Z",
        "total": 1,
        "verified": True,
        "nodes": [
            {
                "name": "n1",
                "protocol": "ss",
                "server": "1.2.3.4",
                "port": 8388,
                "region": "HK",
                "alive": True,
                "latency_ms": 100,
            }
        ],
        "regions_summary": {"HK": 1},
        "protocols_summary": {"ss": 1},
        # 额外字段也应原样保留，证明数据未被重新计算
        "extra_field": "preserved",
    }
    _write_nodes_detail(tmp_path, detail)

    with patch.object(site_builder, "NODES_DIR", tmp_path):
        result = site_builder.build_nodes()

    assert result == detail


def test_build_nodes_fallback_to_clash_yaml(tmp_path: Path):
    """nodes-detail.json 不存在时降级到 clash.yaml（无 alive/latency 信息）。"""
    proxies = [
        {"name": "node-1", "type": "vmess", "server": "1.2.3.4", "port": 443},
        {"name": "node-2", "type": "ss", "server": "5.6.7.8", "port": 8388},
    ]
    _write_clash_yaml(tmp_path, proxies)
    # 故意不创建 nodes-detail.json，强制走 clash.yaml 降级路径

    with patch.object(site_builder, "NODES_DIR", tmp_path):
        result = site_builder.build_nodes()

    assert result["total"] == 2
    assert result["nodes"][0]["name"] == "node-1"
    # clash.yaml 降级方案不含验证信息
    assert result["nodes"][0]["alive"] is None
    assert result["nodes"][0]["latency_ms"] is None
    assert "vmess" in result["protocols_summary"]


def test_build_nodes_detail_preferred_over_clash(tmp_path: Path):
    """nodes-detail.json 与 clash.yaml 同时存在时，优先使用 nodes-detail.json。"""
    proxies = [
        {"name": "yaml-node", "type": "ss", "server": "9.9.9.9", "port": 8388},
    ]
    _write_clash_yaml(tmp_path, proxies)

    detail = {
        "generated_at": "2026-07-29T10:00:00Z",
        "total": 1,
        "verified": True,
        "nodes": [
            {
                "name": "detail-node",
                "protocol": "vmess",
                "server": "1.2.3.4",
                "port": 443,
                "region": "HK",
                "alive": True,
                "latency_ms": 50,
            }
        ],
        "regions_summary": {"HK": 1},
        "protocols_summary": {"vmess": 1},
    }
    _write_nodes_detail(tmp_path, detail)

    with patch.object(site_builder, "NODES_DIR", tmp_path):
        result = site_builder.build_nodes()

    # 应取 nodes-detail.json 的数据，而非 clash.yaml
    assert result["verified"] is True
    assert result["nodes"][0]["name"] == "detail-node"
    assert "yaml-node" not in [n["name"] for n in result["nodes"]]


# ─── build_trend ───────────────────────────────────────────────────────


def test_build_trend_no_archive(tmp_path: Path):
    """无归档时输出当前快照作为单点。"""
    quality = {
        "summary": {
            "total_nodes": 100,
            "alive_nodes": 50,
            "survival_rate": 50.0,
            "avg_latency_ms": 200.5,
        }
    }
    (tmp_path / "quality.json").write_text(
        json.dumps(quality), encoding="utf-8"
    )

    with patch.object(site_builder, "NODES_DIR", tmp_path):
        result = site_builder.build_trend()

    assert result["days"] == 1
    assert len(result["history"]) == 1
    assert result["history"][0]["total_nodes"] == 100
    assert result["history"][0]["alive_nodes"] == 50
    assert result["latest"]["total_nodes"] == 100


def test_build_trend_with_archive(tmp_path: Path):
    """有归档快照时合并历史 + 当前，取最近 7 天。"""
    archive_dir = tmp_path / "archive"
    for day_str, total in [("2026-0701", 80), ("2026-0702", 90), ("2026-0703", 100)]:
        d = archive_dir / day_str
        d.mkdir(parents=True)
        (d / "quality.json").write_text(
            json.dumps({"summary": {"total_nodes": total, "alive_nodes": total // 2}}),
            encoding="utf-8",
        )

    (tmp_path / "quality.json").write_text(
        json.dumps({"summary": {"total_nodes": 110, "alive_nodes": 55}}),
        encoding="utf-8",
    )

    with patch.object(site_builder, "NODES_DIR", tmp_path):
        result = site_builder.build_trend()

    assert len(result["history"]) == 4  # 3 archive + 1 current
    assert result["history"][0]["date"] == "2026-07-01"
    assert result["history"][-1]["total_nodes"] == 110


def test_build_trend_capped_at_7_days(tmp_path: Path):
    """历史超过 7 天时只取最近 7 条。"""
    archive_dir = tmp_path / "archive"
    for i in range(1, 12):
        day_str = f"2026-07{i:02d}"
        d = archive_dir / day_str
        d.mkdir(parents=True)
        (d / "quality.json").write_text(
            json.dumps({"summary": {"total_nodes": i * 10}}),
            encoding="utf-8",
        )

    with patch.object(site_builder, "NODES_DIR", tmp_path):
        result = site_builder.build_trend()

    assert result["days"] <= 7
    assert len(result["history"]) <= 7


# ─── build_pipeline_status ─────────────────────────────────────────────


def test_build_pipeline_status_from_file(tmp_path: Path):
    """pipeline-status.json 存在时透传。"""
    raw = {
        "generated_at": "2026-07-29T10:00:00Z",
        "total_duration_ms": 5000.0,
        "steps": {
            "crawl": {"duration_ms": 1000.0, "status": "ok"},
            "parse": {"duration_ms": 500.0, "status": "ok"},
        },
    }
    (tmp_path / "pipeline-status.json").write_text(
        json.dumps(raw), encoding="utf-8"
    )

    with patch.object(site_builder, "NODES_DIR", tmp_path):
        result = site_builder.build_pipeline_status()

    assert result["total_duration_ms"] == 5000.0
    assert result["steps"]["crawl"]["status"] == "ok"
    assert result["steps"]["parse"]["duration_ms"] == 500.0


def test_build_pipeline_status_missing_file(tmp_path: Path):
    """pipeline-status.json 不存在时返回默认结构。"""
    with patch.object(site_builder, "NODES_DIR", tmp_path):
        result = site_builder.build_pipeline_status()

    assert result["total_duration_ms"] is None
    assert "crawl" in result["steps"]
    assert "archive" in result["steps"]
    for step in result["steps"].values():
        assert step["status"] == "unknown"
        assert step["duration_ms"] is None


def test_build_pipeline_status_all_steps_present(tmp_path: Path):
    """默认结构包含全部 6 个流水线步骤。"""
    with patch.object(site_builder, "NODES_DIR", tmp_path):
        result = site_builder.build_pipeline_status()

    expected_steps = {"crawl", "parse", "dedup", "verify", "format", "archive"}
    assert set(result["steps"].keys()) == expected_steps
