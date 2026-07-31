"""scripts/discover_sources.py 的单元测试。

全部 mock HTTP 响应，不发真实网络请求。
"""

import sys
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

import discover_sources as ds

# ─── 测试用的 GitHub Search API 响应样本 ──────────────────────────────

SAMPLE_SEARCH_RESPONSE = {
    "total_count": 4,
    "items": [
        {
            "id": 1,
            "name": "repo-a",
            "full_name": "owner-a/repo-a",
            "stargazers_count": 42,
            "fork": False,
            "pushed_at": "2026-07-01T00:00:00Z",
            "default_branch": "main",
            "description": "a test repo",
            "license": {"spdx_id": "MIT", "name": "MIT License"},
        },
        {
            "id": 2,
            "name": "repo-b",
            "full_name": "owner-b/repo-b",
            "stargazers_count": 3,
            "fork": False,
            "pushed_at": "2026-06-15T00:00:00Z",
            "default_branch": "main",
            "description": "low stars repo",
            "license": {"spdx_id": "MIT", "name": "MIT License"},
        },
        {
            "id": 3,
            "name": "forked-repo",
            "full_name": "owner-c/forked-repo",
            "stargazers_count": 100,
            "fork": True,
            "pushed_at": "2026-07-01T00:00:00Z",
            "default_branch": "main",
            "description": "a fork",
            "license": {"spdx_id": "MIT", "name": "MIT License"},
        },
        {
            "id": 4,
            "name": "no-license-repo",
            "full_name": "owner-d/no-license-repo",
            "stargazers_count": 100,
            "fork": False,
            "pushed_at": "2026-07-01T00:00:00Z",
            "default_branch": "main",
            "description": "no license",
            "license": None,
        },
    ],
}

# 测试用的仓库根目录 contents 响应
SAMPLE_CONTENTS_RESPONSE = [
    {"name": "sub", "path": "sub", "type": "file"},
    {"name": "v2ray.txt", "path": "v2ray.txt", "type": "file"},
    {"name": "clash.yaml", "path": "clash.yaml", "type": "file"},
    {"name": "README.md", "path": "README.md", "type": "file"},
    {"name": "LICENSE", "path": "LICENSE", "type": "file"},
    {"name": ".gitignore", "path": ".gitignore", "type": "file"},
    {"name": "src", "path": "src", "type": "dir"},
]


# ─── test_parse_search_response ─────────────────────────────────────


def test_parse_search_response():
    items = ds.parse_search_response(SAMPLE_SEARCH_RESPONSE)
    assert len(items) == 4
    assert items[0]["full_name"] == "owner-a/repo-a"


def test_parse_search_response_handles_bad_input():
    assert ds.parse_search_response({}) == []
    assert ds.parse_search_response({"items": []}) == []
    assert ds.parse_search_response({"items": "not a list"}) == []
    assert ds.parse_search_response("not a dict") == []


# ─── test_filter_by_stars ────────────────────────────────────────────


def test_filter_by_stars():
    items = ds.parse_search_response(SAMPLE_SEARCH_RESPONSE)
    # min_stars=5：repo-b（3 stars）被过滤
    kept = ds.filter_candidates(items, min_stars=5)
    names = [r["name"] for r in kept]
    assert "repo-a" in names
    assert "repo-b" not in names


def test_filter_by_stars_threshold_inclusive():
    # stars 恰好等于 min_stars 应保留
    repo = {"name": "r", "stargazers_count": 5, "fork": False, "license": {"spdx_id": "MIT"}}
    assert ds.filter_candidates([repo], min_stars=5) == [repo]


# ─── test_filter_forks ───────────────────────────────────────────────


def test_filter_forks():
    items = ds.parse_search_response(SAMPLE_SEARCH_RESPONSE)
    kept = ds.filter_candidates(items, min_stars=5)
    names = [r["name"] for r in kept]
    # forked-repo 应被过滤
    assert "forked-repo" not in names


def test_filter_license():
    items = ds.parse_search_response(SAMPLE_SEARCH_RESPONSE)
    kept = ds.filter_candidates(items, min_stars=5)
    names = [r["name"] for r in kept]
    # no-license-repo 应被过滤
    assert "no-license-repo" not in names


# ─── test_extract_candidate_files ────────────────────────────────────


def test_extract_candidate_files():
    candidates = ds.extract_candidate_files(SAMPLE_CONTENTS_RESPONSE)
    # sub / v2ray.txt / clash.yaml 都应被选中
    assert "sub" in candidates
    assert "v2ray.txt" in candidates
    assert "clash.yaml" in candidates
    # README/LICENSE/.gitignore/目录 都不应被选中
    assert "README.md" not in candidates
    assert "LICENSE" not in candidates
    assert ".gitignore" not in candidates
    assert "src" not in candidates


def test_extract_candidate_files_empty():
    assert ds.extract_candidate_files([]) == []
    assert ds.extract_candidate_files(None) == []


def test_extract_candidate_files_handles_base64_and_yml():
    files = [
        {"name": "nodes.base64", "type": "file"},
        {"name": "config.yml", "type": "file"},
        {"name": "v2ray", "type": "file"},
    ]
    candidates = ds.extract_candidate_files(files)
    assert "nodes.base64" in candidates
    assert "config.yml" in candidates
    assert "v2ray" in candidates


# ─── test_build_candidate_entry ──────────────────────────────────────


def test_build_candidate_entry():
    repo = SAMPLE_SEARCH_RESPONSE["items"][0]
    candidate_files = ["sub", "v2ray.txt", "clash.yaml"]
    entry = ds.build_candidate_entry(repo, candidate_files)
    assert entry is not None
    assert entry["name"] == "repo-a"
    assert entry["type"] == "github_raw"
    assert entry["url"] == "https://raw.githubusercontent.com/owner-a/repo-a/main/sub"
    assert entry["enabled"] is False
    assert entry["stars"] == 42
    assert entry["last_pushed"] == "2026-07-01"
    assert entry["license"] == "MIT"
    assert entry["description"] == "a test repo"
    assert entry["candidate_files"] == ["sub", "v2ray.txt", "clash.yaml"]
    assert "Discovered" in entry["note"]


def test_build_candidate_entry_no_files_returns_none():
    repo = SAMPLE_SEARCH_RESPONSE["items"][0]
    assert ds.build_candidate_entry(repo, []) is None


def test_build_candidate_entry_picks_extensionless_first():
    # 即使 .txt 排在前面，无扩展名的 sub 应被选为 URL 指向
    repo = SAMPLE_SEARCH_RESPONSE["items"][0]
    entry = ds.build_candidate_entry(repo, ["v2ray.txt", "clash.yaml", "sub"])
    assert entry is not None
    assert entry["url"].endswith("/sub")


def test_build_candidate_entry_uses_default_branch():
    repo = {
        "name": "r",
        "full_name": "owner/r",
        "stargazers_count": 10,
        "fork": False,
        "pushed_at": "2026-07-01T00:00:00Z",
        "default_branch": "master",
        "description": "d",
        "license": {"spdx_id": "MIT"},
    }
    entry = ds.build_candidate_entry(repo, ["v2ray.txt"])
    assert entry is not None
    assert entry["url"] == "https://raw.githubusercontent.com/owner/r/master/v2ray.txt"


# ─── test_rate_limit_handling ────────────────────────────────────────


def test_rate_limit_handling(capsys):
    # mock _github_request 抛 RateLimitError，main 应优雅退出，不写文件
    with patch.object(ds, "_github_request", side_effect=ds.RateLimitError("limit")):
        exit_code = ds.main(["--query", "test", "--max-results", "5"])
    assert exit_code == ds.EXIT_RATE_LIMIT
    err = capsys.readouterr().err
    assert "rate" in err.lower() or "limit" in err.lower()


def test_rate_limit_propagates_from_discover():
    # discover 在限速时直接抛 RateLimitError，不吞掉
    with (
        patch.object(ds, "_github_request", side_effect=ds.RateLimitError("limit")),
        pytest.raises(ds.RateLimitError),
    ):
        ds.discover(query="test", min_stars=5, max_results=5)


# ─── 端到端 mock 流程 ─────────────────────────────────────────────────


def test_discover_full_flow():
    # search + contents 都返回样本数据，端到端验证候选条目生成
    def fake_request(url, params=None, retries=2):
        if "search/repositories" in url:
            return SAMPLE_SEARCH_RESPONSE
        return SAMPLE_CONTENTS_RESPONSE

    with patch.object(ds, "_github_request", side_effect=fake_request):
        candidates = ds.discover(query="test", min_stars=5, max_results=10)

    names = [c["name"] for c in candidates]
    # repo-a 通过所有过滤且 contents 里有候选文件
    assert "repo-a" in names
    # 其余 3 个被 stars/fork/license 过滤掉
    assert "repo-b" not in names
    assert "forked-repo" not in names
    assert "no-license-repo" not in names
    # repo-a 的条目字段正确
    entry = candidates[0]
    assert entry["enabled"] is False
    assert entry["url"] == "https://raw.githubusercontent.com/owner-a/repo-a/main/sub"
    assert entry["candidate_files"] == ["sub", "v2ray.txt", "clash.yaml"]


def test_discover_skips_repo_without_candidate_files():
    # contents 里没有疑似订阅文件时，该仓库不出现在结果里
    search_resp = {
        "items": [
            {
                "name": "repo-x",
                "full_name": "owner-x/repo-x",
                "stargazers_count": 50,
                "fork": False,
                "pushed_at": "2026-07-01T00:00:00Z",
                "default_branch": "main",
                "description": "no sub files",
                "license": {"spdx_id": "MIT"},
            }
        ]
    }
    contents_resp = [
        {"name": "README.md", "type": "file"},
        {"name": "LICENSE", "type": "file"},
        {"name": "src", "type": "dir"},
    ]

    def fake_request(url, params=None, retries=2):
        if "search/repositories" in url:
            return search_resp
        return contents_resp

    with patch.object(ds, "_github_request", side_effect=fake_request):
        candidates = ds.discover(query="test", min_stars=5, max_results=5)
    assert candidates == []


# ─── query 构造 ──────────────────────────────────────────────────────


def test_build_query_includes_filters():
    fixed_now = datetime(2026, 7, 4, 12, 0, 0, tzinfo=timezone.utc)
    q = ds._build_query(None, min_stars=5, days=30, now=fixed_now)
    # 默认关键词 + stars + fork + pushed（30 天前 = 2026-06-04）
    assert "freenode" in q
    assert "stars:>=5" in q
    assert "fork:false" in q
    assert "pushed:>2026-06-04" in q


def test_build_query_uses_custom_query():
    fixed_now = datetime(2026, 7, 4, 12, 0, 0, tzinfo=timezone.utc)
    q = ds._build_query("shadowrocket nodes", min_stars=10, now=fixed_now)
    assert q.startswith("shadowrocket nodes")
    assert "stars:>=10" in q


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
