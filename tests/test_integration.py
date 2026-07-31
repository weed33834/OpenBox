"""Full-pipeline integration tests simulating real-world scenarios.

Covers the complete data flow from crawl → parse → dedup → verify → format →
site_builder, plus edge cases: empty inputs, malformed data, network failures,
and production boundary conditions.
"""
from __future__ import annotations

import contextlib
import json
import sys
import tempfile
import threading
from pathlib import Path
from unittest import mock

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))


@contextlib.contextmanager
def _set_nodes_dir(tmp: Path):
    """Temporarily override NODES_DIR in utils and formatter."""
    import formatter

    import utils
    old_utils = utils.NODES_DIR
    old_fmt = formatter.NODES_DIR
    utils.NODES_DIR = tmp
    formatter.NODES_DIR = tmp
    try:
        yield
    finally:
        utils.NODES_DIR = old_utils
        formatter.NODES_DIR = old_fmt

# ── Test fixtures ──────────────────────────────────────────────


@pytest.fixture
def sample_links() -> list[str]:
    """Realistic mixed-protocol link sample for integration testing."""
    return [
        "vmess://eyJ2IjoiMiIsInBzIjoiVVMtV2VzdC0wMSIsImFkZCI6IjE5Mi4wLjIuMSIsInBvcnQiOjg0NDMsImlkIjoiYWIxMmNkLTM0ZWYtMTFlZi04MTIzLTAwMDAwMDAwMDAwMSIsImFpZCI6MCwic2N5IjoiYXV0byIsIm5ldCI6IndzIiwidHlwZSI6Im5vbmUiLCJob3N0IjoidXMtd2VzdC5leGFtcGxlLmNvbSIsInBhdGgiOiIvIiwidGxzIjoidGxzIn0=",
        "trojan://password123@trojan.example.com:443#JP-Tokyo-01",
        "ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTpwYXNzd29yZDEyM0Bzc2VydmVyLmV4YW1wbGUuY29tOjgzODg=",
        "vless://uuid-test-1234@vless.example.com:443?encryption=none&security=tls&type=ws&path=%2Fws#SG-Singapore-01",
        "hysteria2://hysteria2.example.com:443?auth=test_auth&sni=hysteria2.example.com#HK-Central-01",
        "tuic://uuid-tuic-test@tuic.example.com:443?congestion_control=bbr&alpn=h3&sni=tuic.example.com#KR-Seoul-01",
    ]


@pytest.fixture
def mock_crawler_response():
    """Simulate a crawler result with mixed sources."""
    vmess_text = "vmess://eyJ2IjoiMiIsInBzIjoiVVMtV2VzdC0wMSIsImFkZCI6IjE5Mi4wLjIuMSIsInBvcnQiOjg0NDMsImlkIjoiYWIxMmNkLTM0ZWYtMTFlZi04MTIzLTAwMDAwMDAwMDAwMSIsImFpZCI6MCwic2N5IjoiYXV0byIsIm5ldCI6IndzIiwidHlwZSI6Im5vbmUiLCJob3N0IjoidXMtd2VzdC5leGFtcGxlLmNvbSIsInBhdGgiOiIvIiwidGxzIjoidGxzIn0="
    ss_text = "ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTpwYXNzd29yZDEyM0Bzc2VydmVyLmV4YW1wbGUuY29tOjgzODg=#SS-Example"
    return {
        "nodes": [
            {"name": "source-1", "text": vmess_text},
            {"name": "source-2", "text": ss_text},
            {"name": "source-3", "text": ""},  # empty source
        ],
        "proxies": [
            {"name": "proxy-source-1", "text": "http://1.2.3.4:8080\nsocks5://5.6.7.8:1080"},
        ],
    }


@pytest.fixture
def temp_output_dir():
    """Temporary output directory for formatter writes."""
    with tempfile.TemporaryDirectory() as tmp:
        yield Path(tmp)


# ── Crawl → Parse integration ──────────────────────────────────


def test_crawl_to_parse_pipeline(mock_crawler_response):
    """Crawl output feeds correctly into parser: no link loss, empty source handled."""
    from parser import extract_node_links, parse_proxy_api_response

    all_links = []
    parse_errors = 0
    for item in mock_crawler_response["nodes"]:
        try:
            links = extract_node_links(item["text"])
            all_links.extend(links)
        except Exception:
            parse_errors += 1

    # Source 3 is empty → 0 links, not an error in our model
    assert len(all_links) == 2, f"Expected 2 links (vmess + ss), got {len(all_links)}"
    assert parse_errors == 0

    # Proxy parsing
    proxies = []
    for item in mock_crawler_response["proxies"]:
        try:
            p = parse_proxy_api_response(item["text"])
            proxies.extend(p)
        except Exception:
            pass
    assert len(proxies) == 2  # http + socks5


def test_parse_edge_cases():
    """Parser handles all edge cases without crashing."""
    from parser import extract_node_links

    # Empty / whitespace
    assert extract_node_links("") == []
    assert extract_node_links("   \n  ") == []

    # Mixed valid and garbage
    mixed = "vmess://invalid\n  \n# comment\n\nvmess://validbase64"
    result = extract_node_links(mixed)
    # Should not crash; may return 0-1 valid links
    assert isinstance(result, list)

    # Extremely long input (>1MB)
    huge = "a" * 1_500_000
    result = extract_node_links(huge)
    assert isinstance(result, list)


# ── Parse → Dedup integration ──────────────────────────────────


def test_parse_to_dedup_pipeline(sample_links):
    """Dedup correctly removes duplicates by fingerprint."""
    from dedup import dedup_by_fingerprint

    # Add duplicates
    links_with_dupes = sample_links + sample_links[:2] + sample_links[:2]
    assert len(links_with_dupes) == len(sample_links) + 4

    deduped = dedup_by_fingerprint(links_with_dupes)
    assert len(deduped) == len(sample_links)

    # Empty input
    assert dedup_by_fingerprint([]) == []

    # All duplicates
    single = sample_links[:1] * 10
    assert len(dedup_by_fingerprint(single)) == 1


# ── Parse → Verify integration ─────────────────────────────────


@mock.patch("socket.create_connection")
def test_verify_empty_input(mock_connect):
    """Verifier handles empty input gracefully."""
    from verifier import verify_nodes

    results = verify_nodes([], max_workers=1, geo_enabled=False)
    assert results == []


def test_verify_malformed_links():
    """Verifier doesn't crash on malformed links, all should fail."""
    from verifier import RETRY_ON_FLAKY, verify_nodes

    # Override retry count to 0 so malformed links fail immediately
    old_retry = RETRY_ON_FLAKY
    try:
        import verifier as vmod
        vmod.RETRY_ON_FLAKY = 0

        bad_links = [
            "not-a-link",
            "ftp://unknown.protocol.com:21",
            "vmess://invalid-base64!!!",
            "ss://badformat",
        ]
        results = verify_nodes(bad_links, max_workers=1, verify_level="tcp", geo_enabled=False)
        assert len(results) == len(bad_links)
        for r in results:
            assert r["alive"] is False, f"Expected dead for {r['link']}, got alive"
    finally:
        vmod.RETRY_ON_FLAKY = old_retry


@mock.patch("socket.create_connection")
def test_verify_partial_success(mock_connect):
    """Mixed valid/invalid nodes: only valid survive."""
    from verifier import RETRY_ON_FLAKY, verify_nodes

    old_retry = RETRY_ON_FLAKY
    try:
        import verifier as vmod
        vmod.RETRY_ON_FLAKY = 0

        def _selective_connect(address, *args, **kw):
            port = address[1] if len(address) > 1 else 0
            if port in (8443, 443):
                return mock.MagicMock()
            raise ConnectionRefusedError("mock: connection refused")

        mock_connect.side_effect = _selective_connect

        links = [
            "trojan://pwd@1.1.1.1:443#Good",
            "trojan://pwd@1.1.1.1:9999#Bad",
        ]
        results = verify_nodes(links, max_workers=2, verify_level="tcp", geo_enabled=False)
        alive = [r for r in results if r.get("alive")]
        assert len(alive) == 1, f"Expected 1 alive, got {len(alive)}: {results}"
    finally:
        vmod.RETRY_ON_FLAKY = old_retry


# ── Dedup → Format integration ─────────────────────────────────


def test_format_empty_items(temp_output_dir):
    """Formatter handles empty input without crashing."""
    from formatter import write_outputs

    with _set_nodes_dir(temp_output_dir):
        write_outputs([], [], verified=False)

    # All files should exist with empty content
    for fname in ("clash.yaml", "v2ray.txt", "proxies.txt", "quality.json"):
        path = temp_output_dir / fname
        assert path.exists(), f"Missing output: {fname}"
        content = path.read_text(encoding="utf-8")
        assert len(content) > 0, f"Empty file: {fname}"


def test_format_with_links(temp_output_dir, sample_links):
    """Formatted output contains expected structure."""
    from formatter import write_outputs

    items = [{"link": link, "region": "unknown", "latency_ms": 100} for link in sample_links]
    with _set_nodes_dir(temp_output_dir):
        write_outputs(items, [], verified=False)

    # Clash YAML structure check
    clash = temp_output_dir / "clash.yaml"
    content = clash.read_text(encoding="utf-8")
    assert "proxies:" in content
    assert "proxy-groups:" in content

    # V2Ray base64 check
    v2ray = temp_output_dir / "v2ray.txt"
    v2ray_content = v2ray.read_text(encoding="utf-8")
    assert len(v2ray_content) > 0

    # Quality JSON structure
    quality = json.loads((temp_output_dir / "quality.json").read_text(encoding="utf-8"))
    assert "summary" in quality
    assert quality["summary"]["total_nodes"] == len(sample_links)
    assert "by_protocol" in quality


# ── Data layer integration (formatter → site_builder) ──────────


def test_formatter_output_feeds_site_builder(temp_output_dir, sample_links):
    """Ensure site_builder can consume formatter output."""
    from formatter import write_outputs

    items = [{"link": link, "region": "unknown", "latency_ms": 50} for link in sample_links]
    with _set_nodes_dir(temp_output_dir):
        write_outputs(items, [], verified=True)

    # Verify quality.json parseability
    quality_path = temp_output_dir / "quality.json"
    assert quality_path.exists()
    quality = json.loads(quality_path.read_text(encoding="utf-8"))
    assert quality["summary"]["verified"] is True
    assert "failure_reasons" in quality

    # Verify nodes-detail.json parseability
    detail_path = temp_output_dir / "nodes-detail.json"
    assert detail_path.exists()
    detail = json.loads(detail_path.read_text(encoding="utf-8"))
    assert len(detail["nodes"]) >= 1  # some may be filtered (private IPs)
    for n in detail["nodes"]:
        assert "protocol" in n


# ── Full pipeline integration (mock crawl → format) ────────────


@mock.patch("crawler.crawl")
def test_full_pipeline_end_to_end(mock_crawl, temp_output_dir):
    """Simulate the complete pipeline from crawl to formatted outputs."""
    from dedup import dedup_by_fingerprint
    from formatter import write_outputs
    from parser import extract_node_links

    # Setup mock crawl
    mock_crawl.return_value = {
        "nodes": [
            {"name": "test-source", "text": (
                "vmess://eyJ2IjoiMiIsInBzIjoiVGVzdCIsImFkZCI6IjEwLjAuMC4xIiwicG9ydCI6NDQzLCJpZCI6InRlc3QtdXVpZCIsIm5ldCI6IndzIn0=\n"
                "trojan://pass@test.example.com:443#Test-Trojan\n"
                "ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTpwQHNzLmNvbTozODg=#SS-Test"
            )},
        ],
        "proxies": [],
    }

    # Crawl
    raw = mock_crawl()
    assert len(raw["nodes"]) == 1

    # Parse
    all_links = []
    for item in raw["nodes"]:
        links = extract_node_links(item["text"])
        all_links.extend(links)
    all_links = list(dict.fromkeys(all_links))
    assert len(all_links) == 3  # vmess + trojan + ss

    # Dedup
    before = len(all_links)
    all_links = dedup_by_fingerprint(all_links)
    assert len(all_links) == before  # no duplicates in mock

    # Format (skip verify since we're testing the data pipeline)
    items = [{"link": link, "region": "unknown", "latency_ms": None} for link in all_links]
    with _set_nodes_dir(temp_output_dir):
        write_outputs(items, [], verified=False)

    # Verify all output files exist and are valid
    for fname in ("clash.yaml", "v2ray.txt", "proxies.txt", "quality.json", "nodes-detail.json"):
        assert (temp_output_dir / fname).exists(), f"Missing: {fname}"

    # Quality JSON integrity
    q = json.loads((temp_output_dir / "quality.json").read_text(encoding="utf-8"))
    assert q["summary"]["total_nodes"] == 3
    assert isinstance(q["by_protocol"], dict)
    assert any(q["by_protocol"].values())


# ── Error recovery scenarios ───────────────────────────────────


def test_crawl_failure_graceful_degradation(temp_output_dir):
    """Pipeline should not crash when crawl returns empty results."""
    from formatter import write_outputs

    with _set_nodes_dir(temp_output_dir):
        write_outputs([], [], verified=False)
    assert (temp_output_dir / "quality.json").exists()

    q = json.loads((temp_output_dir / "quality.json").read_text(encoding="utf-8"))
    assert q["summary"]["total_nodes"] == 0


def test_parse_error_recovery():
    """Parse errors should not block the pipeline for other sources."""
    from parser import extract_node_links

    good_text = "vmess://eyJ2IjoiMiIsInBzIjoiRyIsImFkZCI6IjEwLjAuMC4yIiwicG9ydCI6NDQzLCJpZCI6InRlc3QifQ=="
    bad_text = "garbage\n\nnot-a-link!!!\n@#$%^"

    # These should not raise
    good_links = extract_node_links(good_text)
    bad_links = extract_node_links(bad_text)

    assert len(good_links) >= 1
    assert isinstance(bad_links, list)


def test_dedup_edge_cases():
    """Dedup handles boundary inputs."""
    from dedup import dedup_by_fingerprint

    # Single element
    assert len(dedup_by_fingerprint(["vmess://single"])) == 1

    # Duplicate removal with real parseable links
    import base64
    vmess_cfg = '{"v":"2","ps":"Node","add":"10.0.0.1","port":443,"id":"abc","net":"ws"}'
    vmess = "vmess://" + base64.b64encode(vmess_cfg.encode()).decode()
    dupes = [vmess, vmess]
    result = dedup_by_fingerprint(dupes)
    assert len(result) == 1


def test_dedup_hysteria_tuic_password_in_fingerprint():
    """hysteria/hysteria2/tuic 的密码必须参与指纹（回归 I4）。

    同 server+port 不同密码的节点不应被当重复丢弃。
    """
    from dedup import dedup_by_fingerprint

    # hysteria2: 同 server+port 不同 password
    hy2_a = "hysteria2://example.com:443?auth=passA#NodeA"
    hy2_b = "hysteria2://example.com:443?auth=passB#NodeB"
    result = dedup_by_fingerprint([hy2_a, hy2_b])
    assert len(result) == 2, "不同密码的 hysteria2 节点不应被去重"

    # tuic: 同 server+port 不同 uuid:password
    tuic_a = "tuic://uuidA:passA@example.com:443#NodeA"
    tuic_b = "tuic://uuidB:passB@example.com:443#NodeB"
    result = dedup_by_fingerprint([tuic_a, tuic_b])
    assert len(result) == 2, "不同凭据的 tuic 节点不应被去重"

    # 同密码同 server 应被去重
    dup = [hy2_a, hy2_a]
    assert len(dedup_by_fingerprint(dup)) == 1


def test_site_builder_resilience():
    """site_builder handles missing input files without crashing."""
    from site_builder import build_site, build_stats, build_subscriptions

    # These should never raise, regardless of file state
    assert isinstance(build_site(), dict)
    assert isinstance(build_subscriptions(), list)
    assert isinstance(build_stats(), dict)


# ── Concurrent safety ───────────────────────────────────────────


def test_verifier_thread_safety():
    """Verifier runs correctly under concurrent load."""
    from verifier import _geo_locks_guard, verify_nodes

    # Verify per-host lock guard exists and is a threading.Lock
    assert isinstance(_geo_locks_guard, type(threading.Lock()))

    with mock.patch("socket.create_connection") as mock_conn:
        mock_conn.side_effect = lambda *a, **kw: _fake_connection()

        links = [f"vmess://node-{i}" for i in range(20)]
        results = verify_nodes(links, max_workers=10, geo_enabled=False, verify_level="tcp")
        assert len(results) > 0


def _fake_connection():
    """Return a mock socket that times out all verification."""
    raise TimeoutError("mock timeout")


# ── Data schema validation ─────────────────────────────────────


def test_quality_json_schema(temp_output_dir):
    """Verify quality.json output schema matches expected fields."""
    from formatter import write_outputs

    with _set_nodes_dir(temp_output_dir):
        write_outputs([], [], verified=False)

    quality = json.loads((temp_output_dir / "quality.json").read_text(encoding="utf-8"))
    required_fields = {"generated_at", "summary", "by_protocol", "failure_reasons", "regions"}
    missing = required_fields - set(quality.keys())
    assert not missing, f"Missing fields in quality.json: {missing}"

    summary_fields = {"total_nodes", "alive_nodes", "survival_rate", "avg_latency_ms", "verified"}
    assert set(quality["summary"].keys()) >= summary_fields


def test_nodes_detail_schema(temp_output_dir):
    """Verify nodes-detail.json schema."""
    from formatter import write_outputs

    sample = [
        {"link": "trojan://pass@test.example.com:443#Test", "region": "US", "latency_ms": 42}
    ]
    with _set_nodes_dir(temp_output_dir):
        write_outputs(sample, [], verified=True)

    detail = json.loads((temp_output_dir / "nodes-detail.json").read_text(encoding="utf-8"))
    assert "nodes" in detail
    assert "generated_at" in detail
    node = detail["nodes"][0]
    required_fields = {"name", "protocol", "server", "port", "region", "alive", "latency_ms"}
    assert set(node.keys()) >= required_fields


# ── Pipeline status tracking ────────────────────────────────────


def test_pipeline_status_tracking(temp_output_dir):
    """Pipeline status tracks all steps."""
    from formatter import write_outputs

    with _set_nodes_dir(temp_output_dir):
        write_outputs([], [], verified=False)

    # pipeline-status.json is written by update.py main()
    # but site_builder should handle its absence
    from site_builder import build_pipeline_status

    result = build_pipeline_status()
    assert "steps" in result
    for step in ("crawl", "parse", "dedup", "verify", "format", "archive"):
        assert step in result["steps"]


# ── Security boundaries ─────────────────────────────────────────


def test_private_ip_filtering():
    """Private IP addresses should be filtered from outputs."""

    # node_to_clash_config returns config with server field
    # Let's test via the formatter's private IP filtering directly
    from utils import is_private_host

    assert is_private_host("127.0.0.1") is True
    assert is_private_host("192.168.1.1") is True
    assert is_private_host("10.0.0.1") is True
    assert is_private_host("172.16.0.1") is True
    assert is_private_host("8.8.8.8") is False
    assert is_private_host("example.com") is False


def test_ymls_safe_dump():
    """YAML output must use safe_dump, never unsafe dump."""
    import inspect

    from formatter import to_clash_yaml

    source = inspect.getsource(to_clash_yaml)
    assert "yaml.dump(" not in source  # yaml.safe_dump only
    assert "safe_dump" in source
