from __future__ import annotations

import contextlib
import ipaddress
import json
import os
import socket
import ssl
import threading
import time
import urllib.request
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlparse

from cachetools.func import ttl_cache
from parser import node_to_clash_config

from utils import get_logger, is_private_host, protocol_of

try:
    import geoip2.database
    _GEOIP_READER = None  # 延迟初始化
    _HAS_GEOIP2 = True
except ImportError:
    _HAS_GEOIP2 = False

TIMEOUT = 5
MAX_WORKERS = 50
GEO_TIMEOUT = 5
# geo API 限速间隔：ipwho.is / ipapi.co 的免费层限速比 ip-api 宽松（约 1000+/min），
# 1.5s 全局串行会让 50 worker 全排队（1000 唯一 IP = 25 分钟纯等待）。
# 改为按域名分桶锁，各 API 端点独立限速；间隔降到 0.2s 足够服从限速。
GEO_MIN_INTERVAL = 0.2  # seconds per host
MAX_GEO_RESPONSE_SIZE = 65536  # 64 KiB

logger = get_logger("verifier")


def _to_valid_port(port_raw) -> int | None:
    """Convert a raw port value to an int in the valid 1-65535 range."""
    if port_raw is None:
        return None
    try:
        port = int(str(port_raw).strip())
    except (TypeError, ValueError):
        return None
    return port if 1 <= port <= 65535 else None


_geo_locks: dict[str, threading.Lock] = {}
_geo_last_request: dict[str, float] = {}
_geo_locks_guard = threading.Lock()  # 保护 _geo_locks 字典本身的读写


def _get_geo_lock(host: str) -> tuple[threading.Lock, float]:
    """获取（或创建）某 host 专属的限速锁 + 上次请求时间。

    按 host 分桶：ipwho.is 与 ipapi.co 各自独立限速，互不阻塞，
    避免 1.5s 全局锁串行化所有 50 worker。
    """
    with _geo_locks_guard:
        if host not in _geo_locks:
            _geo_locks[host] = threading.Lock()
            _geo_last_request[host] = 0.0
        return _geo_locks[host], _geo_last_request[host]


def _set_geo_last_request(host: str, ts: float) -> None:
    with _geo_locks_guard:
        if host in _geo_last_request:
            _geo_last_request[host] = ts


# 模块级共享 DNS 解析线程池：避免 resolve_ip 每次调用都新建/销毁 ThreadPoolExecutor
# （此前 1000 节点 × 2 family = 2000 次池创建销毁，是验证阶段的性能瓶颈）。
# max_workers=4 足够覆盖并发验证（外层 verify_nodes 已有 50 worker 限制并发）。
_DNS_EXECUTOR = ThreadPoolExecutor(max_workers=4, thread_name_prefix="dns-resolve")


def _get_geoip_reader():
    """从 FREENODE_GEOIP_DB_PATH 指定的 mmdb 文件加载 GeoIP2-Country 数据库。

    reader 实例缓存于模块级 ``_GEOIP_READER``；多次调用只打开一次。
    geoip2 不可用或未配置 db 路径时返回 None。
    """
    global _GEOIP_READER
    if not _HAS_GEOIP2:
        return None
    if _GEOIP_READER is not None:
        return _GEOIP_READER
    db_path = os.environ.get("FREENODE_GEOIP_DB_PATH", "").strip()
    if not db_path:
        return None
    try:
        _GEOIP_READER = geoip2.database.Reader(db_path)
        logger.info("geoip2 database loaded from %s", db_path)
        return _GEOIP_READER
    except Exception as exc:
        logger.warning("failed to load geoip2 database %s: %s", db_path, exc)
        return None


def can_reach_public_internet(timeout: int = 5) -> bool:
    """Check if the environment can make outbound TCP connections."""
    for host, port in [("1.1.1.1", 53), ("example.com", 443)]:
        try:
            with socket.create_connection((host, port), timeout=timeout):
                return True
        except Exception:
            continue
    return False


def tcp_check(host: str, port: int, timeout: int = TIMEOUT) -> tuple[bool, float, str | None]:
    """Measure TCP connect time and return (success, latency_ms, error_reason).

    The error_reason categorizes failures so callers can report *why* a node
    could not be reached:
      - ``timeout``: the connect attempt exceeded the timeout.
      - ``connection refused``: the host actively rejected the connection.
      - ``network error: <detail>``: any other socket-level failure.
      - ``error: <type>``: an unexpected non-socket exception.
    """
    start = time.perf_counter()
    try:
        with socket.create_connection((host, port), timeout=timeout):
            latency_ms = (time.perf_counter() - start) * 1000
            return True, latency_ms, None
    except TimeoutError:
        return False, float("inf"), "timeout"
    except ConnectionRefusedError:
        return False, float("inf"), "connection refused"
    except OSError as exc:
        detail = exc.strerror or str(exc) or "unknown"
        return False, float("inf"), f"network error: {detail}"
    except Exception as exc:
        return False, float("inf"), f"error: {type(exc).__name__}"


def parse_endpoint(link: str) -> tuple[str | None, int | None]:
    """从链接提取 (host, port)，统一走 parser 注册表分发。

    之前对 ss/vmess/vless/trojan 各写一个分支，新增协议要手改这里；
    现在统一用 node_to_clash_config 拿到归一化后的 server/port，
    新协议自动跟随 parser 注册表，无需修改 verifier。
    """
    try:
        cfg = node_to_clash_config(link)
        if not cfg:
            # parser 不认识的协议，fallback 到 urlparse
            parsed = urlparse(link)
            return parsed.hostname, parsed.port
        return cfg.get("server"), _to_valid_port(cfg.get("port"))
    except Exception:
        return None, None


def resolve_ip(host: str, timeout: int = 3) -> str | None:
    """Resolve a hostname to an IP address; return IPs unchanged.

    Uses a module-level shared ThreadPoolExecutor to avoid per-call pool
    creation overhead (previously 1000 nodes × 2 families = 2000 pool
    create/destroy cycles). Future.result(timeout) still provides per-call
    timeout without mutating the global socket.setdefaulttimeout.
    """
    try:
        ipaddress.ip_address(host)
        return host
    except ValueError:
        pass

    def _resolve(family: int) -> str | None:
        infos = socket.getaddrinfo(host, None, family, socket.SOCK_STREAM)
        return infos[0][4][0] if infos else None

    for family in (socket.AF_INET, socket.AF_INET6):
        try:
            future = _DNS_EXECUTOR.submit(_resolve, family)
            result = future.result(timeout=timeout)
            if result:
                return result
        except Exception:
            continue
    return None


def _geo_request(url: str) -> dict:
    """Fetch a geo-API URL while enforcing a per-host minimum request interval.

    按域名分桶限速：ipwho.is 与 ipapi.co 各自独立，互不阻塞。
    """
    host = urlparse(url).hostname or "default"
    lock, last = _get_geo_lock(host)
    with lock:
        now = time.monotonic()
        next_time = max(now, last + GEO_MIN_INTERVAL)
        _set_geo_last_request(host, next_time)
    wait = next_time - now
    if wait > 0:
        time.sleep(wait)

    req = urllib.request.Request(
        url,
        headers={"User-Agent": "FreeNode-Verifier/1.0"},
    )
    with urllib.request.urlopen(req, timeout=GEO_TIMEOUT) as resp:
        raw = resp.read(MAX_GEO_RESPONSE_SIZE)
        return json.loads(raw.decode("utf-8", errors="ignore"))


def _format_geo(data: dict) -> str:
    """Extract a human-readable region string from geo API response."""
    if not data:
        return "unknown"
    country = data.get("country") or data.get("country_name") or ""
    region = data.get("regionName") or data.get("region") or ""
    if country and region and region != country:
        return f"{country}/{region}"
    return country or "unknown"


def _fetch_geo_data(ip: str) -> dict:
    """Try free IP geo APIs in order; return {} on failure.

    Uses HTTPS-capable endpoints (ip-api.com's free tier is HTTP-only, so it
    is replaced with ipwho.is which supports HTTPS at no cost).
    """
    try:
        data = _geo_request(f"https://ipwho.is/{ip}")
        if data.get("success") or data.get("country"):
            return data
    except Exception:
        pass

    try:
        data = _geo_request(f"https://ipapi.co/{ip}/json/")
        if data.get("country") or data.get("country_name"):
            return data
    except Exception:
        pass

    return {}


@ttl_cache(maxsize=4096, ttl=86400)
def query_geo_api(ip: str) -> str:
    """Return region for an IP, cached 24h; falls back to 'unknown'.

    优先用 geoip2 本地数据库查询（0 网络请求），只有 geoip2 不可用时
    才降级到 ipwho.is/ipapi.co API 方案。

    ttl_cache 自带线程安全 + 自动过期，替代原先手写无界 dict 缓存。
    """
    if not ip or is_private_host(ip):
        return "private"

    # 优先本地数据库查询
    reader = _get_geoip_reader()
    if reader is not None:
        try:
            resp = reader.country(ip)
            country = resp.country.iso_code or resp.country.name or ""
            if country:
                return country
            return "unknown"
        except Exception as exc:
            logger.debug("geoip2 lookup failed for %s: %s; falling back to API", ip, exc)
            # 降级到 API 方案

    return _format_geo(_fetch_geo_data(ip))


def _failed_result(link: str, region: str, error: str) -> dict:
    """Build a standard failure result dict for verify_node."""
    return {
        "link": link,
        "alive": False,
        "latency": None,
        "latency_ms": None,
        "region": region,
        "error": error,
    }


def verify_node(link: str, timeout: int = TIMEOUT, geo_enabled: bool = True) -> dict:
    host, port = parse_endpoint(link)
    if not host or not port:
        return _failed_result(link, "unknown", "parse failed")

    # SSRF defence: never connect to private/loopback/link-local hosts.
    if is_private_host(host):
        return _failed_result(link, "private", "private host blocked")

    # DNS rebinding defence: 先解析 IP 并校验，避免对内网地址发起 TCP 连接。
    # 注意 tcp_check 内部仍会再次解析，存在理论 TOCTOU，但已能挡住 DNS 静态指向内网的攻击。
    ip = resolve_ip(host)
    if ip and is_private_host(ip):
        return _failed_result(link, "private", "resolved to private IP")

    alive, latency_ms, error = tcp_check(host, port, timeout)
    latency_ms = int(round(latency_ms)) if alive else None

    region = (query_geo_api(ip) if (geo_enabled and ip) else "unknown") if alive else "unknown"

    return {
        "link": link,
        "alive": alive,
        "latency": round(latency_ms / 1000, 3) if latency_ms is not None else None,
        "latency_ms": latency_ms,
        "region": region,
        "error": error,
    }


_VERIFY_METHODS = {"ss": "ss_probe", "trojan": "tls_handshake"}


def _verify_method_for_scheme(scheme: str | None) -> str:
    """根据协议返回对应的 verify_method 标签，用于失败时也带上方法名。"""
    return _VERIFY_METHODS.get(scheme, "tcp_only")


def _safe_close(sock: socket.socket | None) -> None:
    """静默关闭 socket，忽略已关闭的异常。"""
    if sock:
        with contextlib.suppress(OSError):
            sock.close()


def _ss_probe(sock: socket.socket, latency_ms: int, timeout: float) -> dict:
    """SS 协议探测：发 \\x00 字节，RST = 密码错误，超时 = 存活。"""
    sock.settimeout(timeout)
    try:
        sock.send(b"\x00")
    except (ConnectionResetError, OSError) as exc:
        return {"alive": False, "latency_ms": None, "error": f"ss probe failed: {exc}"}

    try:
        sock.recv(1)
        return {"alive": True, "latency_ms": latency_ms}
    except ConnectionResetError:
        return {"alive": False, "latency_ms": None, "error": "ss probe reset (likely bad auth)"}
    except TimeoutError:
        return {"alive": True, "latency_ms": latency_ms}
    except OSError as exc:
        return {"alive": False, "latency_ms": None, "error": f"ss probe error: {exc}"}


def _tls_handshake(sock: socket.socket, host: str, latency_ms: int, timeout: float) -> dict:
    """TLS 握手探测（trojan）：仅验证 TLS 握手可达性，不校验证书。

    免费公开节点大量使用自签证书，严格校验（CERT_REQUIRED）会让绝大多数节点验证失败。
    因此只做握手探测（CERT_NONE），字段命名为 ``tls_handshake_ok`` 而非 ``tls_verified``，
    避免误导下游消费者以为证书已通过验证。
    """
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE  # 不校验证书：免费节点多自签，仅探测握手可达性
    try:
        with ctx.wrap_socket(sock, server_hostname=host):
            pass
        return {"alive": True, "latency_ms": latency_ms, "tls_handshake_ok": True}
    except ssl.SSLError as exc:
        return {"alive": False, "latency_ms": None, "error": f"tls handshake failed: {exc}"}
    except OSError as exc:
        detail = exc.strerror or str(exc) or "unknown"
        return {"alive": False, "latency_ms": None, "error": f"tls error: {detail}"}


def verify_node_protocol(link: str, timeout: float = 5.0) -> dict:
    """二段协议级握手验证：先 TCP connect，再按协议做轻量握手。

    各协议策略：
      - vmess/vless：协议握手太复杂，只到 TCP 层。
      - ss：TCP 连上后发一个字节探测，RST = 密码/加密不对。
      - trojan：跑 TLS 握手，成功说明证书和端口都对。
      - hysteria/hysteria2/tuic：UDP/QUIC 系，TCP 探测无意义，标 tcp_only。

    tcp_check 测延迟后关闭 socket；ss/trojan 协议重新开连接做协议探测。
    """
    host, port = parse_endpoint(link)
    scheme = protocol_of(link)
    if not host or not port or not scheme:
        return {"alive": False, "latency_ms": None, "error": "parse failed", "verify_method": "unknown"}
    if is_private_host(host):
        return {"alive": False, "latency_ms": None, "error": "private host blocked", "verify_method": "unknown"}

    # DNS rebinding 防御：协议级验证路径必须同样校验解析后的 IP，
    # 否则攻击者可在 verify_node 通过后切换 DNS 到内网地址，让协议探测连到内网。
    ip = resolve_ip(host)
    if ip and is_private_host(ip):
        return {"alive": False, "latency_ms": None, "error": "resolved to private IP", "verify_method": "unknown"}

    verify_method = _verify_method_for_scheme(scheme)

    # TCP 延迟检测（复用 tcp_check，避免重复写 socket 逻辑）
    alive, latency_ms, error = tcp_check(host, port, int(timeout))
    if not alive:
        return {"alive": False, "latency_ms": None, "error": error, "verify_method": verify_method}
    latency_ms = int(round(latency_ms))

    # TCP-only 协议：vmess/vless 握手太复杂；UDP 系 TCP 无意义
    if scheme in ("vmess", "vless", "hysteria", "hysteria2", "tuic"):
        return {"alive": True, "latency_ms": latency_ms, "verify_method": "tcp_only"}

    # ss/trojan 需开新连接做协议探测（tcp_check 的 socket 已关闭）
    probe_sock = None
    try:
        probe_sock = socket.create_connection((host, port), timeout=timeout)
    except Exception as exc:
        return {"alive": False, "latency_ms": None, "error": f"probe connect failed: {exc}", "verify_method": verify_method}

    try:
        if scheme == "ss":
            result = _ss_probe(probe_sock, latency_ms, timeout)
        elif scheme == "trojan":
            result = _tls_handshake(probe_sock, host, latency_ms, timeout)
        else:
            return {"alive": True, "latency_ms": latency_ms, "verify_method": "tcp_only"}

        result.setdefault("verify_method", verify_method)
        return result
    finally:
        _safe_close(probe_sock)


# 哪些错误值得重试（网络抖动类）；connection refused / private host 这类确定性失败不重试
_RETRYABLE_ERRORS = ("timeout", "timed out", "network unreachable", "temporary failure")

# 抖动重试次数：首次失败且错误属于抖动类时，再试这么多次
RETRY_ON_FLAKY = int(os.environ.get("FREENODE_VERIFY_RETRIES", "2"))


def _is_flaky_error(error: str | None) -> bool:
    """判断是否属于网络抖动类错误（值得重试）。"""
    if not error:
        return False
    err_lower = error.lower()
    return any(kw in err_lower for kw in _RETRYABLE_ERRORS)


def verify_nodes(
    links: list[str],
    max_workers: int = MAX_WORKERS,
    geo_enabled: bool = True,
    timeout: int = TIMEOUT,
    verify_level: str = "tcp",
) -> list[dict]:
    # 环境变量 FREENODE_VERIFY_LEVEL 可覆盖默认 verify_level
    env_level = os.environ.get("FREENODE_VERIFY_LEVEL", "").strip().lower()
    if env_level in ("tcp", "protocol"):
        verify_level = env_level

    results = []
    # 第一轮：所有节点各验证一次
    pending_retries: list[str] = []  # 第一轮抖动失败的，需要重试
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_link = {
            executor.submit(verify_node, link, timeout, geo_enabled): link for link in links
        }
        for future in as_completed(future_to_link):
            link = future_to_link[future]
            try:
                result = future.result()
                # 抖动重试：TCP 失败但错误属于抖动类（timeout/network unreachable），重试以减少假阴性
                if not result.get("alive") and _is_flaky_error(result.get("error")) and RETRY_ON_FLAKY > 0:
                    pending_retries.append(link)
                    continue  # 稍后重试，先不记入结果
                result = _apply_protocol_verify(result, verify_level, timeout)
                results.append(result)
            except Exception as exc:
                logger.warning("verification failed for %s: %s", link, exc)
                results.append(
                    {
                        "link": link,
                        "alive": False,
                        "latency": None,
                        "latency_ms": None,
                        "region": "unknown",
                        "error": f"error: {type(exc).__name__}",
                        "verify_method": "tcp_only",
                    }
                )

    # 第二轮：对抖动失败的节点重试，最多 RETRY_ON_FLAKY 次（仍抖动才判死）
    if pending_retries:
        logger.info("retrying %d flaky nodes (up to %d times)", len(pending_retries), RETRY_ON_FLAKY)
        for attempt in range(RETRY_ON_FLAKY):
            if not pending_retries:
                break
            current_batch = pending_retries
            pending_retries = []
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                future_to_link = {
                    executor.submit(verify_node, link, timeout, geo_enabled): link
                    for link in current_batch
                }
                for future in as_completed(future_to_link):
                    link = future_to_link[future]
                    try:
                        result = future.result()
                        if result.get("alive"):
                            result = _apply_protocol_verify(result, verify_level, timeout)
                            result["retried"] = True
                            result["retry_attempts"] = attempt + 1
                            results.append(result)
                        elif _is_flaky_error(result.get("error")) and attempt < RETRY_ON_FLAKY - 1:
                            pending_retries.append(link)
                        else:
                            # 仍失败但非抖动错误，或重试次数用尽，最终判死
                            result = _apply_protocol_verify(result, verify_level, timeout)
                            result["retried"] = True
                            result["retry_attempts"] = attempt + 1
                            results.append(result)
                    except Exception as exc:
                        logger.warning("retry failed for %s: %s", link, exc)
                        results.append({
                            "link": link,
                            "alive": False,
                            "latency": None,
                            "latency_ms": None,
                            "region": "unknown",
                            "error": f"error: {type(exc).__name__}",
                            "verify_method": "tcp_only",
                            "retried": True,
                            "retry_attempts": attempt + 1,
                        })

    return results


def _apply_protocol_verify(result: dict, verify_level: str, timeout: int) -> dict:
    """二段协议验证：TCP 成功的节点再跑协议握手（仅 verify_level=protocol 时启用）。"""
    if verify_level == "protocol" and result.get("alive"):
        proto_result = verify_node_protocol(result["link"], timeout=float(timeout))
        result["verify_method"] = proto_result.get("verify_method")
        if not proto_result.get("alive"):
            result["alive"] = False
            result["latency_ms"] = None
            result["latency"] = None
            result["error"] = proto_result.get("error") or "protocol verify failed"
        else:
            # 协议验证成功的，更新延迟（含握手时间，更准）
            if proto_result.get("latency_ms") is not None:
                result["latency_ms"] = proto_result["latency_ms"]
                result["latency"] = round(proto_result["latency_ms"] / 1000, 3)
            if proto_result.get("tls_handshake_ok"):
                result["tls_handshake_ok"] = True
    else:
        result["verify_method"] = "tcp_only"
    return result


def stats_summary(results: list[dict], verify_level: str = "tcp") -> dict:
    """Compute survival rate, average latency and region distribution.

    Also aggregates ``failed`` count and ``failure_reasons`` so callers can
    report how many nodes failed and *why* (timeout / connection refused /
    network error / parse failed / other). ``verify_level`` 透传到结果里，
    方便日志和报告标注当前用的是 tcp 还是 protocol 验证。
    """
    total = len(results)
    alive = [r for r in results if r.get("alive")]
    alive_count = len(alive)
    failed_count = total - alive_count
    latencies = [r["latency_ms"] for r in alive if r.get("latency_ms") is not None]
    avg_latency = round(sum(latencies) / len(latencies), 1) if latencies else None

    regions = Counter(r.get("region") or "unknown" for r in alive)

    failure_reasons = Counter(
        r.get("error") or "unknown" for r in results if not r.get("alive")
    )

    survival_rate = round(alive_count / total * 100, 1) if total else 0.0
    return {
        "total": total,
        "alive": alive_count,
        "failed": failed_count,
        "survival_rate": survival_rate,
        "avg_latency": avg_latency,
        "regions": dict(regions),
        "failure_reasons": dict(failure_reasons),
        "verify_level": verify_level,
    }


if __name__ == "__main__":
    sample = [
        "ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ=@example.com:443",
        "trojan://pass@example.com:443",
        "vmess://eyJhZGQiOiJleGFtcGxlLmNvbSIsInBvcnQiOiI0NDMiLCJpZCI6Inh4eHh4eHgteHh4eC14eHh4LXh4eHgteHh4eHh4eHh4eHgifQ==",
    ]
    for r in verify_nodes(sample, geo_enabled=True):
        print(r)
