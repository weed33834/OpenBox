"""Pipeline output validation gate.

Runs after update.py + site_builder.py to verify output quality before commit.
Exit codes: 0 = all pass, 1 = critical failure, 2 = warning (strict mode)
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import yaml

from utils import NODES_DIR, get_logger

logger = get_logger("validate")

DOCS_DATA_DIR = Path(__file__).resolve().parent.parent / "docs" / "_data"


def _check(name: str, condition: bool, detail: str = "") -> bool:
    """Log a check result and return the boolean."""
    status = "PASS" if condition else "FAIL"
    msg = f"[{status}] {name}"
    if detail:
        msg += f": {detail}"
    if condition:
        logger.info(msg)
    else:
        logger.warning(msg)
    return condition


def validate(strict: bool = False) -> int:
    """Run all validation checks. Return 0=pass, 1=critical fail, 2=strict warning."""
    checks_passed = 0
    checks_failed = 0
    warnings = 0

    # 1. quality.json
    quality_path = NODES_DIR / "quality.json"
    quality = {}
    if quality_path.exists():
        try:
            quality = json.loads(quality_path.read_text(encoding="utf-8"))
            checks_passed += 1
        except (json.JSONDecodeError, OSError) as exc:
            checks_failed += 1
            logger.error("quality.json is invalid: %s", exc)
    else:
        checks_failed += 1
        logger.error("quality.json not found")

    summary = quality.get("summary", {})
    total_nodes = summary.get("total_nodes", 0)
    if not _check("total_nodes > 0", total_nodes > 0, f"total_nodes={total_nodes}"):
        checks_failed += 1
    else:
        checks_passed += 1

    verified = summary.get("verified", False)
    alive_nodes = summary.get("alive_nodes", 0)
    if verified:
        if not _check("alive_nodes > 0 (verified)", alive_nodes > 0, f"alive_nodes={alive_nodes}"):
            checks_failed += 1
        else:
            checks_passed += 1
    else:
        warnings += 1
        logger.warning("data is unverified (FREENODE_VERIFY_NODES=false)")

    # 2. clash.yaml
    clash_path = NODES_DIR / "clash.yaml"
    if clash_path.exists():
        try:
            clash_data = yaml.safe_load(clash_path.read_text(encoding="utf-8")) or {}
            proxy_count = len(clash_data.get("proxies") or [])
            if not _check("clash.yaml has proxies", proxy_count > 0, f"{proxy_count} proxies"):
                checks_failed += 1
            else:
                checks_passed += 1
        except (yaml.YAMLError, OSError) as exc:
            checks_failed += 1
            logger.error("clash.yaml is invalid: %s", exc)
    else:
        checks_failed += 1
        logger.error("clash.yaml not found")

    # 3. v2ray.txt
    v2ray_path = NODES_DIR / "v2ray.txt"
    v2ray_content = ""
    if v2ray_path.exists():
        v2ray_content = v2ray_path.read_text(encoding="utf-8").strip()
        if not _check("v2ray.txt non-empty", len(v2ray_content) > 0):
            checks_failed += 1
        else:
            checks_passed += 1
    else:
        checks_failed += 1
        logger.error("v2ray.txt not found")

    # 4. nodes-detail.json
    detail_path = NODES_DIR / "nodes-detail.json"
    if detail_path.exists():
        try:
            detail = json.loads(detail_path.read_text(encoding="utf-8"))
            node_list = detail.get("nodes", [])
            if not _check("nodes-detail.json valid", isinstance(node_list, list), f"{len(node_list)} nodes"):
                checks_failed += 1
            else:
                checks_passed += 1
        except (json.JSONDecodeError, OSError) as exc:
            checks_failed += 1
            logger.error("nodes-detail.json is invalid: %s", exc)
    else:
        warnings += 1
        logger.warning("nodes-detail.json not found (may be first run)")

    # 5. docs/_data/stats.json
    stats_path = DOCS_DATA_DIR / "stats.json"
    if stats_path.exists():
        try:
            stats = json.loads(stats_path.read_text(encoding="utf-8"))
            has_fields = "total_nodes" in stats and "alive_nodes" in stats
            if not _check("stats.json has required fields", has_fields):
                checks_failed += 1
            else:
                checks_passed += 1
        except (json.JSONDecodeError, OSError) as exc:
            checks_failed += 1
            logger.error("stats.json is invalid: %s", exc)
    else:
        warnings += 1
        logger.warning("stats.json not found (run site_builder.py first)")

    # Summary
    logger.info("validation: %d passed, %d failed, %d warnings", checks_passed, checks_failed, warnings)

    if checks_failed > 0:
        return 1
    if strict and warnings > 0:
        return 2
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate pipeline output quality")
    parser.add_argument("--strict", action="store_true", help="Treat warnings as errors")
    args = parser.parse_args(argv)
    return validate(strict=args.strict)


if __name__ == "__main__":
    sys.exit(main())
