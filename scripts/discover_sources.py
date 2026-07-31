"""通过 GitHub Search API 发现新的 free node 数据源候选。

不自动启用，结果写到 nodes/discovered-sources.json，等人工审核。
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import httpx

# 让脚本能直接 import utils（pytest 走 pyproject 的 pythonpath 也能找到）
sys.path.insert(0, str(Path(__file__).parent))

from utils import USER_AGENT, ConfigurationError, get_logger, ssl_context, validate_url

logger = get_logger("discover")

GITHUB_SEARCH_URL = "https://api.github.com/search/repositories"
GITHUB_CONTENTS_URL_TMPL = "https://api.github.com/repos/{full_name}/contents"
GITHUB_RAW_URL_TMPL = "https://raw.githubusercontent.com/{full_name}/{branch}/{path}"

DEFAULT_QUERY = "freenode OR v2ray subscription OR free proxy OR clash subscription OR free-node"

# 疑似订阅文件的扩展名
SUSPECT_EXTS = {".txt", ".yaml", ".yml", ".base64"}
# 疑似订阅文件名（无扩展名的常见订阅文件名）
SUSPECT_NAMES = {
    "sub",
    "subscribe",
    "v2ray",
    "clash",
    "vless",
    "trojan",
    "vmess",
    "proxy",
    "proxypool",
    "nodes",
    "freenode",
    "freenodes",
    "eternity",
    "ss",
    "ssr",
    "mixed",
    "all",
}

# 候选文件 URL 优先级（越小越优先）。无扩展名最优先，毕竟 sub/v2ray 这类最像订阅。
_EXT_PRIORITY = {
    "": 0,
    ".base64": 1,
    ".txt": 2,
    ".yaml": 3,
    ".yml": 3,
}

# 退出码
EXIT_RATE_LIMIT = 10
EXIT_NETWORK_ERROR = 11

# GitHub Search API 单页最多 100 条
_PER_PAGE_MAX = 100
# GitHub Search 最多翻 1000 条结果
_MAX_PAGES = 10


class RateLimitError(RuntimeError):
    """GitHub API 触发限速时抛出。"""


class GitHubAPIError(RuntimeError):
    """GitHub API 返回非 2xx 或网络错误时抛出。"""


def _iso_now() -> str:
    """返回 UTC 当前时间的 ISO 8601 字符串。"""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _today_str(now: datetime | None = None) -> str:
    """返回今天的 YYYY-MM-DD 字符串。"""
    base = now or datetime.now(timezone.utc)
    return base.strftime("%Y-%m-%d")


def _date_n_days_ago(days: int, *, now: datetime | None = None) -> str:
    """返回 n 天前的 YYYY-MM-DD 字符串。"""
    base = now or datetime.now(timezone.utc)
    return (base - timedelta(days=days)).strftime("%Y-%m-%d")


def _build_query(
    user_query: str | None,
    *,
    min_stars: int,
    days: int = 30,
    now: datetime | None = None,
) -> str:
    """拼出 GitHub Search 的 q 参数，附带 stars/fork/pushed 过滤。"""
    base = (user_query or "").strip() or DEFAULT_QUERY
    pushed_date = _date_n_days_ago(days, now=now)
    return f"{base} stars:>={min_stars} fork:false pushed:>{pushed_date}"


def _auth_headers() -> dict[str, str]:
    """构造请求头：User-Agent + 可选 GITHUB_TOKEN 认证。"""
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/vnd.github+json",
    }
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def _github_request(
    url: str,
    *,
    params: dict[str, str | int] | None = None,
    retries: int = 2,
) -> dict | list:
    """对 GitHub API 发 GET；网络错误重试 retries 次；403 限速直接抛 RateLimitError。"""
    headers = _auth_headers()
    for attempt in range(retries + 1):
        try:
            with httpx.Client(timeout=20.0, verify=ssl_context()) as client:
                resp = client.get(url, headers=headers, params=params)
        except httpx.HTTPError as exc:
            # 网络错误：重试
            if attempt < retries:
                time.sleep(1.0 * (attempt + 1))
                continue
            raise GitHubAPIError(f"network error: {exc}") from exc

        # 限速：403 + X-RateLimit-Remaining: 0，不重试直接抛
        if resp.status_code == 403 and resp.headers.get("X-RateLimit-Remaining") == "0":
            raise RateLimitError(
                "GitHub API rate limit exceeded (X-RateLimit-Remaining: 0)"
            )
        # 5xx 瞬时错误：重试
        if 500 <= resp.status_code < 600 and attempt < retries:
            time.sleep(1.0 * (attempt + 1))
            continue
        # 其他 4xx/5xx：直接抛
        if resp.status_code >= 400:
            raise GitHubAPIError(
                f"GitHub API {resp.status_code}: {resp.text[:200]}"
            )
        return resp.json()
    raise GitHubAPIError("request failed unexpectedly")


def parse_search_response(data: dict | list) -> list[dict]:
    """从 GitHub Search API 响应里取出 items 列表。"""
    if not isinstance(data, dict):
        return []
    items = data.get("items")
    if not isinstance(items, list):
        return []
    return items


def filter_candidates(repos: list[dict], min_stars: int) -> list[dict]:
    """按 stars / fork / license 客户端再过滤一次（兜底）。"""
    kept: list[dict] = []
    for repo in repos:
        if not isinstance(repo, dict):
            continue
        if repo.get("stargazers_count", 0) < min_stars:
            continue
        if repo.get("fork", False):
            continue
        if not repo.get("license"):
            continue
        kept.append(repo)
    return kept


def extract_candidate_files(file_list: list[dict] | None) -> list[str]:
    """从仓库根目录文件列表里挑出疑似订阅文件名。"""
    candidates: list[str] = []
    for item in file_list or []:
        if not isinstance(item, dict):
            continue
        # 只看文件，跳过 dir/symlink
        if item.get("type") not in (None, "file"):
            continue
        name = item.get("name") or ""
        if not name:
            continue
        p = Path(name.lower())
        last_ext = p.suffix
        stem = p.stem
        if last_ext in SUSPECT_EXTS or (not last_ext and stem in SUSPECT_NAMES):
            candidates.append(name)
    return candidates


def _candidate_priority(name: str) -> int:
    """给候选文件排序：返回优先级（越小越优先）。"""
    return _EXT_PRIORITY.get(Path(name.lower()).suffix, 99)


def _pick_primary_file(candidate_files: list[str]) -> str | None:
    """从候选文件里挑一个作为输出 URL 的指向，没有就返回 None。"""
    if not candidate_files:
        return None
    return min(candidate_files, key=_candidate_priority)


def build_candidate_entry(repo: dict, candidate_files: list[str]) -> dict | None:
    """构建单个候选条目，字段对齐 sources.json 风格但 enabled=false。"""
    primary = _pick_primary_file(candidate_files)
    if primary is None:
        return None
    full_name = repo.get("full_name") or ""
    if not full_name:
        return None
    default_branch = repo.get("default_branch") or "main"
    raw_url = GITHUB_RAW_URL_TMPL.format(
        full_name=full_name, branch=default_branch, path=primary
    )
    try:
        validate_url(raw_url)
    except ConfigurationError as exc:
        logger.warning("skip %s: invalid url %s (%s)", full_name, raw_url, exc)
        return None

    license_info = repo.get("license") or {}
    license_name = license_info.get("spdx_id") or license_info.get("name") or "UNKNOWN"

    return {
        "name": repo.get("name") or full_name,
        "type": "github_raw",
        "url": raw_url,
        "enabled": False,
        "stars": repo.get("stargazers_count", 0),
        "last_pushed": (repo.get("pushed_at") or "")[:10],
        "license": license_name,
        "description": repo.get("description") or "",
        "candidate_files": list(candidate_files),
        "note": f"Discovered {_today_str()} via GitHub Search.",
    }


def search_repositories(query: str, max_results: int) -> list[dict]:
    """调用 GitHub Search API，最多拉 max_results 个仓库。"""
    items: list[dict] = []
    page = 1
    per_page = min(max_results, _PER_PAGE_MAX)
    while len(items) < max_results:
        data = _github_request(
            GITHUB_SEARCH_URL,
            params={
                "q": query,
                "sort": "stars",
                "order": "desc",
                "per_page": per_page,
                "page": page,
            },
        )
        page_items = parse_search_response(data)
        if not page_items:
            break
        items.extend(page_items)
        # 不足一页说明没更多了
        if len(page_items) < per_page:
            break
        page += 1
        if page > _MAX_PAGES:
            break
    return items[:max_results]


def list_repo_contents(full_name: str) -> list[dict]:
    """拉仓库根目录文件列表，失败返回空列表。"""
    url = GITHUB_CONTENTS_URL_TMPL.format(full_name=full_name)
    try:
        data = _github_request(url)
    except GitHubAPIError as exc:
        logger.warning("contents fetch failed for %s: %s", full_name, exc)
        return []
    if isinstance(data, list):
        return data
    return []


def discover(
    *,
    query: str | None,
    min_stars: int,
    max_results: int,
    now: datetime | None = None,
) -> list[dict]:
    """跑一次发现流程，返回候选条目列表。"""
    q = _build_query(query, min_stars=min_stars, now=now)
    logger.info("searching GitHub: %s", q)
    repos = search_repositories(q, max_results)
    logger.info("search returned %d repos", len(repos))

    filtered = filter_candidates(repos, min_stars)
    logger.info("after filter (stars/fork/license): %d repos", len(filtered))

    candidates: list[dict] = []
    for repo in filtered:
        full_name = repo.get("full_name") or ""
        if not full_name:
            continue
        files = list_repo_contents(full_name)
        candidate_files = extract_candidate_files(files)
        if not candidate_files:
            continue
        entry = build_candidate_entry(repo, candidate_files)
        if entry is not None:
            candidates.append(entry)
    return candidates


def write_output(candidates: list[dict], output_path: Path) -> None:
    """把候选条目写到 JSON 文件。"""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "discovered_at": _iso_now(),
        "candidates": candidates,
    }
    output_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    logger.info("wrote %d candidates to %s", len(candidates), output_path)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Discover new free node sources via GitHub Search API.",
    )
    parser.add_argument(
        "--query",
        default=None,
        help="自定义搜索词（默认用内置关键词组合）",
    )
    parser.add_argument(
        "--min-stars",
        type=int,
        default=5,
        help="最低 star 数，默认 5",
    )
    parser.add_argument(
        "--max-results",
        type=int,
        default=30,
        help="最多拉多少个仓库，默认 30",
    )
    parser.add_argument(
        "--output",
        default="nodes/discovered-sources.json",
        help="输出路径，默认 nodes/discovered-sources.json",
    )
    args = parser.parse_args(argv)

    try:
        candidates = discover(
            query=args.query,
            min_stars=args.min_stars,
            max_results=args.max_results,
        )
    except RateLimitError as exc:
        print(
            f"GitHub API rate limit hit: {exc}\n"
            "Set GITHUB_TOKEN to lift the limit, then retry.",
            file=sys.stderr,
        )
        return EXIT_RATE_LIMIT
    except GitHubAPIError as exc:
        print(f"github api error: {exc}", file=sys.stderr)
        return EXIT_NETWORK_ERROR

    output_path = Path(args.output)
    if not output_path.is_absolute():
        # 相对路径默认相对项目根目录
        output_path = Path(__file__).parent.parent / output_path
    write_output(candidates, output_path)
    print(f"discovered {len(candidates)} candidate(s), written to {output_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
