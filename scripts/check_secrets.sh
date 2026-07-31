#!/usr/bin/env bash
# 推送前扫一遍仓库里有没有泄露的密钥/token。
# 用 git grep 只扫跟踪的文本文件，命中就退出非零阻止推送。

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

# 常见密钥特征。新增类型往这里加。
# 注意：写成正则，别把真实 token 值贴进来。
patterns='ghp_[A-Za-z0-9]{36}|ghs_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{82}|AKIA[0-9A-Z]{16}|oauth2:[A-Za-z0-9_-]{20,}@'

# 只扫文本类文件，跳过锁文件和二进制
paths=(
    '*.py' '*.ts' '*.tsx' '*.js' '*.mjs' '*.json' '*.yml' '*.yaml'
    '*.md' '*.sh' '*.toml' '*.cfg' '*.ini' 'Makefile' 'Dockerfile'
    'Caddyfile' '*.env.example'
)

hits=0
while IFS= read -r line; do
    [ -z "$line" ] && continue
    echo "SECRET: $line"
    hits=$((hits + 1))
done < <(git grep -nE "$patterns" -- "${paths[@]}" 2>/dev/null || true)

if [ "$hits" -gt 0 ]; then
    echo ""
    echo "发现 $hits 处疑似密钥泄露，推送已阻止。请清理后重试。"
    echo "如果是误报，可以临时跳过：git push --no-verify（不建议）。"
    exit 1
fi

echo "密钥扫描通过，未发现泄露。"
