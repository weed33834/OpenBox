"""健康检查与监控 API。

提供 `/health`、`/metrics` 端点，可独立运行或通过 CI 调用。
适用于企业监控（Prometheus/Grafana/ELK）。

用法：
    python scripts/health_api.py          # 启动监听 0.0.0.0:9000
    python scripts/health_api.py --port 8080  # 指定端口

端点：
    GET /health      → {status, checks: {nodes, proxies, pipeline, sources}}
    GET /metrics     → OpenMetrics-compatible 文本
    GET /ready       → 就绪探针 (K8s readiness gate)
    GET /            → 重定向到 /health
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
NODES_DIR = PROJECT_ROOT / "nodes"
CONFIG_PATH = PROJECT_ROOT / "config" / "sources.json"


# ── 数据读取 ──────────────────────────────────────────────────────────────────

def _read_json(path: Path) -> dict | list | None:
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def _check_nodes() -> dict:
    """检查节点数据质量。"""
    quality = _read_json(NODES_DIR / "quality.json") or {}
    # quality.json 的统计字段嵌套在 summary 下（见 formatter._compute_stats），
    # 之前误读顶层导致 alive_nodes 永远为 0、_is_ready() 永远返回 False。
    summary = quality.get("summary") or quality
    detail = _read_json(NODES_DIR / "nodes-detail.json") or []
    clash = "clash.yaml" if (NODES_DIR / "clash.yaml").exists() else None
    return {
        "status": "ok",
        "total_nodes": summary.get("total_nodes", len(detail)),
        "alive_nodes": summary.get("alive_nodes", 0),
        "survival_rate": summary.get("survival_rate", 0),
        "output_files": {
            "clash_yaml": clash,
            "v2ray_txt": "v2ray.txt" if (NODES_DIR / "v2ray.txt").exists() else None,
            "proxies_txt": "proxies.txt" if (NODES_DIR / "proxies.txt").exists() else None,
        },
    }


def _check_sources() -> dict:
    """检查源配置状态。"""
    config = _read_json(CONFIG_PATH)
    if not config:
        return {"status": "error", "message": "sources.json not found"}
    node_sources = config.get("free_node_sources", [])
    proxy_sources = config.get("free_proxy_apis", [])
    enabled = [s for s in node_sources + proxy_sources if s.get("enabled")]
    return {
        "status": "ok",
        "total_sources": len(node_sources) + len(proxy_sources),
        "enabled_sources": len(enabled),
    }


def _check_pipeline() -> dict:
    """检查流水线状态。"""
    status = _read_json(NODES_DIR / "pipeline-status.json")
    if not status:
        return {"status": "unknown", "message": "no pipeline status"}
    return {"status": "ok", "last_run": status.get("generated_at"), "duration_ms": status.get("total_duration_ms")}


# ── HTTP Handler ──────────────────────────────────────────────────────────────

class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split("?")[0]

        if path == "/health":
            self._json(self._health_check())
        elif path == "/metrics":
            self._text(self._metrics())
        elif path == "/ready":
            self._json(self._ready_check(), code=200 if self._is_ready() else 503)
        elif path == "/":
            self.send_response(302)
            self.send_header("Location", "/health")
            self.end_headers()
        else:
            self._json({"error": "not found"}, code=404)

    def _health_check(self) -> dict:
        nodes = _check_nodes()
        pipeline = _check_pipeline()
        sources = _check_sources()
        overall = "ok"
        if nodes.get("alive_nodes", 0) < 1:
            overall = "degraded"
        if sources["status"] == "error":
            overall = "error"
        return {
            "status": overall,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "checks": {"nodes": nodes, "pipeline": pipeline, "sources": sources},
        }

    def _metrics(self) -> str:
        nodes = _check_nodes()
        sources = _check_sources()
        lines = [
            "# HELP freenode_nodes_total Total node count.",
            "# TYPE freenode_nodes_total gauge",
            f"freenode_nodes_total {nodes.get('total_nodes', 0)}",
            "# HELP freenode_nodes_alive Alive node count.",
            "# TYPE freenode_nodes_alive gauge",
            f"freenode_nodes_alive {nodes.get('alive_nodes', 0)}",
            "# HELP freenode_nodes_survival_rate Node survival rate (0-100).",
            "# TYPE freenode_nodes_survival_rate gauge",
            f"freenode_nodes_survival_rate {nodes.get('survival_rate', 0)}",
            "# HELP freenode_sources_enabled Enabled source count.",
            "# TYPE freenode_sources_enabled gauge",
            f"freenode_sources_enabled {sources.get('enabled_sources', 0)}",
        ]
        return "\n".join(lines) + "\n"

    def _ready_check(self) -> dict:
        ready = self._is_ready()
        return {"ready": ready, "timestamp": datetime.now(timezone.utc).isoformat()}

    def _is_ready(self) -> bool:
        nodes = _check_nodes()
        return nodes.get("alive_nodes", 0) >= 1 and (NODES_DIR / "clash.yaml").exists()

    def _json(self, data: dict, code: int = 200):
        body = json.dumps(data, ensure_ascii=False, indent=2, default=str).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _text(self, text: str, code: int = 200):
        body = text.encode()
        self.send_response(code)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        pass  # 禁止 stderr 日志


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="FreeNode Health Check API")
    parser.add_argument("--port", type=int, default=9000, help="Listen port (default: 9000)")
    parser.add_argument("--host", default="0.0.0.0", help="Listen host (default: 0.0.0.0)")
    args = parser.parse_args()

    server = HTTPServer((args.host, args.port), HealthHandler)
    print(f"Health API listening on http://{args.host}:{args.port}/health")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
        server.shutdown()


if __name__ == "__main__":
    main()
