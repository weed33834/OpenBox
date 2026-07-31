"""Concurrent crawler for free node/proxy sources.

抓取策略升级：
- 智能重试 + 指数退避（5xx / 网络错误重试，4xx / 过大 / 超时不重试）
- URL → 响应文本 24h TTL 缓存（同一进程内重复抓取直接命中）
- 并发分级调度：按源 reliability 分 tier，高可靠性源多给 worker，差源慢抓
"""

from __future__ import annotations

import json
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import httpx
from adapters import get_adapter
from cachetools import TTLCache

from utils import (
    NODES_DIR,
    USER_AGENT,
    FetchError,
    decode_bytes,
    get_logger,
    load_sources,
    safe_b64decode,
    validate_url,
)

logger = get_logger("crawler")

# 24h TTL 缓存：同进程内重复抓同一 URL 直接命中，避免 workflow 重试时浪费带宽。
# maxsize=256 足够覆盖所有源；超过时按 LRU 淘汰最旧的。
_RESPONSE_CACHE: TTLCache = TTLCache(maxsize=256, ttl=24 * 3600)

# 同进程内 reliability scores 只读一次磁盘，避免重复 IO
_SCORES_CACHE: TTLCache = TTLCache(maxsize=2, ttl=3600)


def _reliability_floor() -> float:
    """读环境变量 FREENODE_RELIABILITY_FLOOR，返回最低可接受的 reliability 百分比。"""
    raw = os.environ.get("FREENODE_RELIABILITY_FLOOR", "0")
    try:
        return max(0.0, float(raw))
    except (TypeError, ValueError):
        return 0.0


def _load_reliability_scores() -> dict[str, float]:
    """读 nodes/sources-report.json 的 reliability_score，读不到返回空 dict。

    用 1h TTL 缓存避免同进程内重复读盘（_collect_sources 与分级调度都会查）。
    """
    cached = _SCORES_CACHE.get("scores")
    if cached is not None:
        return cached

    report_path = NODES_DIR / "sources-report.json"
    if not report_path.exists():
        return {}

    try:
        data = json.loads(report_path.read_text(encoding="utf-8"))
        scores = {name: float(score) for name, score in data.get("reliability_score", {}).items()}
    except (OSError, ValueError, TypeError):
        return {}

    _SCORES_CACHE["scores"] = scores
    return scores


def _fetch_with_httpx(url: str, timeout: int, max_bytes: int) -> str:
    """用 httpx 流式抓取，强制 max_bytes 上限。

    SSRF 防御：关闭自动重定向，手动逐跳校验每个 Location 目标。
    httpx 默认 follow_redirects=True 会跟随到任意 host（包括
    http://169.254.169.254 云元数据端点），重定向目标不再经过 validate_url。
    手动处理可对每跳重新校验 scheme + 私网 IP，并设上限防重定向环。
    """
    try:
        with httpx.Client(
            timeout=timeout,
            follow_redirects=False,  # SSRF: 手动逐跳校验，见 _follow_redirects
            headers={"User-Agent": USER_AGENT},
        ) as client:
            resp = _follow_redirects(client, url, timeout)
            resp.raise_for_status()
            # 流式读取并在超限时立即中断，避免大响应撑爆内存
            with client.stream("GET", resp.url, follow_redirects=False) as final:
                final.raise_for_status()
                chunks: list[bytes] = []
                size = 0
                for chunk in final.iter_bytes():
                    size += len(chunk)
                    if size > max_bytes:
                        raise FetchError(f"response too large (>{max_bytes} bytes): {url}")
                    chunks.append(chunk)
                return decode_bytes(b"".join(chunks))
    except httpx.TimeoutException as exc:
        raise FetchError(f"timed out: {exc}") from exc
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        # 429 Too Many Requests: 透传 Retry-After 让上层按它退避
        if status == 429:
            retry_after = exc.response.headers.get("Retry-After")
            raise FetchError(f"http 429: {url}|retry_after={retry_after or ''}") from exc
        raise FetchError(f"http {status}: {url}") from exc
    except httpx.HTTPError as exc:
        raise FetchError(f"fetch failed: {exc}") from exc


# 重定向上限：防重定向环 DoS
_MAX_REDIRECTS = 5


def _follow_redirects(client: httpx.Client, url: str, timeout: int) -> httpx.Response:
    """手动跟随重定向，对每个 Location 重新走 validate_url 防 SSRF。

    httpx follow_redirects=True 不会校验重定向目标，攻击者可用白名单内源的
    302 跳转引导请求到内网（如 169.254.169.254 云元数据端点）。
    手动逐跳校验确保每个目标都经过 scheme/私网 IP 检查。
    """
    current_url = url
    for _ in range(_MAX_REDIRECTS):
        resp = client.get(current_url, follow_redirects=False, timeout=timeout)
        if resp.status_code not in (301, 302, 303, 307, 308):
            return resp
        location = resp.headers.get("Location")
        if not location:
            return resp
        # 解析重定向目标为绝对 URL（httpx 不会自动解析，需传 base_url）
        target = str(httpx.URL(location, base=current_url))
        validate_url(target)  # SSRF: 每跳重新校验
        current_url = target
    raise FetchError(f"too many redirects (>{_MAX_REDIRECTS}): {url}")


def fetch(
    url: str,
    timeout: int = 20,
    retries: int = 3,
    max_bytes: int = 10 * 1024 * 1024,
) -> str:
    """Fetch URL with exponential backoff retry.

    重试策略（P2-A 智能重试）：
    - 5xx / 网络错误 / 连接重置 → 指数退避重试（base=1s, 2^attempt）
    - 429 Too Many Requests → 按 Retry-After 头退避，无头则指数退避
    - 4xx 其他客户端错误 → 不重试，请求本身有问题
    - 超时 / 响应过大 → 不重试，确定性失败
    - 24h TTL 缓存命中 → 直接返回，不发请求（P2-B 增量抓取）
    """
    validate_url(url)

    cached = _RESPONSE_CACHE.get(url)
    if cached is not None:
        logger.debug("cache hit: %s", url)
        return cached

    last_exc: FetchError | None = None
    for attempt in range(retries + 1):
        try:
            text = _fetch_with_httpx(url, timeout, max_bytes)
            _RESPONSE_CACHE[url] = text
            return text
        except FetchError as exc:
            last_exc = exc
            err = str(exc).lower()
            # 确定性失败：不重试
            if "timed out" in err or "too large" in err:
                raise
            # 429 限流：按 Retry-After 退避后重试（特殊处理）
            if "http 429" in err:
                if attempt >= retries:
                    raise
                # 解析 Retry-After（可能是秒数或 HTTP 日期，这里只处理秒数）
                retry_after_str = ""
                if "retry_after=" in err:
                    retry_after_str = err.split("retry_after=")[1].split("|")[0].strip()
                backoff: float
                if retry_after_str.isdigit():
                    backoff = min(int(retry_after_str), 60)  # 上限 60s 避免阻塞太久
                else:
                    backoff = 2 ** attempt  # 无 Retry-After 头则指数退避
                logger.warning(
                    "rate limited (429), retry %d/%d for %s in %gs",
                    attempt + 1, retries, url, backoff,
                )
                time.sleep(backoff)
                continue
            # 其他 4xx 客户端错误：重试无意义
            if "http 4" in err:
                raise
            # 最后一次尝试失败直接抛
            if attempt >= retries:
                raise
            # 指数退避：1s, 2s, 4s, ...
            backoff = 2 ** attempt
            logger.warning(
                "retry %d/%d for %s in %ds: %s",
                attempt + 1, retries, url, backoff, exc,
            )
            time.sleep(backoff)

    # 理论上不会到这；防御性兜底
    if last_exc:
        raise last_exc
    raise FetchError(f"unexpected fetch failure: {url}")


def maybe_decode_base64(text: str) -> str:
    """If the whole text looks like base64, try decoding it once."""
    text = text.strip()
    if not text or "://" in text or "\n" in text:
        return text
    decoded = safe_b64decode(text)
    if decoded is None:
        return text
    return decoded.decode("utf-8", errors="ignore")


def fetch_source(source: dict) -> str:
    text = fetch(
        source["url"],
        timeout=source.get("timeout", 20),
        max_bytes=source.get("max_size", 10 * 1024 * 1024),
    )
    if source.get("decode_base64", False):
        text = maybe_decode_base64(text)
    return text


def _fetch_source_safe(source: dict, category: str) -> dict | None:
    """Fetch a single source and return its raw entry, or None on failure.

    优先按 ``source["type"]`` 走对应 adapter；没注册 adapter 时退回旧的
    ``fetch_source`` 逻辑，保证向后兼容。
    """
    name = source.get("name", "unknown")
    try:
        start = time.perf_counter()
        adapter = get_adapter(source.get("type", ""))
        # 兜底：没注册 adapter 时走旧的 fetch_source
        text = adapter.fetch(source) if adapter is not None else fetch_source(source)
        elapsed = time.perf_counter() - start
        logger.info("fetched %s in %.2fs", name, elapsed)
        entry = {"name": name, "text": text, "category": category}
        # 透传 sources.json 里的元信息（供后端同步到 proxy_sources 表展示用）
        if "update_interval" in source:
            entry["update_interval"] = source["update_interval"]
        if "protocols" in source:
            entry["protocols"] = source["protocols"]
        if "proxy_scheme" in source:
            entry["proxy_scheme"] = source["proxy_scheme"]
        return entry
    except Exception as exc:
        logger.warning("failed %s: %s", name, exc)
        return None


def _collect_sources(config, key, category, floor, scores, skipped, sources):
    for source in config.get(key, []):
        if not source.get("enabled"):
            continue
        name = source.get("name", "unknown")
        if floor > 0 and not source.get("force_enabled", False):
            score = scores.get(name)
            if score is not None and score < floor:
                skipped.append((name, score))
                continue
        sources.append((source, category))


def _tier_of(score: float | None) -> int:
    """按 reliability 分配并发 tier：
    - tier 1 (>=80%): 高并发，给最多 worker
    - tier 2 (50%-80%): 中并发
    - tier 3 (<50% 或无记录): 低并发，避免被差源拖垮整体

    返回值用于查 _TIER_WORKERS 表。
    """
    if score is None:
        return 3
    if score >= 80:
        return 1
    if score >= 50:
        return 2
    return 3


# 各 tier 对应的并发上限：tier1 多给、tier3 限流
_TIER_WORKERS = {1: 12, 2: 6, 3: 2}


def crawl(config_path: Path | None = None, max_workers: int | None = None) -> dict:
    """Fetch all enabled sources concurrently with tiered scheduling (P2-C).

    按 reliability 分 tier 调度：高可靠性源多给 worker，差源慢抓，避免被差源拖垮整体。
    reliability 低于 FREENODE_RELIABILITY_FLOOR 的源会被自动跳过，
    除非在 sources.json 里标了 ``"force_enabled": true``。

    max_workers 仅作为 tier1 的全局上限覆盖；其它 tier 用固定值。
    """
    config = load_sources(config_path)

    floor = _reliability_floor()
    # scores 始终加载：用于 tier 分级（高可靠性源多给 worker）。
    # floor 仅控制是否过滤低可靠性源，不影响 tier 分级。
    scores = _load_reliability_scores()

    sources: list[tuple[dict, str]] = []
    skipped_by_reliability: list[tuple[str, float]] = []
    _collect_sources(config, "free_node_sources", "nodes", floor, scores, skipped_by_reliability, sources)
    _collect_sources(config, "free_proxy_apis", "proxies", floor, scores, skipped_by_reliability, sources)

    if skipped_by_reliability:
        for name, score in skipped_by_reliability:
            logger.info("skipped low-reliability source %s (%.1f%%)", name, score)

    raw: dict[str, list[dict]] = {"nodes": [], "proxies": []}

    # 分 tier 分组：每个 tier 一个独立的 executor，按 tier 顺序跑
    tier_buckets: dict[int, list[tuple[dict, str]]] = {1: [], 2: [], 3: []}
    for source, category in sources:
        name = source.get("name", "unknown")
        score = scores.get(name)
        tier = _tier_of(score)
        tier_buckets[tier].append((source, category))

    # 环境变量优先覆盖 tier1 worker 数（用本地拷贝避免污染模块级 _TIER_WORKERS，
    # 否则多次调用 crawl() 会累积修改全局状态）
    tier_workers = dict(_TIER_WORKERS)
    env_workers = os.environ.get("FREENODE_CRAWL_WORKERS", "")
    if env_workers.isdigit():
        tier_workers[1] = max(1, int(env_workers))
    elif max_workers is not None:
        tier_workers[1] = max(1, max_workers)

    for tier in (1, 2, 3):
        bucket = tier_buckets[tier]
        if not bucket:
            continue
        workers = min(tier_workers[tier], len(bucket))
        logger.info(
            "tier %d: %d sources, %d workers",
            tier, len(bucket), workers,
        )
        with ThreadPoolExecutor(max_workers=workers) as executor:
            future_to_source = {
                executor.submit(_fetch_source_safe, source, category): source
                for source, category in bucket
            }
            for future in as_completed(future_to_source):
                result = future.result()
                if result:
                    category = result.pop("category")
                    raw[category].append(result)

    return raw


if __name__ == "__main__":
    result = crawl()
    logger.info(
        "fetched %d node sources, %d proxy sources",
        len(result["nodes"]),
        len(result["proxies"]),
    )
