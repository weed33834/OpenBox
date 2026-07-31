"""validate.py unit tests.

Covers the three core paths of validate(): all-pass, missing quality.json,
and total_nodes == 0. NODES_DIR / DOCS_DATA_DIR are monkeypatched to temp
directories so the real repo data is never touched.
"""
import json
import sys
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

import validate


def _write_valid_nodes_dir(nodes_dir: Path) -> None:
    """Write a fully valid set of nodes/ files."""
    quality = {
        "summary": {
            "total_nodes": 10,
            "alive_nodes": 5,
            "survival_rate": 50.0,
            "verified": True,
        }
    }
    (nodes_dir / "quality.json").write_text(json.dumps(quality), encoding="utf-8")

    clash = {"proxies": [{"name": "n1", "type": "vmess", "server": "1.2.3.4", "port": 443}]}
    (nodes_dir / "clash.yaml").write_text(yaml.dump(clash), encoding="utf-8")

    (nodes_dir / "v2ray.txt").write_text("vmess://example\n", encoding="utf-8")

    detail = {"nodes": [{"name": "n1"}]}
    (nodes_dir / "nodes-detail.json").write_text(json.dumps(detail), encoding="utf-8")


def _write_valid_stats_dir(stats_dir: Path) -> None:
    """Write a valid stats.json into the given _data directory."""
    stats_dir.mkdir(parents=True, exist_ok=True)
    stats = {"total_nodes": 10, "alive_nodes": 5, "survival_rate": 50.0}
    (stats_dir / "stats.json").write_text(json.dumps(stats), encoding="utf-8")


def test_validate_returns_zero_when_all_valid(tmp_path: Path, monkeypatch):
    """All files present and valid -> exit code 0."""
    _write_valid_nodes_dir(tmp_path)
    stats_dir = tmp_path / "docs_data"
    _write_valid_stats_dir(stats_dir)

    monkeypatch.setattr(validate, "NODES_DIR", tmp_path)
    monkeypatch.setattr(validate, "DOCS_DATA_DIR", stats_dir)

    assert validate.validate() == 0


def test_validate_returns_one_when_quality_missing(tmp_path: Path, monkeypatch):
    """Missing quality.json is a critical failure -> exit code 1."""
    # Write the other required files, but deliberately skip quality.json.
    clash = {"proxies": [{"name": "n1", "type": "vmess", "server": "1.2.3.4", "port": 443}]}
    (tmp_path / "clash.yaml").write_text(yaml.dump(clash), encoding="utf-8")
    (tmp_path / "v2ray.txt").write_text("vmess://example", encoding="utf-8")

    stats_dir = tmp_path / "docs_data"
    _write_valid_stats_dir(stats_dir)

    monkeypatch.setattr(validate, "NODES_DIR", tmp_path)
    monkeypatch.setattr(validate, "DOCS_DATA_DIR", stats_dir)

    assert validate.validate() == 1


def test_validate_returns_one_when_total_nodes_zero(tmp_path: Path, monkeypatch):
    """total_nodes == 0 means no output was produced -> exit code 1."""
    quality = {
        "summary": {
            "total_nodes": 0,
            "alive_nodes": 0,
            "survival_rate": None,
            "verified": False,
        }
    }
    (tmp_path / "quality.json").write_text(json.dumps(quality), encoding="utf-8")

    clash = {"proxies": [{"name": "n1", "type": "vmess", "server": "1.2.3.4", "port": 443}]}
    (tmp_path / "clash.yaml").write_text(yaml.dump(clash), encoding="utf-8")
    (tmp_path / "v2ray.txt").write_text("vmess://example", encoding="utf-8")

    stats_dir = tmp_path / "docs_data"
    _write_valid_stats_dir(stats_dir)

    monkeypatch.setattr(validate, "NODES_DIR", tmp_path)
    monkeypatch.setattr(validate, "DOCS_DATA_DIR", stats_dir)

    assert validate.validate() == 1
