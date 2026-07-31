"""FreeNode · 轻量 Liquid 渲染器 (Jekyll-lite)

仅用于本地生成静态预览,以支撑移动端自动化测试。
覆盖本项目模板实际用到的 Liquid 子集:
  - 输出 {{ ... }} 与过滤器 (relative_url/default/jsonify/escape/size/date/
    slice/downcase/append/truncate/times/divided_by/round/reverse/sort/split/replace)
  - 标签 {% if/elsif/else/unless/for/assign/capture/include %}
  - 变量解析 site.* / page.* / include.* / forloop.* / 局部变量
  - forloop.index 等循环内建变量

不追求与 Jekyll 100% 一致,只需把当前模板+数据渲染成结构正确的 HTML,
供 Playwright 验证移动端 DOM 与样式。
"""
from __future__ import annotations

import json
import math
import os
import re
from datetime import datetime


# --------------------------------------------------------------------------
# 基础工具
# --------------------------------------------------------------------------
def split_top(text: str, sep: str):
    """在顶层(不在引号/括号内)按 sep 切分。"""
    parts, buf = [], []
    depth = 0
    in_str = None
    i = 0
    while i < len(text):
        c = text[i]
        if in_str:
            buf.append(c)
            if c == in_str:
                in_str = None
            i += 1
            continue
        if c in ('"', "'"):
            in_str = c
            buf.append(c)
            i += 1
            continue
        if c in "([{":
            depth += 1
            buf.append(c)
            i += 1
            continue
        if c in ")]}":
            depth -= 1
            buf.append(c)
            i += 1
            continue
        if depth == 0 and text[i:i + len(sep)] == sep:
            parts.append("".join(buf))
            buf = []
            i += len(sep)
            continue
        buf.append(c)
        i += 1
    parts.append("".join(buf))
    return [p.strip() for p in parts]


def get_attr(obj, key):
    if obj is None:
        return None
    if isinstance(obj, dict):
        if key in obj:
            return obj[key]
        return obj.get(key)
    if isinstance(obj, list):
        if key.isdigit():
            try:
                return obj[int(key)]
            except IndexError:
                return None
        return None
    return getattr(obj, key, None)


def resolve(path: str, ctx: dict):
    """解析 a.b.c 或 region_key[0] 形式的变量路径。"""
    if path is None:
        return None
    path = path.strip()
    if not path:
        return None
    segs = re.findall(r"[a-zA-Z_][\w]*|\[[^\]]*\]", path)
    if not segs:
        return None
    root = segs[0]
    special = {"site", "page", "include", "forloop"}
    if root in special:
        cur = ctx.get(root, {})
    else:
        cur = ctx.get(root)
        if cur is None and isinstance(ctx.get("site"), dict) and root in ctx["site"]:
            cur = ctx["site"].get(root)
    idx = 1
    while idx < len(segs):
        seg = segs[idx]
        if seg.startswith("["):
            inner = seg[1:-1].strip()
            if inner.isdigit():
                try:
                    cur = cur[int(inner)]
                except (TypeError, IndexError, KeyError):
                    return None
            else:
                cur = get_attr(cur, inner.strip("'\""))
        else:
            cur = get_attr(cur, seg)
        idx += 1
    return cur


# --------------------------------------------------------------------------
# 过滤器
# --------------------------------------------------------------------------
def _apply_filter(val, name, args, ctx):
    a = lambda i: value_chain(args[i], ctx) if i < len(args) else None
    if name == "default":
        dflt = a(0)
        if val in (None, "", False):
            return dflt
        return val
    if name == "relative_url":
        if isinstance(val, str) and val.startswith("/"):
            return ctx["site"].get("baseurl", "") + val
        return val
    if name == "jsonify":
        return json.dumps(val, ensure_ascii=False)
    if name == "escape":
        s = str(val)
        return (s.replace("&", "&amp;").replace("<", "&lt;")
                 .replace(">", "&gt;").replace('"', "&quot;").replace("'", "&#39;"))
    if name == "size":
        try:
            return len(val)
        except TypeError:
            return 0
    if name == "date":
        fmt = str(a(0) or "%Y-%m-%d").strip("'\"")
        return _format_date(val, fmt)
    if name == "slice":
        start = int(a(0) or 0)
        length = int(a(1)) if len(args) > 1 else None
        seq = val[start:start + length] if length is not None else val[start:]
        return seq
    if name == "downcase":
        return str(val).lower()
    if name == "append":
        return str(val) + str(a(0) or "")
    if name == "truncate":
        n = int(a(0) or 50)
        s = str(val)
        return s if len(s) <= n else s[:n].rstrip() + "…"
    if name == "times":
        return float(val) * float(a(0) or 0)
    if name == "divided_by":
        return float(val) / float(a(0) or 1)
    if name == "round":
        return round(float(val))
    if name == "reverse":
        try:
            return list(reversed(val))
        except TypeError:
            return val
    if name == "sort":
        try:
            return sorted(val)
        except TypeError:
            return val
    if name == "split":
        return str(val).split(str(a(0) or " "))
    if name == "replace":
        return str(val).replace(str(a(0) or ""), str(a(1) or ""))
    return val


_DATE_FORMATS = [
    "%Y-%m-%dT%H:%M:%S%z",
    "%Y-%m-%d %H:%M:%S %z",
    "%Y-%m-%dT%H:%M:%SZ",
    "%Y-%m-%d %H:%M:%S",
    "%Y-%m-%d",
]


def _format_date(val, fmt):
    fmt = (fmt.replace("%-", "%").replace(" UTC", "")
                .replace(" UTC", ""))
    dt = None
    if isinstance(val, datetime):
        dt = val
    elif isinstance(val, str):
        s = val.replace("Z", "+0000")
        for f in _DATE_FORMATS:
            try:
                dt = datetime.strptime(s, f)
                break
            except ValueError:
                continue
    if dt is None:
        return str(val)
    try:
        return dt.strftime(fmt)
    except ValueError:
        return str(val)


# --------------------------------------------------------------------------
# 表达式求值
# --------------------------------------------------------------------------
def value_chain(raw: str, ctx: dict):
    raw = (raw or "").strip()
    if not raw:
        return None
    if "|" in raw:
        parts = split_top(raw, "|")
        val = _base_value(parts[0], ctx)
        for seg in parts[1:]:
            m = re.match(r"^([a-zA-Z_]\w*)\s*(?::\s*(.*))?$", seg, re.DOTALL)
            if not m:
                continue
            fname = m.group(1)
            argstr = m.group(2) or ""
            args = split_top(argstr, ",") if argstr.strip() else []
            val = _apply_filter(val, fname, args, ctx)
        return val
    return _base_value(raw, ctx)


def _base_value(raw: str, ctx: dict):
    raw = raw.strip()
    if not raw:
        return None
    if (raw[0] == '"' and raw[-1] == '"') or (raw[0] == "'" and raw[-1] == "'"):
        return raw[1:-1]
    low = raw.lower()
    if low == "true":
        return True
    if low == "false":
        return False
    if low in ("null", "nil", "none"):
        return None
    if re.fullmatch(r"-?\d+", raw):
        return int(raw)
    if re.fullmatch(r"-?\d*\.\d+", raw):
        return float(raw)
    return resolve(raw, ctx)


def truthy(v) -> bool:
    if v is None or v is False:
        return False
    if isinstance(v, str):
        return v != ""
    return True


def _compare(op, lv, rv) -> bool:
    if op == "==":
        return lv == rv
    if op == "!=":
        return lv != rv

    def num(x):
        try:
            return float(x)
        except (TypeError, ValueError):
            return None

    ln, rn = num(lv), num(rv)
    if ln is not None and rn is not None:
        if op == ">":
            return ln > rn
        if op == "<":
            return ln < rn
        if op == ">=":
            return ln >= rn
        if op == "<=":
            return ln <= rn
    ls, rs = str(lv), str(rv)
    if op == ">":
        return ls > rs
    if op == "<":
        return ls < rs
    if op == ">=":
        return ls >= rs
    if op == "<=":
        return ls <= rs
    return False


def eval_condition(raw: str, ctx: dict) -> bool:
    if raw is None:
        return False
    raw = raw.strip()
    for orpart in split_top(raw, " or "):
        if _eval_and(orpart, ctx):
            return True
    return False


def _eval_and(raw: str, ctx: dict) -> bool:
    for andpart in split_top(raw, " and "):
        if not _eval_atom(andpart, ctx):
            return False
    return True


def _eval_atom(s: str, ctx: dict) -> bool:
    s = s.strip()
    for op in ("==", "!=", ">=", "<=", ">", "<"):
        if op in s:
            l, r = s.split(op, 1)
            return _compare(op, value_chain(l.strip(), ctx), value_chain(r.strip(), ctx))
    return truthy(value_chain(s, ctx))


# --------------------------------------------------------------------------
# 块提取与控制标签
# --------------------------------------------------------------------------
def _extract_block(text: str, start: int, end_tags):
    depth = 1
    i = start
    n = len(text)
    while i < n:
        j = text.find("{%", i)
        if j == -1:
            break
        e = text.find("%}", j)
        if e == -1:
            break
        tag = text[j + 2:e].strip()
        if re.match(r"^(if|unless|for|capture)\b", tag) or tag in ("if", "unless", "for", "capture"):
            depth += 1
            i = e + 2
        elif tag in end_tags:
            depth -= 1
            if depth == 0:
                return text[start:j], e + 2
            i = e + 2
        else:
            i = e + 2
    return text[start:], n


def _split_if_body(body: str):
    """把 if 主体切成 (kind, cond, content) 段,含 else / elsif。"""
    parts = []
    depth = 0
    i = 0
    n = len(body)
    buf_start = 0
    pending_kind = "base"
    pending_cond = None
    while i < n:
        j = body.find("{%", i)
        if j == -1:
            break
        e = body.find("%}", j)
        tag = body[j + 2:e].strip()
        if re.match(r"^(if|unless|for|capture)\b", tag) or tag in ("if", "unless", "for", "capture"):
            depth += 1
            i = e + 2
        elif depth == 0 and (tag.startswith("elsif") or tag == "else"):
            seg = body[buf_start:j]
            parts.append((pending_kind, pending_cond, seg))
            if tag.startswith("elsif"):
                pending_kind = "elsif"
                pending_cond = tag[len("elsif"):].strip()
            else:
                pending_kind = "else"
                pending_cond = None
            buf_start = e + 2
            i = e + 2
        else:
            if tag in ("endif", "endunless", "endfor", "endcapture"):
                depth -= 1
            i = e + 2
    parts.append((pending_kind, pending_cond, body[buf_start:]))
    return parts


def render_if(tag: str, body: str, ctx: dict) -> str:
    if tag.startswith("unless"):
        base_cond = tag[len("unless"):].strip()
        if eval_condition(base_cond, ctx):
            return ""
        body_parts = _split_if_body(body)
        # unless 没有 elsif 分支语义上的 cond,直接渲染 else 或主体
        for kind, cond, content in body_parts:
            if kind == "base":
                return render(content, ctx)
            if kind == "else":
                return render(content, ctx)
        return ""
    base_cond = tag[len("if"):].strip()
    for kind, cond, content in _split_if_body(body):
        if kind == "base":
            if eval_condition(base_cond, ctx):
                return render(content, ctx)
        elif kind == "elsif":
            if eval_condition(cond, ctx):
                return render(content, ctx)
        elif kind == "else":
            return render(content, ctx)
    return ""


def render_for(tag: str, body: str, ctx: dict) -> str:
    m = re.match(r"for\s+(\w+)\s+in\s+(.+)$", tag, re.DOTALL)
    if not m:
        return ""
    var = m.group(1)
    expr = m.group(2).strip()
    reverse = False
    if expr.endswith("reversed"):
        reverse = True
        expr = expr[:-len("reversed")].strip()
    seq = value_chain(expr, ctx)
    if seq is None:
        return ""
    if not isinstance(seq, (list, tuple)):
        seq = [seq]
    items = list(seq)
    if reverse:
        items = list(reversed(items))
    out = []
    n = len(items)
    for i, item in enumerate(items):
        child = dict(ctx)
        child[var] = item
        child["forloop"] = {
            "index": i + 1, "index0": i, "rindex": n - i,
            "rindex0": n - i - 1, "first": i == 0, "last": i == n - 1,
            "length": n,
        }
        out.append(render(body, child))
    return "".join(out)


def render_include(tag: str, ctx: dict, loader) -> str:
    m = re.match(r"include\s+(\S+)(.*)$", tag, re.DOTALL)
    if not m:
        return ""
    fname = m.group(1).strip("'\"")
    rest = m.group(2)
    params = {}
    for pm in re.finditer(r"(\w+)\s*=\s*(\"[^\"]*\"|'[^']*'|[\w.\[\]/]+)", rest):
        key = pm.group(1)
        val = pm.group(2)
        params[key] = value_chain(val, ctx)
    child = dict(ctx)
    child["include"] = params
    tmpl = loader(fname)
    if tmpl is None:
        return ""
    return render(tmpl, child)


# --------------------------------------------------------------------------
# 主渲染入口
# --------------------------------------------------------------------------
def render(text: str, ctx: dict) -> str:
    result = []
    i = 0
    n = len(text)
    while i < n:
        j = text.find("{%", i)
        k = text.find("{{", i)
        cand = [x for x in (j, k) if x != -1]
        if not cand:
            result.append(text[i:])
            break
        nxt = min(cand)
        result.append(text[i:nxt])
        if nxt == j:  # 标签
            e = text.find("%}", nxt)
            tag = text[nxt + 2:e].strip()
            after = e + 2
            if re.match(r"^(if|unless)\b", tag) or tag in ("if", "unless"):
                body, after = _extract_block(text, after, ("endif", "endunless"))
                result.append(render_if(tag, body, ctx))
            elif re.match(r"^for\b", tag) or tag == "for":
                body, after = _extract_block(text, after, ("endfor",))
                result.append(render_for(tag, body, ctx))
            elif re.match(r"^capture\b", tag) or tag == "capture":
                body, after = _extract_block(text, after, ("endcapture",))
                captured = render(body, ctx)
                name = tag.split()[1]
                ctx[name] = captured
            elif re.match(r"^assign\b", tag) or tag == "assign":
                expr = tag[len("assign"):].strip()
                name, _, rhs = expr.partition("=")
                name = name.strip()
                rhs = rhs.strip()
                if name:
                    ctx[name] = value_chain(rhs, ctx)
            elif re.match(r"^include\b", tag):
                result.append(render_include(tag, ctx, ctx.get("_loader")))
            # 其它(endif/else/elsif 等)直接跳过
            i = after
        else:  # 输出
            e = text.find("}}", nxt)
            expr = text[nxt + 2:e].strip()
            after = e + 2
            val = value_chain(expr, ctx)
            result.append(_to_html(val))
            i = after
    return "".join(result)


def _to_html(val) -> str:
    if val is None:
        return ""
    if val is True:
        return "true"
    if val is False:
        return "false"
    if isinstance(val, (dict, list)):
        return json.dumps(val, ensure_ascii=False)
    return str(val)


# --------------------------------------------------------------------------
# 站点上下文构建
# --------------------------------------------------------------------------
def load_config(config_path: str) -> dict:
    cfg = {}
    text = open(config_path, encoding="utf-8").read()
    for line in text.splitlines():
        m = re.match(r"^([a-zA-Z_][\w]*):\s*(.*)$", line)
        if m:
            k, v = m.group(1), m.group(2).strip()
            cfg[k] = v.strip('"').strip("'")
    return cfg


def load_data(data_dir: str) -> dict:
    data = {}
    if os.path.isdir(data_dir):
        for fn in os.listdir(data_dir):
            if fn.endswith(".json"):
                try:
                    with open(os.path.join(data_dir, fn), encoding="utf-8") as f:
                        data[fn[:-5]] = json.load(f)
                except json.JSONDecodeError:
                    pass
    return data


def build_site_context(docs_dir: str) -> dict:
    cfg = load_config(os.path.join(docs_dir, "_config.yml"))
    data = load_data(os.path.join(docs_dir, "_data"))
    site = {
        "baseurl": cfg.get("baseurl", ""),
        "url": cfg.get("url", ""),
        "title": cfg.get("title", "FreeNode"),
        "description": cfg.get("description", ""),
        "repository": cfg.get("repository", ""),
        "data": data,
        "time": "2026-07-30 03:13:58 +0000",
    }
    site.update(data)  # 允许 site.xxx 直接访问数据(部分模板用法)
    return {"site": site, "_now": datetime(2026, 7, 30), "_loader": None}


def parse_front_matter(text: str):
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            fm_raw = text[3:end].strip()
            body = text[end + 4:]
            fm = {}
            for line in fm_raw.splitlines():
                m = re.match(r"^([a-zA-Z_][\w]*):\s*(.*)$", line)
                if m:
                    fm[m.group(1)] = m.group(2).strip().strip('"').strip("'")
            return fm, body
    return {}, text
