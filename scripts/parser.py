"""Node/proxy link parser — unified protocol parsing framework.

Supports 7 protocols: ss, vmess, vless, trojan, hysteria, hysteria2 (hy2), tuic.
All protocol-specific logic is encapsulated in ProtocolParser subclasses;
node_to_clash_config dispatches by scheme with no branching duplication.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from typing import Any, ClassVar
from urllib.parse import parse_qs, unquote

from utils import get_logger, safe_b64decode

logger = get_logger("parser")

# ── Constants ────────────────────────────────────────────────────────────────

MAX_VMESS_LINK_LEN = 512 * 1024

OUTPUT_SCHEMES = frozenset({
    "ss", "vmess", "vless", "trojan",
    "hysteria", "hysteria2", "hy2",  # hy2 是 hysteria2 的别名，提取阶段必须识别
    "tuic",
})
SKIPPED_SCHEMES = frozenset({"ssr"})

LINK_PATTERNS = [
    re.compile(rf'(?<!\S){s}://[^\s<>\"\)]+', re.IGNORECASE)
    for s in OUTPUT_SCHEMES | SKIPPED_SCHEMES
]


# ── Link extraction ──────────────────────────────────────────────────────────

def extract_node_links(text: str | None) -> list[str]:
    """Extract unique proxy links from text, filtering unsupported schemes."""
    if not text:
        return []
    links: set[str] = set()
    skipped: dict[str, int] = {}
    for pattern in LINK_PATTERNS:
        for match in pattern.findall(text):
            link = match.strip()
            scheme = link.split("://", 1)[0].lower()
            if scheme in OUTPUT_SCHEMES:
                links.add(link)
            elif scheme in SKIPPED_SCHEMES:
                skipped[scheme] = skipped.get(scheme, 0) + 1
    if skipped:
        total = sum(skipped.values())
        detail = ", ".join(f"{s}: {c}" for s, c in sorted(skipped.items()))
        logger.info("skipped %d unsupported protocol link(s): %s", total, detail)
    return list(links)


# ── URL splitting helper ─────────────────────────────────────────────────────

def _split_link(link: str, scheme: str, default_port: int = 443) -> tuple[str, str, int, str, str] | None:
    """Split scheme://[userinfo@]host[:port][?query][#fragment] into 5-tuple.

    Returns (userinfo, host, port, query, fragment) or None on parse failure.
    Handles IPv6 bracket notation.
    """
    prefix = f"{scheme}://"
    if not link.startswith(prefix):
        return None
    body = link[len(prefix):]

    fragment = ""
    if "#" in body:
        body, fragment = body.split("#", 1)

    query = ""
    if "?" in body:
        body, query = body.split("?", 1)

    userinfo = ""
    if "@" in body:
        userinfo, body = body.rsplit("@", 1)

    host, port = body, default_port
    if host.startswith("["):
        end = host.find("]")
        if end == -1:
            return None
        rest = host[end + 1:]
        host = host[1:end]
        if rest.startswith(":"):
            try:
                port = int(rest[1:])
            except ValueError:
                return None
    elif ":" in host:
        host, port_str = host.rsplit(":", 1)
        try:
            port = int(port_str)
        except ValueError:
            return None

    if not host:
        return None
    return userinfo, host, port, query, fragment


def _split_server_port(server_port: str) -> tuple[str, int] | None:
    """Split 'server:port' supporting IPv6 [addr]:port notation."""
    if server_port.startswith("["):
        end = server_port.find("]")
        if end == -1:
            return None
        server = server_port[1:end]
        tail = server_port[end + 1:]
        if not tail.startswith(":"):
            return None
        port_str = tail[1:].split("?", 1)[0]
    else:
        if ":" not in server_port:
            return None
        server, port_str = server_port.rsplit(":", 1)
        port_str = port_str.split("?", 1)[0]
    try:
        return server, int(port_str)
    except ValueError:
        return None


def _parse_query(query: str) -> dict[str, str]:
    """Parse URL query string into flat {key: value} dict (first value wins)."""
    return {k: v[0] for k, v in parse_qs(query).items()} if query else {}


# ── Unified protocol parser base ─────────────────────────────────────────────


@dataclass
class ParsedNode:
    """Normalized intermediate representation of a parsed node.

    All protocol parsers emit this struct; downstream consumers (formatter,
    verifier, dedup) operate on ParsedNode without knowing the protocol."""

    protocol: str
    server: str
    port: int
    name: str
    # Protocol-specific fields stored as dict; keys vary by protocol
    fields: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {"type": self.protocol, "server": self.server, "port": self.port,
                "name": self.name, **self.fields}


class ProtocolParser:
    """Base class for protocol-specific link parsers.

    Subclasses override `scheme`, `parse_link`, and optionally `to_clash`.
    All internal representations flow through ParsedNode."""
    scheme: ClassVar[str] = ""

    @classmethod
    def parse(cls, link: str) -> ParsedNode | None:
        """Parse a link into ParsedNode. Returns None if the link is invalid."""
        raise NotImplementedError

    @classmethod
    def to_clash(cls, node: ParsedNode) -> dict[str, Any]:
        """Convert ParsedNode to Clash-compatible config dict."""
        return node.to_dict()


# ── SS ───────────────────────────────────────────────────────────────────────

class SSParser(ProtocolParser):
    scheme: ClassVar[str] = "ss"

    @classmethod
    def parse(cls, link: str) -> ParsedNode | None:
        if not link.startswith("ss://"):
            return None
        body = link[len("ss://"):]

        # Standard format: ss://BASE64(method:password)@server:port#name
        if "@" in body:
            auth_part, rest = body.split("@", 1)
            decoded_auth = safe_b64decode(auth_part)
            auth = decoded_auth.decode("utf-8", errors="ignore") if decoded_auth else auth_part
            if ":" not in auth:
                return None
            method, password = auth.split(":", 1)
            if "#" in rest:
                server_port, name = rest.split("#", 1)
                name = unquote(name)
            else:
                server_port, name = rest, None
            parsed = _split_server_port(server_port)
            if parsed is None:
                return None
            server, port = parsed
            return ParsedNode(
                protocol="ss", server=server, port=port,
                name=name or "ss_node",
                fields={"cipher": method, "password": password},
            )

        # Legacy format: ss://BASE64(method:password@server:port)#name
        fragment = ""
        if "#" in body:
            body, fragment = body.split("#", 1)
            fragment = unquote(fragment)
        decoded = safe_b64decode(body)
        if not decoded:
            return None
        inner = decoded.decode("utf-8", errors="ignore")
        if "@" not in inner:
            return None
        auth, server_port = inner.rsplit("@", 1)
        if ":" not in auth:
            return None
        method, password = auth.split(":", 1)
        parsed = _split_server_port(server_port)
        if parsed is None:
            return None
        server, port = parsed
        return ParsedNode(
            protocol="ss", server=server, port=port,
            name=fragment or "ss_node",
            fields={"cipher": method, "password": password},
        )

    @classmethod
    def to_clash(cls, node: ParsedNode) -> dict[str, Any]:
        return {
            "name": node.name, "type": "ss",
            "server": node.server, "port": node.port,
            "cipher": node.fields["cipher"], "password": node.fields["password"],
        }


# ── VMess ────────────────────────────────────────────────────────────────────

class VMessParser(ProtocolParser):
    scheme: ClassVar[str] = "vmess"

    @classmethod
    def parse(cls, link: str) -> ParsedNode | None:
        if not link.startswith("vmess://"):
            return None
        if len(link) > MAX_VMESS_LINK_LEN:
            logger.warning("vmess link too long (%d chars), rejected", len(link))
            return None
        payload = link[len("vmess://"):]
        decoded = safe_b64decode(payload)
        if not decoded:
            return None
        try:
            cfg = json.loads(decoded.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return None
        try:
            port = int(cfg.get("port") or 0)
            alter_id = int(cfg.get("aid") or 0)
        except (TypeError, ValueError):
            return None
        return ParsedNode(
            protocol="vmess",
            server=cfg.get("add", ""),
            port=port,
            name=cfg.get("ps") or cfg.get("remark") or "vmess_node",
            fields={
                "uuid": cfg.get("id", ""),
                "alterId": alter_id,
                "cipher": cfg.get("scy", "auto"),
                "tls": cfg.get("tls") in ("tls", True, "true"),
                "network": cfg.get("net", "tcp"),
                "ws_path": cfg.get("path", "/"),
                "ws_host": cfg.get("host", ""),
            },
        )

    @classmethod
    def to_clash(cls, node: ParsedNode) -> dict[str, Any]:
        result: dict[str, Any] = {
            "name": node.name, "type": "vmess",
            "server": node.server, "port": node.port,
            "uuid": node.fields["uuid"],
            "alterId": node.fields["alterId"],
            "cipher": node.fields["cipher"],
            "tls": node.fields["tls"],
            "network": node.fields["network"],
            "skip-cert-verify": False,
        }
        if node.fields["network"] == "ws":
            result["ws-opts"] = {
                "path": node.fields["ws_path"],
                "headers": {"Host": node.fields["ws_host"]},
            }
        return result

    # Keep legacy field names for backward compat (add/ps/id/aid/net/path/host)
    @classmethod
    def to_compat_dict(cls, node: ParsedNode) -> dict[str, Any]:
        """Return dict with legacy field names: add, port, id, aid, ps, net, path, host, tls, scy."""
        return {
            "add": node.server, "port": node.port, "id": node.fields["uuid"],
            "aid": node.fields["alterId"], "ps": node.name,
            "net": node.fields["network"], "path": node.fields["ws_path"],
            "host": node.fields["ws_host"],
            "tls": "tls" if node.fields["tls"] else "",
            "scy": node.fields["cipher"],
        }


# ── Trojan ───────────────────────────────────────────────────────────────────

class TrojanParser(ProtocolParser):
    scheme: ClassVar[str] = "trojan"

    @classmethod
    def parse(cls, link: str) -> ParsedNode | None:
        parts = _split_link(link, "trojan")
        if not parts:
            return None
        password, host, port, _query, fragment = parts
        return ParsedNode(
            protocol="trojan", server=host, port=port,
            name=unquote(fragment) or "trojan_node",
            fields={"password": unquote(password), "sni": host, "skip-cert-verify": False},
        )

    @classmethod
    def to_clash(cls, node: ParsedNode) -> dict[str, Any]:
        return {
            "name": node.name, "type": "trojan",
            "server": node.server, "port": node.port,
            "password": node.fields["password"],
            "sni": node.fields["sni"],
            "skip-cert-verify": node.fields["skip-cert-verify"],
        }


# ── VLESS ────────────────────────────────────────────────────────────────────

class VLESSParser(ProtocolParser):
    scheme: ClassVar[str] = "vless"

    @classmethod
    def parse(cls, link: str) -> ParsedNode | None:
        parts = _split_link(link, "vless")
        if not parts:
            return None
        uuid, host, port, query, fragment = parts
        qs = _parse_query(query)
        security = qs.get("security", "none")
        fields: dict[str, Any] = {
            "uuid": unquote(uuid),
            "tls": security in ("tls", "reality"),
            "servername": qs.get("sni", host),
            "network": qs.get("type", "tcp"),
        }
        if flow := qs.get("flow"):
            fields["flow"] = flow
        if security == "reality":
            reality: dict[str, str] = {}
            if pbk := qs.get("pbk"):
                reality["public-key"] = pbk
            if sid := qs.get("sid"):
                reality["short-id"] = sid
            if reality:
                fields["reality-opts"] = reality
            if fp := qs.get("fp"):
                fields["client-fingerprint"] = fp
        return ParsedNode(
            protocol="vless", server=host, port=port,
            name=unquote(fragment) or "vless_node",
            fields=fields,
        )

    @classmethod
    def to_clash(cls, node: ParsedNode) -> dict[str, Any]:
        return node.to_dict()


# ── Hysteria ─────────────────────────────────────────────────────────────────

class HysteriaParser(ProtocolParser):
    scheme: ClassVar[str] = "hysteria"

    @classmethod
    def parse(cls, link: str) -> ParsedNode | None:
        parts = _split_link(link, "hysteria")
        if not parts:
            return None
        _userinfo, host, port, query, fragment = parts
        qs = _parse_query(query)
        fields: dict[str, Any] = {
            "password": qs.get("authstr", ""),
            "sni": qs.get("peer", host),
            "obfs": qs.get("obfsParam", ""),
        }
        if alpn := qs.get("alpn"):
            fields["alpn"] = alpn.split(",")
        return ParsedNode(
            protocol="hysteria", server=host, port=port,
            name=unquote(fragment) or "hysteria_node",
            fields=fields,
        )

    @classmethod
    def to_clash(cls, node: ParsedNode) -> dict[str, Any]:
        result: dict[str, Any] = {
            "name": node.name, "type": "hysteria",
            "server": node.server, "port": node.port,
            "auth-str": node.fields["password"],
            "peer": node.fields["sni"],
            "obfs": node.fields.get("obfs") or "",
        }
        if alpn := node.fields.get("alpn"):
            result["alpn"] = alpn
        return result


# ── Hysteria2 ────────────────────────────────────────────────────────────────

class Hysteria2Parser(ProtocolParser):
    scheme: ClassVar[str] = "hysteria2"

    @classmethod
    def parse(cls, link: str) -> ParsedNode | None:
        if link.startswith("hy2://"):
            link = "hysteria2://" + link[len("hy2://"):]
        parts = _split_link(link, "hysteria2")
        if not parts:
            return None
        _userinfo, host, port, query, fragment = parts
        qs = _parse_query(query)
        return ParsedNode(
            protocol="hysteria2", server=host, port=port,
            name=unquote(fragment) or "hysteria2_node",
            fields={
                "password": qs.get("auth", ""),
                "sni": qs.get("sni", host),
                "skip-cert-verify": qs.get("insecure", "").lower() in ("1", "true"),
                "obfs": qs.get("obfs", ""),
            },
        )

    @classmethod
    def to_clash(cls, node: ParsedNode) -> dict[str, Any]:
        return {
            "name": node.name, "type": "hysteria2",
            "server": node.server, "port": node.port,
            "password": node.fields["password"],
            "sni": node.fields["sni"],
            "skip-cert-verify": node.fields.get("skip-cert-verify", False),
            "obfs": node.fields.get("obfs") or "",
        }


# ── TUIC ─────────────────────────────────────────────────────────────────────

class TUICParser(ProtocolParser):
    scheme: ClassVar[str] = "tuic"

    @classmethod
    def parse(cls, link: str) -> ParsedNode | None:
        parts = _split_link(link, "tuic")
        if not parts:
            return None
        userinfo, host, port, query, fragment = parts
        if ":" not in userinfo:
            return None
        uuid, password = userinfo.split(":", 1)
        qs = _parse_query(query)
        return ParsedNode(
            protocol="tuic", server=host, port=port,
            name=unquote(fragment) or "tuic_node",
            fields={
                "uuid": unquote(uuid),
                "password": unquote(password),
                "sni": qs.get("sni", host),
                "congestion-control": qs.get("congestion_control", ""),
                "udp-relay-mode": qs.get("udp_relay_mode", ""),
                "alpn": qs["alpn"].split(",") if qs.get("alpn") else [],
                "skip-cert-verify": qs.get("allow_insecure", "").lower() in ("1", "true"),
            },
        )

    @classmethod
    def to_clash(cls, node: ParsedNode) -> dict[str, Any]:
        result: dict[str, Any] = {
            "name": node.name, "type": "tuic",
            "server": node.server, "port": node.port,
            "uuid": node.fields["uuid"],
            "password": node.fields["password"],
            "sni": node.fields["sni"],
            "congestion-controller": node.fields.get("congestion-control", ""),
            "udp-relay-mode": node.fields.get("udp-relay-mode", ""),
            "skip-cert-verify": node.fields.get("skip-cert-verify", False),
        }
        if alpn := node.fields.get("alpn"):
            result["alpn"] = alpn
        return result


# ── Protocol registry ────────────────────────────────────────────────────────

_PARSERS: dict[str, type[ProtocolParser]] = {}

for _cls in (SSParser, VMessParser, TrojanParser, VLESSParser,
             HysteriaParser, Hysteria2Parser, TUICParser):
    _PARSERS[_cls.scheme] = _cls


def get_parser(scheme: str) -> type[ProtocolParser] | None:
    """Get ProtocolParser for a scheme. Supports 'hy2' → 'hysteria2'."""
    scheme = scheme.lower()
    if scheme == "hy2":
        scheme = "hysteria2"
    return _PARSERS.get(scheme)


# ── Public API ───────────────────────────────────────────────────────────────

def node_to_clash_config(link: str) -> dict[str, Any] | None:
    """Parse any supported proxy link into a Clash-compatible config dict."""
    if "://" not in link:
        return None
    scheme = link.split("://", 1)[0].lower()
    parser_cls = get_parser(scheme)
    if parser_cls is None:
        return None
    node = parser_cls.parse(link)
    if node is None:
        return None
    return parser_cls.to_clash(node)


# Convenience: parse only (returns ParsedNode)
def parse_link(link: str) -> ParsedNode | None:
    """Parse a link into ParsedNode without converting to Clash format."""
    if "://" not in link:
        return None
    scheme = link.split("://", 1)[0].lower()
    parser_cls = get_parser(scheme)
    if parser_cls is None:
        return None
    return parser_cls.parse(link)


# Backward-compatible aliases for existing consumers

def decode_vmess(link: str) -> dict | None:
    """[compat] Parse vmess link to legacy dict (add/ps/id/aid). Use node_to_clash_config() for Clash."""
    node = VMessParser.parse(link)
    return VMessParser.to_compat_dict(node) if node else None


def parse_ss_link(link: str) -> dict | None:
    """[compat] Parse ss link to internal dict. Use node_to_clash_config() for Clash format."""
    node = SSParser.parse(link)
    return node.to_dict() if node else None


def parse_trojan_link(link: str) -> dict | None:
    """[compat] Parse trojan link to internal dict."""
    node = TrojanParser.parse(link)
    return node.to_dict() if node else None


def parse_vless_link(link: str) -> dict | None:
    """[compat] Parse vless link to internal dict."""
    node = VLESSParser.parse(link)
    return node.to_dict() if node else None


def parse_hysteria_link(link: str) -> dict | None:
    """[compat] Parse hysteria link to internal dict."""
    node = HysteriaParser.parse(link)
    return node.to_dict() if node else None


def parse_hysteria2_link(link: str) -> dict | None:
    """[compat] Parse hysteria2/hy2 link to internal dict."""
    node = Hysteria2Parser.parse(link)
    return node.to_dict() if node else None


def parse_tuic_link(link: str) -> dict | None:
    """[compat] Parse tuic link to internal dict."""
    node = TUICParser.parse(link)
    return node.to_dict() if node else None


# ── Proxy API response parser ────────────────────────────────────────────────

def parse_proxy_api_response(text: str | None, default_scheme: str = "http") -> list[str]:
    """Parse proxy list/api responses into deduped URL strings.

    Supports http/https/socks4/socks5 URLs and plain host:port lines."""
    if not text:
        return []
    scheme_pattern = re.compile(r"^(http|https|socks4|socks5)://", re.I)
    ipv4_pattern = re.compile(r"^((?:\d{1,3}\.){3}\d{1,3}):(\d{1,5})\s*$")
    ipv6_pattern = re.compile(r"^(\[[\da-fA-F:.]+\]):(\d{1,5})\s*$")

    def _is_valid_ipv4(host: str) -> bool:
        try:
            return all(0 <= int(o) <= 255 for o in host.split("."))
        except ValueError:
            return False

    proxies: list[str] = []
    seen: set[str] = set()
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if scheme_pattern.match(line):
            if line not in seen:
                seen.add(line)
                proxies.append(line)
            continue
        match = ipv4_pattern.match(line) or ipv6_pattern.match(line)
        if not match:
            continue
        host, port_str = match.group(1), match.group(2)
        port = int(port_str)
        if not 1 <= port <= 65535:
            continue
        if "." in host and not _is_valid_ipv4(host):
            continue
        url = f"{default_scheme}://{host}:{port}"
        if url not in seen:
            seen.add(url)
            proxies.append(url)
    return proxies


# ── Module entry point ───────────────────────────────────────────────────────

if __name__ == "__main__":
    sample = (
        "vmess://eyJhZGQiOiJleGFtcGxlLmNvbSIsInBvcnQiOiI0NDMiLCJpZCI6Inh4eHh4eHgteHh4eC14eHh4LXh4eHgteHh4eHh4eHh4eHgiLCJhaWQiOjAsIm5ldCI6InRjcCIsInR5cGUiOiJub25lIiwiaG9zdCI6IiIsInBhdGgiOiIvIiwidGxzIjoiIiwic25pIjoiIiwicHMiOiJ0ZXN0In0= "
        "ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ=@example.com:443#test "
        "trojan://pass@example.com:443#trojan-test"
    )
    links = extract_node_links(sample)
    print("extracted:", links)
    for link in links:
        print("config:", node_to_clash_config(link))
