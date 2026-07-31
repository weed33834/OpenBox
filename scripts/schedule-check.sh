#!/bin/bash
# 定时执行站点检测并提交结果到仓库。
#
# 用法：在服务器/本机配置 cron，例如每 6 小时执行一次：
#
#   0 */6 * * * /path/to/FreeAPI/scripts/schedule-check.sh >> /tmp/FreeAPI-cron.log 2>&1
#
# 注意：
#   - 必须在非沙箱环境运行（本机 / 服务器），沙箱环境有网络限制会导致大量 fetch-failed
#   - 需要提前配置 git 远程仓库推送权限（SSH key 或 token）
#   - 依赖 Node.js 环境

set -euo pipefail
cd "$(dirname "$0")/.."

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始站点检测..."

# 导出站点清单
if [ ! -f api/sites.json ]; then
  node scripts/export-sites.mjs
fi

# 执行检测
node scripts/check-all.mjs

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 检测完成，提交结果..."

# 提交结果
git add api/site-check-result.json
if git diff --cached --quiet; then
  echo "无变更，跳过 commit"
else
  GIT_AUTHOR_NAME="FreeAPI Bot" \
  GIT_AUTHOR_EMAIL="bot@freeapi.dev" \
  git commit -m "chore: auto site health check $(date '+%Y-%m-%d %H:%M')"
  git push
  echo "已提交并推送"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 完成"
