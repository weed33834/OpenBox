"""从 nodes/*.json 与 config/sources.json 生成 Jekyll _data/*.json。

设计原则：
- 数据层与展示层解耦：本脚本只负责「读 → 计算 → 写 JSON」，HTML/Liquid 只负责渲染
- 配置集中：URL、阈值、文案常量都在 SITE_CONFIG，便于维护
- 幂等：重复运行结果一致，可安全纳入 CI
- 向前兼容：缺失字段走 default，不抛异常

生成的数据集：
- subscriptions.json   订阅链接卡片
- stats.json           首页统计仪表盘 + 数据新鲜度
- sources.json         数据源目录（合并 sources.json + sources-report.json）
- protocols.json       协议说明（静态）
- clients.json         客户端推荐（静态）
- site.json            站点元信息（用于 SEO / footer / 全局文案）
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
NODES_DIR = PROJECT_ROOT / "nodes"
CONFIG_PATH = PROJECT_ROOT / "config" / "sources.json"
DOCS_DATA_DIR = PROJECT_ROOT / "docs" / "_data"


# ============================================================
# 站点配置 — 所有 URL、阈值、文案常量集中于此
# 改部署目标 / 镜像 / 文案时只改这里，不动逻辑
# ============================================================
SITE_CONFIG = {
    # 订阅文件 raw 地址。主仓库 GitHub raw (Pages 部署源),
    # 镜像: jsDelivr CDN (全球加速,国内友好)
    "raw_base_urls": [
        "https://raw.githubusercontent.com/weed33834/freenode/main/nodes",
        "https://cdn.jsdelivr.net/gh/weed33834/freenode@main/nodes",
    ],
    "primary_raw_base": "https://raw.githubusercontent.com/weed33834/freenode/main/nodes",
    # 仓库链接（用于 GitHub icon、PR、Issue 等）
    "repo_urls": {
        "github": "https://github.com/weed33834/freenode",
    },
    "pages_url": "https://weed33834.github.io/freenode",
    # Update-mechanism copy — must match the actual workflow to avoid misleading users
    "update_mechanism": "manual",  # manual | scheduled
    "update_description": "Manual GitHub Actions trigger, opens a PR, owner merges to deploy",
}


# Three subscription formats: static metadata, URL is appended at build time
SUBSCRIPTIONS = [
    {
        "id": "clash",
        "icon": "⚡",
        "title": "Clash Subscription",
        "format": "clash.yaml",
        "clients": "Clash / Clash Verge / Stash / Karing",
        "file": "clash.yaml",
        "docs_url": "https://clash.wiki/",
    },
    {
        "id": "v2ray",
        "icon": "🌐",
        "title": "V2Ray Subscription",
        "format": "v2ray.txt",
        "clients": "v2rayN / v2rayNG / Karing",
        "file": "v2ray.txt",
        "docs_url": "https://www.v2fly.org/",
    },
    {
        "id": "proxies",
        "icon": "🔗",
        "title": "Proxy List",
        "format": "proxies.txt",
        "clients": "HTTP(S) / SOCKS4 / SOCKS5 clients",
        "file": "proxies.txt",
        "docs_url": None,
    },
]


# Protocol guide (static, maintained by hand as needed)
PROTOCOLS_GUIDE = [
    {
        "id": "vmess", "name": "VMess", "icon": "🌀",
        "tagline": "V2Ray native protocol",
        "description": "Native V2Ray protocol. Supports dynamic ports and transport-layer obfuscation. More complex to configure but feature-rich.",
        "pros": "Strong anti-censorship, flexible transport", "cons": "Complex client config, slightly slower than ss",
    },
    {
        "id": "vless", "name": "VLESS", "icon": "✨",
        "tagline": "Lightweight VMess",
        "description": "Lightweight VMess variant. Drops timestamp auth for better performance. Often paired with REALITY/TLS.",
        "pros": "High performance, strong obfuscation (with REALITY)", "cons": "Needs server-side support, sensitive to clock sync",
    },
    {
        "id": "ss", "name": "Shadowsocks", "icon": "🔐",
        "tagline": "Classic lightweight cipher",
        "description": "The original lightweight proxy protocol. Wide client support, good performance. Anti-censorship is average.",
        "pros": "Many clients, fast, simple config", "cons": "Distinct traffic fingerprint, easy to detect",
    },
    {
        "id": "trojan", "name": "Trojan", "icon": "🐎",
        "tagline": "TLS camouflaged",
        "description": "Camouflages as normal HTTPS traffic, secured by TLS. Requires a domain and certificate.",
        "pros": "Good obfuscation, wide client support", "cons": "Requires domain + certificate",
    },
    {
        "id": "hysteria2", "name": "Hysteria2", "icon": "⚡",
        "tagline": "QUIC high-speed",
        "description": "High-speed protocol built on QUIC. Performs well on lossy networks. Good for mobile.",
        "pros": "Fast on weak networks, packet-loss resistant", "cons": "Fewer clients, UDP-dependent",
    },
    {
        "id": "tuic", "name": "TUIC", "icon": "🚀",
        "tagline": "QUIC lightweight",
        "description": "Another QUIC-based protocol, lighter than Hysteria with simpler config.",
        "pros": "Lightweight, low latency", "cons": "Few clients, small ecosystem",
    },
]


# 客户端指南（静态）
CLIENTS_GUIDE = [
    {
        "id": "clash-verge",
        "name": "Clash Verge Rev",
        "platform": "Windows / macOS / Linux",
        "supported_protocols": ["vmess", "vless", "ss", "trojan", "hysteria2"],
        "download_url": "https://github.com/clash-verge-rev/clash-verge-rev/releases",
    },
    {
        "id": "v2rayn",
        "name": "v2rayN",
        "platform": "Windows",
        "supported_protocols": ["vmess", "vless", "ss", "trojan"],
        "download_url": "https://github.com/2dust/v2rayN/releases",
    },
    {
        "id": "v2rayng",
        "name": "v2rayNG",
        "platform": "Android",
        "supported_protocols": ["vmess", "vless", "ss", "trojan"],
        "download_url": "https://github.com/2dust/v2rayNG/releases",
    },
    {
        "id": "shadowrocket",
        "name": "Shadowrocket",
        "platform": "iOS / iPadOS",
        "supported_protocols": ["vmess", "vless", "ss", "trojan", "hysteria2"],
        "download_url": "https://apps.apple.com/app/shadowrocket/id932747118",
    },
    {
        "id": "stash",
        "name": "Stash",
        "platform": "iOS / iPadOS / macOS",
        "supported_protocols": ["vmess", "vless", "ss", "trojan", "hysteria2"],
        "download_url": "https://apps.apple.com/app/stash/id1596063349",
    },
    {
        "id": "karing",
        "name": "Karing",
        "platform": "Windows / macOS / Linux / Android",
        "supported_protocols": ["vmess", "vless", "ss", "trojan", "hysteria2", "tuic"],
        "download_url": "https://github.com/KaringX/karing/releases",
    },
]


def _load_json(path: Path, default):
    """安全读 JSON：文件不存在 / 解析失败返回 default，不抛。"""
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return default


def _compute_freshness(generated_at: str | None) -> dict:
    """Compute a data-freshness tier from quality.json's generated_at.

    Drives an honest freshness badge on the front-end so users don't get a
    false sense of "real-time" data:
    - fresh   (< 24h)   green
    - stale   (1-3d)    yellow
    - outdated(> 3d)    red
    """
    if not generated_at:
        return {"level": "unknown", "hours_ago": None, "label": "Unknown"}

    try:
        # Accept ISO 8601 with or without trailing Z
        ts = generated_at.replace("Z", "+00:00")
        dt = datetime.fromisoformat(ts)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        delta = datetime.now(timezone.utc) - dt
        hours = delta.total_seconds() / 3600
    except (ValueError, TypeError):
        return {"level": "unknown", "hours_ago": None, "label": "Unknown"}

    if hours < 24:
        level, label = "fresh", "Fresh"
    elif hours < 72:
        level, label = "stale", "Stale"
    else:
        level, label = "outdated", "Outdated"
    return {"level": level, "hours_ago": round(hours, 1), "label": label}


def build_site() -> dict:
    """Site meta: URL, update mechanism, copyright, etc. for SEO / footer / global copy."""
    return {
        "title": "FreeNode",
        "description": "Open-source free public proxy / node subscription source aggregator with a GitHub Pages navigation site.",
        "pages_url": SITE_CONFIG["pages_url"],
        "repo_urls": SITE_CONFIG["repo_urls"],
        "update_mechanism": SITE_CONFIG["update_mechanism"],
        "update_description": SITE_CONFIG["update_description"],
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


def build_subscriptions() -> list[dict]:
    """Subscription card data: static metadata + raw URL stitching.

    Provides both primary and mirrors; the front-end picks by reachability
    (prefer GitHub raw, fall back to jsDelivr CDN on failure).
    """
    primary = SITE_CONFIG["primary_raw_base"]
    mirrors = [u for u in SITE_CONFIG["raw_base_urls"] if u != primary]
    items = []
    for sub in SUBSCRIPTIONS:
        items.append({
            "id": sub["id"],
            "icon": sub["icon"],
            "title": sub["title"],
            "clients": sub["clients"],
            "format": sub["format"],
            "url": f"{primary}/{sub['file']}",
            "mirrors": [f"{m}/{sub['file']}" for m in mirrors],
            "docs_url": sub.get("docs_url"),
        })
    return items


def build_stats() -> dict:
    """从 nodes/quality.json 派生首页统计 + 数据新鲜度。"""
    quality = _load_json(NODES_DIR / "quality.json", {})
    summary = quality.get("summary", {})
    by_proto_raw = quality.get("by_protocol", {})
    total = summary.get("total_nodes", 0)

    by_proto = []
    # 遍历 protocols.json 定义的全部协议（6 个），0 节点的也输出，
    # 避免 hysteria2/tuic 等无快照协议从 stats 里失踪。
    for proto in PROTOCOLS_GUIDE:
        name = proto["id"]
        p = by_proto_raw.get(name, {})
        p_total = p.get("total", 0)
        pct = round(p_total / total * 100, 1) if total else 0
        by_proto.append({
            "name": name,
            "total": p_total,
            "alive": p.get("alive", 0),
            "survival_rate": p.get("survival_rate", 0),
            "avg_latency": p.get("avg_latency"),
            "percentage": pct,
        })
    by_proto.sort(key=lambda x: -x["total"])

    generated_at = quality.get("generated_at")
    return {
        "last_updated": generated_at,
        "freshness": _compute_freshness(generated_at),
        "total_nodes": total,
        "alive_nodes": summary.get("alive_nodes", 0),
        "survival_rate": summary.get("survival_rate", 0),
        "avg_latency_ms": summary.get("avg_latency_ms"),
        "verified": summary.get("verified", False),
        "total_sources": _count_active_sources(),
        "by_protocol": by_proto,
        # quality.json 已有 failure_reasons / regions，透传到 stats 供仪表盘展示
        "failure_reasons": quality.get("failure_reasons", {}),
        "regions_distribution": quality.get("regions", {}),
    }


def _count_active_sources() -> int:
    """统计当前 enabled 的源数量，供首页卡片展示。"""
    config = _load_json(CONFIG_PATH, {"free_node_sources": [], "free_proxy_apis": []})
    node_count = sum(1 for s in config.get("free_node_sources", []) if s.get("enabled"))
    proxy_count = sum(1 for s in config.get("free_proxy_apis", []) if s.get("enabled"))
    return node_count + proxy_count


def build_sources() -> list[dict]:
    """合并 sources.json + sources-report.json，按可靠性排序供数据源目录展示。

    新增 category 字段（nodes/proxies）便于前端分组展示。
    """
    config = _load_json(CONFIG_PATH, {})
    report = _load_json(NODES_DIR / "sources-report.json", {})
    reliability = report.get("reliability_score", {})

    category_map = {"free_node_sources": "nodes", "free_proxy_apis": "proxies"}
    out = []
    for cat_key, cat_label in category_map.items():
        for src in config.get(cat_key, []):
            name = src.get("name", "unknown")
            if src.get("status") == "observing":
                status = "observing"
            elif src.get("enabled"):
                status = "active"
            else:
                status = "disabled"

            out.append({
                "name": name,
                "type": src.get("type", ""),
                "category": cat_label,
                "status": status,
                "reliability": round(reliability.get(name, 0.0), 1),
                "protocols": src.get("protocols", []),
                "update_interval": src.get("update_interval", "daily"),
                "url": src.get("url", ""),
                "note": src.get("note", ""),
            })

    out.sort(key=lambda x: (-x["reliability"], x["name"]))
    return out


def _to_int(value) -> int | None:
    """容忍地把 port 等字段转成 int，非法值返回 None。"""
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _build_region_lookup(regions: dict) -> dict:
    """把 regions.json（{region: [links]}）反查成 {(server, port): region}。

    用 parser.node_to_clash_config 把每条 link 解析出 server+port 做关联键。
    解析失败的 link 跳过；import 失败时返回空映射（region 全部落到 unknown）。
    """
    lookup: dict[tuple, str] = {}
    try:
        from parser import node_to_clash_config
    except ImportError:
        return lookup
    for region, links in regions.items():
        for link in links or []:
            try:
                cfg = node_to_clash_config(link)
            except Exception:
                cfg = None
            if not cfg:
                continue
            key = (cfg.get("server"), _to_int(cfg.get("port")))
            if key[0] is not None and key[1] is not None:
                lookup.setdefault(key, region)
    return lookup


def build_nodes() -> dict:
    """节点级 JSON：优先读 nodes-detail.json（含验证状态），降级到 clash.yaml。

    nodes-detail.json 由 formatter.write_outputs 在流水线中生成，
    保留 per-node 的 alive/latency 信息；clash.yaml 降级方案不含这些字段。
    """
    # 优先读 nodes-detail.json
    detail_path = NODES_DIR / "nodes-detail.json"
    if detail_path.exists():
        try:
            data = json.loads(detail_path.read_text(encoding="utf-8"))
            if data and "nodes" in data:
                return data
        except (OSError, json.JSONDecodeError):
            pass  # 降级到 clash.yaml

    # 降级方案：从 clash.yaml 解析（无 alive/latency 信息）
    import yaml  # 局部导入

    clash_path = NODES_DIR / "clash.yaml"
    regions = _load_json(NODES_DIR / "regions.json", {})
    region_map = _build_region_lookup(regions)

    proxies = []
    if clash_path.exists():
        try:
            with clash_path.open(encoding="utf-8") as fh:
                clash_data = yaml.safe_load(fh) or {}
            proxies = clash_data.get("proxies") or []
        except (OSError, yaml.YAMLError):
            proxies = []

    nodes = []
    regions_summary: dict[str, int] = {}
    protocols_summary: dict[str, int] = {}
    for p in proxies:
        proto = p.get("type")
        port = _to_int(p.get("port"))
        region = region_map.get((p.get("server"), port), "unknown")
        sni = p.get("sni") or p.get("servername")
        nodes.append({
            "name": p.get("name"),
            "protocol": proto,
            "server": p.get("server"),
            "port": port,
            "server_sni": sni,
            "region": region,
            "alive": None,
            "latency_ms": None,
        })
        regions_summary[region] = regions_summary.get(region, 0) + 1
        if proto:
            protocols_summary[proto] = protocols_summary.get(proto, 0) + 1

    regions_summary = dict(sorted(regions_summary.items(), key=lambda x: -x[1]))
    protocols_summary = dict(sorted(protocols_summary.items(), key=lambda x: -x[1]))
    return {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total": len(nodes),
        "nodes": nodes,
        "regions_summary": regions_summary,
        "protocols_summary": protocols_summary,
    }


def _archive_dir_to_date(name: str) -> str | None:
    """归档目录名 YYYY-MMDD → YYYY-MM-DD（用于 trend.history.date）。"""
    try:
        return datetime.strptime(name, "%Y-%m%d").strftime("%Y-%m-%d")
    except ValueError:
        return None


def build_trend() -> dict:
    """7 天存活/延迟趋势：收集 nodes/archive/YYYY-MMDD/quality.json 快照。

    归档不存在时输出空数组 + 当前快照作为单点，保证前端总有数据可渲染。
    """
    archive_dir = NODES_DIR / "archive"
    snapshots: list[dict] = []
    if archive_dir.exists():
        for sub in archive_dir.iterdir():
            if not sub.is_dir():
                continue
            date_str = _archive_dir_to_date(sub.name)
            if not date_str:
                continue
            summary = _load_json(sub / "quality.json", {}).get("summary", {})
            snapshots.append({
                "date": date_str,
                "total_nodes": summary.get("total_nodes", 0),
                "alive_nodes": summary.get("alive_nodes"),
                "survival_rate": summary.get("survival_rate"),
                "avg_latency_ms": summary.get("avg_latency_ms"),
            })
    snapshots.sort(key=lambda x: x["date"])

    # 当前快照作为 latest；若归档未覆盖今天，补一个今日单点
    summary = _load_json(NODES_DIR / "quality.json", {}).get("summary", {})
    latest = {
        "total_nodes": summary.get("total_nodes", 0),
        "alive_nodes": summary.get("alive_nodes"),
        "survival_rate": summary.get("survival_rate"),
        "avg_latency_ms": summary.get("avg_latency_ms"),
    }
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if not snapshots or snapshots[-1]["date"] != today:
        snapshots.append({"date": today, **latest})

    history = snapshots[-7:]
    return {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "days": len(history),
        "history": history,
        "latest": latest,
    }


PIPELINE_STEPS = ("crawl", "parse", "dedup", "verify", "format", "archive")


def build_pipeline_status() -> dict:
    """流水线状态：透传 nodes/pipeline-status.json，缺失时给默认结构。

    update.py 在 main() 里用 time.perf_counter 记录各步骤耗时并写入源文件；
    本函数只做读取与兜底，保证 site 构建在流水线未运行时也有可用 JSON。
    """
    raw = _load_json(NODES_DIR / "pipeline-status.json", {})
    if raw:
        return raw
    return {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total_duration_ms": None,
        "steps": {s: {"duration_ms": None, "status": "unknown"} for s in PIPELINE_STEPS},
    }


def main() -> int:
    DOCS_DATA_DIR.mkdir(parents=True, exist_ok=True)

    datasets = {
        "site": build_site(),
        "subscriptions": build_subscriptions(),
        "stats": build_stats(),
        "sources": build_sources(),
        "protocols": PROTOCOLS_GUIDE,
        "clients": CLIENTS_GUIDE,
        "nodes": build_nodes(),
        "trend": build_trend(),
        "pipeline-status": build_pipeline_status(),
    }

    for name, data in datasets.items():
        path = DOCS_DATA_DIR / f"{name}.json"
        path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        count = len(data) if isinstance(data, list) else "dict"
        print(f"[site_builder] wrote {path.name}: {count} entries")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
