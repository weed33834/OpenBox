"""跨源指纹去重：在 verify 之前按 (protocol, server, port, auth_secret) 去重。

很多社区源互相镜像，同一个节点会以不同的 remark / 编码 / 顺序出现。
按链接字符串去重会漏掉这些；按内容指纹去重能把候选集砍掉一大块，
省下验证时间和带宽。
"""

from __future__ import annotations

import hashlib

from parser import node_to_clash_config

from utils import get_logger, protocol_of

logger = get_logger("dedup")


def compute_fingerprint(protocol: str, server: str, port: int, auth_secret: str) -> str:
    """和 backend Node.compute_fingerprint 一致的内容指纹。"""
    raw = f"{protocol.lower()}|{server.lower()}|{port}|{auth_secret}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _extract_identity(link: str) -> tuple[str, str, int, str] | None:
    """从链接提取 (protocol, server, port, auth_secret)，提不出返回 None。"""
    cfg = node_to_clash_config(link)
    if not cfg or not cfg.get("server") or not cfg.get("port"):
        return None
    protocol = protocol_of(link)
    if protocol is None:
        return None
    try:
        port = int(cfg["port"])
    except (TypeError, ValueError):
        return None
    if protocol in ("vmess", "vless"):
        auth = cfg.get("uuid", "")
    elif protocol in ("ss", "trojan"):
        auth = cfg.get("password", "")
    elif protocol in ("hysteria", "hysteria2"):
        # hysteria/hysteria2 用 password 认证，不含密码会把同 server+port 的
        # 不同密码节点误判为重复并丢弃。
        auth = cfg.get("password", "")
    elif protocol == "tuic":
        # tuic 用 uuid:password 双字段认证
        auth = f"{cfg.get('uuid', '')}:{cfg.get('password', '')}"
    else:
        auth = ""
    return protocol, str(cfg["server"]), port, str(auth)


def dedup_by_fingerprint(links: list[str]) -> list[str]:
    """按内容指纹去重，保留每个指纹第一次出现的链接。

    无法解析出指纹的链接原样保留（不去重），避免误删没法解析的协议。
    """
    seen_fp: set[str] = set()
    result: list[str] = []
    dropped = 0
    for link in links:
        identity = _extract_identity(link)
        if identity is None:
            # 解析不了就保留，交给后面的 verifier / formatter 处理
            result.append(link)
            continue
        fp = compute_fingerprint(*identity)
        if fp in seen_fp:
            dropped += 1
            continue
        seen_fp.add(fp)
        result.append(link)
    if dropped:
        logger.info("dedup: dropped %d duplicate links (by fingerprint)", dropped)
    return result
