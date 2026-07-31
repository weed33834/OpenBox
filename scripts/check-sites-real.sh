#!/bin/bash
# 真实检查每个站点：访问页面，看 HTTP 状态码 + 页面标题
# 这样能发现"域名已转卖""跳转到无关页面""404""502"等问题站点
# 用法：bash scripts/check-sites-real.sh

set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f api/sites.json ]; then
  node scripts/export-sites.mjs
fi

TOTAL=$(jq 'length' api/sites.json)
echo "正在真实访问 $TOTAL 个站点（10 并发，12s 超时，模拟浏览器 UA）..." >&2
echo "检查项：HTTP 状态码 + 最终 URL + 页面标题" >&2
echo "" >&2

OUT="/tmp/site-real-check.tsv"
> "$OUT"

# 10 并发，每个站点 curl 完整请求
jq -r '.[] | "\(.id) \(.url) \(.name)"' api/sites.json | \
  xargs -P 10 -n 3 bash -c '
    id="$0"; url="$1"; name="$2"
    tmp="/tmp/page-$$.html"
    info=$(curl -sL -o "$tmp" -w "HTTP:%{http_code}|FINAL:%{url_effective}" \
      -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36" \
      --max-time 12 "$url" 2>/dev/null)
    [ -f "$tmp" ] || touch "$tmp"
    title=$(grep -oiP "<title>\K[^<]+" "$tmp" 2>/dev/null | head -1 | tr -d "\r\n" | cut -c1-60)
    rm -f "$tmp"
    printf "%s\t%s\t%s\t%s\n" "$id" "$info" "$title" "$name" >> "'"$OUT"'"
  ' _ 

# 重新读取结果并分类
echo "=== 完整结果 ===" >&2
sort "$OUT" | awk -F'\t' '{
  split($2, a, "|");
  split(a[1], h, ":");
  code = h[2];
  status[code]++;
  if (code != "200") print $1, code, $4, $3;
}' > /tmp/site-issues.txt

echo "" >&2
echo "=== HTTP 状态码分布 ===" >&2
sort -t$'\t' -k2 "$OUT" | awk -F'\t' '{
  split($2, a, "|");
  split(a[1], h, ":");
  print h[2];
}' | sort | uniq -c | sort -rn >&2

echo "" >&2
echo "=== 非正常站点（HTTP 非 200）===" >&2
sort -t$'\t' -k2 "$OUT" | awk -F'\t' '{
  split($2, a, "|");
  split(a[1], h, ":");
  code = h[2];
  if (code != "200") printf "%-22s %-6s %s\n", $1, code, $4;
}' >&2

echo "" >&2
echo "=== 状态 200 但标题可疑（可能域名转卖/广告页）===" >&2
# 可疑关键词：极省创、域名出售、404 Not Found、Welcome to nginx、出售、domain for sale
sort -t$'\t' -k2 "$OUT" | awk -F'\t' '{
  split($2, a, "|");
  split(a[1], h, ":");
  code = h[2];
  if (code == "200" && $3 ~ /极省创|域名出售|domain for sale|404|Not Found|Welcome to nginx|出售|推广|占位/) {
    printf "%-22s %-30s %s\n", $1, $3, $4;
  }
}' >&2

echo "" >&2
echo "完整结果已存到 $OUT" >&2
echo "问题站点清单已存到 /tmp/site-issues.txt" >&2
