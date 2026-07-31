# OpenBox

> 一个统一的开源工具箱，合并了 **FreeAPI**（基于 React + Vite + Supabase 的免费 AI API 导航站）与 **FreeNode**（发现、抓取、去重并发布免费网络节点的 Python 流水线）。

OpenBox 将两个原本独立的项目合并到一个扁平仓库中：

| 组件 | 技术栈 | 功能 |
|------|--------|------|
| **FreeAPI**（`src/`、`public/`、`supabase/`） | TypeScript · React · Vite · Supabase | 聚合并导航免费 AI API 端点的 Web 应用，支持筛选、对比、收藏、健康检查与多语言。 |
| **FreeNode**（`scripts/`、`nodes/`、`docs/`、`tests/`） | Python | 抓取公开节点源、去重并验证，随后构建 Jekyll 状态站并导出 Clash/V2Ray 配置的流水线。 |

## 仓库结构

```
openbox/
├── src/                 # FreeAPI — React 应用源码
├── public/              # FreeAPI — 静态资源
├── supabase/            # FreeAPI — 数据库迁移
├── scripts/             # FreeNode — 抓取/格式化/验证 (Python)
│   ├── adapters/        #   源适配器 (git, rss, html, …)
│   └── ...
├── nodes/               # FreeNode — 生成的节点输出
├── docs/                # FreeNode — Jekyll 状态站
├── tests/               # FreeNode — pytest 测试套件
├── config/              # FreeNode — 源列表
├── index.html           # FreeAPI — Vite 入口
├── package.json         # FreeAPI — npm 脚本
├── pyproject.toml       # FreeNode — Python 项目配置
└── requirements.txt     # FreeNode — Python 依赖
```

## 快速开始

### FreeAPI（前端）
```bash
pnpm install
cp .env.example .env      # 填入 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
pnpm dev
```

### FreeNode（流水线）
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # 调整 FREENODE_* 变量
python scripts/update.py
```

工作流细节见 `CONTRIBUTING.md`，CI 配置见 `.github/workflows/`（`deploy.yml` 为前端部署，`daily-update.yml` 为节点流水线）。

## 许可证

MIT — 见 [LICENSE](LICENSE)。
