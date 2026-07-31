from __future__ import annotations

import base64
import contextlib
import json
import os
import re
import tempfile
from pathlib import Path
from urllib.parse import urlparse

import yaml
from parser import OUTPUT_SCHEMES, node_to_clash_config

from utils import NODES_DIR, is_private_host, protocol_of


def _clean_name(name: str) -> str:
    return re.sub(r'[^\w\-_.]', '_', name)[:64]


def _node_info(item):
    """Normalize a node result dict or a raw link string."""
    if isinstance(item, dict):
        return item.get("link"), item.get("region", "unknown"), item.get("latency_ms")
    return item, "unknown", None


def _cfg_of(item):
    """取 item 的 clash config，优先用预解析的 _cfg，否则现场解析。

    配合 _enrich_items 使用：write_outputs 里解析一次后下发给各输出函数，
    避免 to_clash_yaml / _build_regions / to_v2ray_subscription 各自重复解析。
    """
    if isinstance(item, dict) and "_cfg" in item:
        return item["_cfg"]
    link = item.get("link") if isinstance(item, dict) else item
    return node_to_clash_config(link) if link else None


def _enrich_items(items):
    """预解析每个 item 的 clash config，挂到 _cfg 字段，返回新列表。

    dict items 拷贝后追加 _cfg；字符串包成带 link/region/latency_ms/_cfg 的 dict。
    后续输出函数通过 _cfg_of 复用，不再重复调用 node_to_clash_config。
    """
    enriched = []
    for item in items:
        link, region, latency_ms = _node_info(item)
        cfg = node_to_clash_config(link) if link else None
        if isinstance(item, dict):
            e = dict(item)
            e["_cfg"] = cfg
        else:
            e = {"link": link, "region": region, "latency_ms": latency_ms, "_cfg": cfg}
        enriched.append(e)
    return enriched


def _compute_stats(items: list) -> dict:
    """Compute summary stats from node result dicts or raw link strings."""
    total = len(items)
    has_alive_flag = any(isinstance(i, dict) and "alive" in i for i in items)
    if has_alive_flag:
        alive_items = [i for i in items if isinstance(i, dict) and i.get("alive")]
        candidates = alive_items
        alive_count = len(candidates)
        survival_rate = round(alive_count / total * 100, 1) if total else 0.0
    else:
        # Raw links without verification: liveness is unknown, so we must not
        # report a misleading 100% survival rate.
        candidates = items
        alive_count = None
        survival_rate = None
    latencies = [
        i["latency_ms"] for i in candidates if isinstance(i, dict) and i.get("latency_ms") is not None
    ]
    avg_latency = round(sum(latencies) / len(latencies), 1) if latencies else None
    regions: dict[str, int] = {}
    for i in candidates:
        region = (i.get("region") or "unknown") if isinstance(i, dict) else "unknown"
        regions[region] = regions.get(region, 0) + 1
    return {
        "total": total,
        "alive": alive_count,
        "survival_rate": survival_rate,
        "avg_latency": avg_latency,
        "regions": regions,
    }


def _format_stats_lines(stats: dict) -> list[str]:
    alive = stats.get("alive")
    rate = stats.get("survival_rate")
    if alive is None or rate is None:
        lines = [f"# Nodes: {stats['total']} total (unverified)"]
    else:
        lines = [f"# Nodes: {stats['total']} total, {alive} alive ({rate}%)"]
    if stats.get("avg_latency") is not None:
        lines.append(f"# Average latency: {stats['avg_latency']} ms")
    else:
        lines.append("# Average latency: N/A")
    if stats.get("regions"):
        dist = ", ".join(
            f"{k}: {v}" for k, v in sorted(stats["regions"].items(), key=lambda x: -x[1])
        )
        lines.append(f"# Regions: {dist}")
    else:
        lines.append("# Regions: N/A")
    return lines


def _sort_by_latency(items):
    """按 latency_ms 升序排序，None 排最后；保持稳定。

    字符串列表（未验证）保持原顺序，不重排。
    """
    # 全是字符串的未验证列表，原样返回拷贝
    if not any(isinstance(i, dict) for i in items):
        return list(items)

    def _key(item):
        if isinstance(item, dict):
            lat = item.get("latency_ms")
            if lat is None:
                return (1, 0)  # None 排最后
            return (0, lat)
        # 字符串混在 dict 列表里时按 None 处理
        return (1, 0)

    # sorted 是稳定排序，相同 key 保持原相对顺序
    return sorted(items, key=_key)


def to_clash_yaml(items, stats: dict | None = None) -> str:
    # 输出前按延迟排序，延迟低的排前面，None 排最后
    items = _sort_by_latency(items)
    proxies = []
    names = []
    seen_names = set()
    for idx, item in enumerate(items):
        link, region, latency_ms = _node_info(item)
        cfg = _cfg_of(item)
        if not cfg or not cfg.get("server") or not cfg.get("port"):
            continue
        if is_private_host(cfg.get("server")):
            continue
        base_name = _clean_name(cfg.get("name") or f"node_{idx + 1}")
        name = base_name
        suffix = 1
        while name in seen_names:
            suffix += 1
            name = f"{base_name}_{suffix}"
        seen_names.add(name)
        cfg["name"] = name
        names.append(name)
        proxies.append(cfg)

    output = {
        "port": 7890,
        "socks-port": 7891,
        "mixed-port": 7892,
        "mode": "rule",
        "log-level": "info",
        "external-controller": "127.0.0.1:9090",
        "proxies": proxies,
        "proxy-groups": [
            {
                "name": "PROXY",
                "type": "select",
                "proxies": names if names else ["DIRECT"],
            }
        ],
        "rules": ["MATCH,DIRECT"],
    }

    disclaimer = [
        "# FreeNode Clash configuration",
        "# Auto-generated. Do not edit manually.",
        "# DISCLAIMER: Free public nodes are for educational and research use only.",
        "# No availability, security, or privacy guarantee. Use at your own risk.",
        "# Do not log in to sensitive accounts through these proxies/nodes.",
    ]

    summary = _compute_stats(items) if stats is None else stats
    disclaimer.extend(_format_stats_lines(summary))

    return "\n".join(disclaimer) + "\n" + yaml.safe_dump(output, allow_unicode=True, sort_keys=False)


def to_v2ray_subscription(items, stats: dict | None = None) -> str:
    if not items:
        return "# FreeNode V2Ray subscription\n# Auto-generated.\n"
    # 输出前按延迟排序，延迟低的排前面，None 排最后
    items = _sort_by_latency(items)
    safe_links = []
    for item in items:
        link, _region, _latency = _node_info(item)
        cfg = _cfg_of(item)
        host = cfg.get("server") if cfg else None
        if host and not is_private_host(host):
            safe_links.append(link)
    if not safe_links:
        return "# FreeNode V2Ray subscription\n# Auto-generated.\n"
    joined = "\n".join(safe_links)
    return base64.b64encode(joined.encode()).decode()


def to_clash_yaml_by_protocol(items, stats: dict | None = None) -> dict[str, str]:
    """按协议分组生成独立 Clash YAML 字符串。

    返回 ``{"vmess": "...", "vless": "...", ...}``，没有节点的协议不出现，
    由调用方决定是否落盘写 ``nodes/clash-<proto>.yaml``。
    """
    groups: dict[str, list] = {}
    for item in items:
        link = item.get("link") if isinstance(item, dict) else item
        proto = _extract_protocol_from_link(link)
        if not proto:
            continue
        groups.setdefault(proto, []).append(item)

    result: dict[str, str] = {}
    for proto, group_items in groups.items():
        # 每组内同样按延迟排序（to_clash_yaml 内部会再排一次，这里直接传即可）
        result[proto] = to_clash_yaml(group_items, stats=stats)
    return result


def _proxy_host(proxy: str) -> str | None:
    """Extract host from http(s)://host:port or socks4/5://host:port.

    Uses urlparse so IPv6 addresses wrapped in brackets are handled correctly.
    """
    parsed = urlparse(proxy)
    return parsed.hostname


def to_proxy_list(proxies: list[str]) -> str:
    lines = [
        "# FreeNode public proxy list",
        "# Auto-generated.",
        "# DISCLAIMER: Free public proxies are for educational and research use only.",
        "# No availability, security, or privacy guarantee. Use at your own risk.",
        "# Do not log in to sensitive accounts through these proxies.",
    ]
    for proxy in proxies:
        host = _proxy_host(proxy)
        if host and not is_private_host(host):
            lines.append(proxy)
    return "\n".join(lines) + "\n"


def _extract_protocol_from_link(link: str) -> str | None:
    """从分享链接提取协议名（小写），仅返回 OUTPUT_SCHEMES 内的协议。

    hy2 → hysteria2 等归一化由 ``protocol_of`` 内部完成，这里只负责过滤。
    """
    scheme = protocol_of(link)
    return scheme if scheme in OUTPUT_SCHEMES else None


def _compute_protocol_stats(items) -> dict[str, dict]:
    """按协议分组统计 total / alive / survival_rate / avg_latency。"""
    groups: dict[str, list] = {}
    for item in items:
        link = item.get("link") if isinstance(item, dict) else item
        proto = _extract_protocol_from_link(link) or "unknown"
        groups.setdefault(proto, []).append(item)

    result = {}
    for proto, group_items in groups.items():
        total = len(group_items)
        has_alive = any(isinstance(i, dict) and "alive" in i for i in group_items)
        if has_alive:
            alive_count = sum(1 for i in group_items if isinstance(i, dict) and i.get("alive"))
            survival_rate = round(alive_count / total * 100, 1) if total else 0.0
        else:
            alive_count = None
            survival_rate = None
        latencies = [
            i["latency_ms"]
            for i in group_items
            if isinstance(i, dict) and i.get("latency_ms") is not None
        ]
        avg_latency = round(sum(latencies) / len(latencies), 1) if latencies else None
        result[proto] = {
            "total": total,
            "alive": alive_count,
            "survival_rate": survival_rate,
            "avg_latency": avg_latency,
        }
    return result


_FAILURE_REASON_MAP = (
    ("timeout", "timeout"),
    ("timed out", "timeout"),
    ("refused", "connection_refused"),
    ("unreachable", "network_unreachable"),
    ("no route", "network_unreachable"),
    ("reset", "connection_reset"),
)


def _classify_failure_reason(reason: str) -> str:
    """把原始错误字符串归类成标准失败原因 key。"""
    lower = str(reason).lower()
    return next(
        (key for sub, key in _FAILURE_REASON_MAP if sub in lower), "other"
    )


def _compute_failure_reasons(items) -> dict[str, int]:
    """统计验证失败原因分布（只有 verifier 跑过才有）。"""
    reasons: dict[str, int] = {}
    for item in items:
        if not isinstance(item, dict) or item.get("alive"):
            continue
        reason = item.get("error") or item.get("reason") or "unknown"
        key = _classify_failure_reason(reason)
        reasons[key] = reasons.get(key, 0) + 1
    return reasons


def to_quality_report(items, stats: dict | None = None, verified: bool = False) -> str:
    """生成 nodes/quality.json 内容：每日节点质量报告。

    ``verified`` 标记数据是否经过连通性验证。未验证时 alive_nodes 输出 0
    （而非 null），避免下游消费方拿不到字段。
    """
    from datetime import datetime, timezone

    summary = stats if stats is not None else _compute_stats(items)
    alive_nodes = summary.get("alive")
    # 未验证时 alive 为 None，输出 0 而非 null，保证字段始终可读
    if alive_nodes is None:
        alive_nodes = 0
    report = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "summary": {
            "total_nodes": summary.get("total", 0),
            "alive_nodes": alive_nodes,
            "survival_rate": summary.get("survival_rate"),
            "avg_latency_ms": summary.get("avg_latency"),
            "verified": verified,
        },
        "by_protocol": _compute_protocol_stats(items),
        "failure_reasons": _compute_failure_reasons(items),
        "regions": summary.get("regions", {}),
    }
    return json.dumps(report, ensure_ascii=False, indent=2)


def _to_int_safe(value) -> int | None:
    """Convert value to int, returning None on failure."""
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def to_nodes_detail(items, stats: dict | None = None, verified: bool = False) -> str:
    """Generate nodes/nodes-detail.json: per-node data with alive/latency info.

    Unlike clash.yaml which loses verification data, this preserves the full
    per-node verification results for the frontend node browser.
    """
    from datetime import datetime, timezone

    nodes = []
    regions_summary: dict[str, int] = {}
    protocols_summary: dict[str, int] = {}

    for item in items:
        link, region, latency_ms = _node_info(item)
        cfg = _cfg_of(item)
        if not cfg or not cfg.get("server") or not cfg.get("port"):
            continue
        if is_private_host(cfg.get("server")):
            continue

        proto = cfg.get("type") or _extract_protocol_from_link(link) or "unknown"
        port = _to_int_safe(cfg.get("port"))
        alive = item.get("alive") if isinstance(item, dict) else None
        sni = cfg.get("sni") or cfg.get("servername")

        nodes.append({
            "name": cfg.get("name"),
            "protocol": proto,
            "server": cfg.get("server"),
            "port": port,
            "server_sni": sni,
            "region": region,
            "alive": alive,
            "latency_ms": latency_ms,
        })
        regions_summary[region] = regions_summary.get(region, 0) + 1
        protocols_summary[proto] = protocols_summary.get(proto, 0) + 1

    regions_summary = dict(sorted(regions_summary.items(), key=lambda x: -x[1]))
    protocols_summary = dict(sorted(protocols_summary.items(), key=lambda x: -x[1]))

    detail = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total": len(nodes),
        "verified": verified,
        "nodes": nodes,
        "regions_summary": regions_summary,
        "protocols_summary": protocols_summary,
    }
    return json.dumps(detail, ensure_ascii=False, indent=2)


def _build_regions(items) -> dict[str, list[str]]:
    """Group alive node links by region."""
    regions: dict[str, list[str]] = {}
    for item in items:
        link, region, _latency = _node_info(item)
        cfg = _cfg_of(item)
        if not cfg or not cfg.get("server") or is_private_host(cfg.get("server")):
            continue
        regions.setdefault(region, []).append(link)
    return regions


def _atomic_write(path: Path, content: str) -> None:
    """Write *content* to *path* atomically via a temp file + os.replace.

    Prevents half-written / truncated output files if the process is killed
    mid-write (CI timeout, OOM, etc.).
    """
    fd, tmp = tempfile.mkstemp(dir=str(path.parent), prefix=path.name + ".", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(content)
        os.replace(tmp, str(path))
    except BaseException:
        with contextlib.suppress(OSError):
            os.unlink(tmp)
        raise


def write_outputs(node_results, proxy_list: list[str], stats: dict | None = None, verified: bool = False):
    NODES_DIR.mkdir(parents=True, exist_ok=True)

    # 预解析一次 clash config，下发给各输出函数复用，避免 to_clash_yaml /
    # _build_regions / to_v2ray_subscription 各自重复调用 node_to_clash_config。
    enriched = _enrich_items(node_results)

    summary = stats if stats is not None else _compute_stats(enriched)
    stats_header = "\n".join(_format_stats_lines(summary)) + "\n"  # noqa: F841  clash.yaml 头部用

    _atomic_write(NODES_DIR / "clash.yaml", to_clash_yaml(enriched, stats=summary))

    # v2ray.txt 必须是纯 base64：v2rayN/v2rayNG 等客户端对整个响应体做 base64 解码，
    # 任何非 base64 字符（如 '#' 注释行）都会导致解码失败。统计信息已写入
    # quality.json 和 clash.yaml 头部，不混入订阅文件。
    v2ray_body = to_v2ray_subscription(enriched)
    _atomic_write(NODES_DIR / "v2ray.txt", v2ray_body)

    regions = _build_regions(enriched)
    _atomic_write(
        NODES_DIR / "regions.json",
        json.dumps(regions, ensure_ascii=False, indent=2),
    )

    _atomic_write(NODES_DIR / "proxies.txt", to_proxy_list(proxy_list))

    # Per-node detail with verification status (for frontend node browser)
    _atomic_write(NODES_DIR / "nodes-detail.json", to_nodes_detail(enriched, stats=summary, verified=verified))

    # 每日节点质量报告：存活率、延迟、协议分布、失败原因
    _atomic_write(NODES_DIR / "quality.json", to_quality_report(enriched, stats=summary, verified=verified))


if __name__ == "__main__":
    import tempfile

    sample = [
        "vmess://eyJhZGQiOiJleGFtcGxlLmNvbSIsInBvcnQiOiI0NDMiLCJpZCI6Inh4eHh4eHgteHh4eC14eHh4LXh4eHgteHh4eHh4eHh4eHgiLCJhaWQiOjAsIm5ldCI6InRjcCIsInR5cGUiOiJub25lIiwiaG9zdCI6IiIsInBhdGgiOiIvIiwidGxzIjoiIiwic25pIjoiIiwicHMiOiJ0ZXN0In0=",
        "ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ=@example.com:443#test",
        "trojan://pass@example.com:443#trojan-test",
    ]
    # Write to a temp dir to avoid clobbering real output files
    with tempfile.TemporaryDirectory(prefix="freenode-fmt-") as tmp:
        import utils as _utils
        _orig = _utils.NODES_DIR
        _utils.NODES_DIR = Path(tmp)
        try:
            write_outputs(sample, ["http://127.0.0.1:8080"])
        finally:
            _utils.NODES_DIR = _orig
    print("[formatter] sample output written to temp dir (not nodes/)")
