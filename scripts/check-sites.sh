#!/bin/bash
# 批量检查所有站点可用性
# 输出格式：id<TAB>http_code<TAB>url
# 用法：bash scripts/check-sites.sh

set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f api/sites.json ]; then
  echo "请先运行：node scripts/export-sites.mjs" >&2
  exit 1
fi

TOTAL=$(jq 'length' api/sites.json)
echo "正在检查 $TOTAL 个站点（15 并发，8s 超时）..." >&2

# jq 用空格分隔 id 和 url（URL 不含空格），xargs -n 2 取两个参数
# bash -c 中 $0=id $1=url
jq -r '.[] | "\(.id) \(.url)"' api/sites.json | \
  xargs -P 15 -n 2 bash -c '
    code=$(curl -sI -o /dev/null -w "%{http_code}" -L --max-time 8 "$1" 2>/dev/null || echo "000")
    printf "%s\t%s\t%s\n" "$0" "$code" "$1"
  ' | sort > /tmp/site-check-results.tsv

echo "" >&2
echo "=== 状态码分布 ===" >&2
cut -f2 /tmp/site-check-results.tsv | sort | uniq -c | sort -rn >&2

echo "" >&2
echo "=== 失效站点（非 2xx/3xx）===" >&2
awk -F'\t' '$2 !~ /^[23]/ {printf "%-20s %s %s\n", $1, $2, $3}' /tmp/site-check-results.tsv >&2

echo "" >&2
echo "完整结果：/tmp/site-check-results.tsv" >&2
