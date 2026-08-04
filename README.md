# OpenBox · 开源 AI 资源导航

> 聚合 **AI 时代免费、可白嫖资源** 的开源导航站。一处收录、随时直达：免费 API、中转站、代理节点、AI 应用、实用工具与学习资料。

🌐 **主站（国内秒开）**：Gitee Pages（待启用，去仓库点「服务→Gitee Pages→启动」）
🌐 **备用站（海外）**：[open-box-eight.vercel.app](https://open-box-eight.vercel.app)
📂 **仓库**：[GitCode](https://gitcode.com/badhope/OpenBox) · [GitHub](https://github.com/weed33834/OpenBox) · [Gitee](https://gitee.com/badhope/OpenBox)

---

## ✨ 定位与特性

OpenBox 是一个**内容型合集导航平台**：

- **统一资源模型**：免费 API、中转站、代理节点、AI 应用、实用工具、学习资源全部归入同一套 `Resource` 结构，通过 `subType`（子类型）+ `scenarios`（场景，可多归属）两个维度归类。
- **两级分类**：一级「场景」— 小白白嫖 / 开发者 / 研究者 / 创作者；二级「子类型」— 免费 API / 中转站 / 代理节点 / AI 应用 / 工具 / 学习。分类由 `src/data/taxonomy.ts` 单一配置驱动。
- **~150 个精选资源**：含官方 API、AI 应用、开发工具、学习课程等，定期维护更新。旧中转站经 HTTP 实跳验证，死链已过滤。
- **三语界面**（zh / en / ja）：导航、分类、按钮全三语覆盖；分类/场景名用 `LocalizedText`（数据即多语）。
- **收藏与投稿**：浏览器本地收藏；投稿在未接数据库时存本地草稿，接入 Supabase 后进入云端审核库。
- **资源反馈**：每个卡片可一键反馈（资源失效 / 链接错误等），报告入库供审核。
- **用户系统（可选）**：配置 Supabase 后开启登录/注册，收藏上云跨设备同步。
- **全站过渡动画**：页面淡入、卡片交错入场、路由切换脉冲 Logo、导航栏滑入。
- **明暗主题**：跟随系统，可手动切换（FOUC 已处理）。

---

## 🧱 技术栈

| 层 | 选型 |
|----|------|
| 框架 | React 19 + TypeScript（严格模式） |
| 构建 | Vite 8（base: `/OpenBox/`） |
| 样式 | Tailwind CSS v4（`@theme` 语义令牌 + `.dark` 覆写） |
| 状态 | Zustand + `persist`（主题 / 收藏 / 提示 / 语言 / 会话） |
| 路由 | 原生 Hash 路由（10 个路由：引导页 / 首页 / 分类 / 场景 / 资源 / 搜索 / 投稿 / 关于 / 收藏 / 登录） |
| 数据 | Supabase（可选）+ 本地种子兜底（双模切换） |
| 后端 | Supabase BaaS（Auth / Database / RLS） |
| 图标 | lucide-react 1.27 |

---

## 🚀 本地开发

```bash
# 安装依赖
npm install --legacy-peer-deps

# 启动开发服务器
npm run dev
# 打开 http://localhost:5173/OpenBox/

# 生产构建
npm run build       # tsc -b && vite build
npm run preview     # 本地预览 dist/
```

> ⚠️ 注意：项目 `base` 设为 `/OpenBox/`，开发/预览均需通过 `/OpenBox/` 路径访问。

---

## 🗂️ 项目结构

```
src/
├─ main.tsx                 # 入口（ErrorBoundary + App）
├─ App.tsx                  # 路由分发 + 全局布局 + 过渡动画
├─ index.css                # 设计系统（令牌 / 组件类 / 关键帧动画）
├─ components/              # 通用组件（20+：NavBar / Card / Badge / Modal / AuthModal 等）
├─ pages/                   # 页面（10 个）
├─ store/                   # Zustand 状态（theme / auth / favorites / toast / i18n）
├─ hooks/useHashRoute.ts    # Hash 路由解析
├─ i18n/                    # 轻量三语（zh / en / ja，60+ 键）
├─ lib/
│  ├─ types.ts              # 核心数据模型（Resource / SubType / Scenario / Submission）
│  ├─ data.ts               # 数据访问层（Supabase + 本地兜底，单一入口）
│  ├─ supabase.ts           # Supabase 客户端（无凭证自动关闭 + 占位符守卫）
│  └─ format.ts             # 类型/状态展示元数据
└─ data/
   ├─ taxonomy.ts           # 两级分类单一数据源（配置驱动）
   ├─ sites.ts              # 旧中转站原始数据
   ├─ seed.ts               # 精选条目 + 存活白名单过滤 → seedResources
   └─ weekly.ts             # 每周更新 / 账号动态
supabase/migrations/
   └─ 0001_init.sql         # 建表 + RLS 策略（含匿名反馈）
```

---

## 🔌 接入 Supabase（可选）

本地种子即可运行。启用云后端（投稿审核 + 登录 + 云端收藏 + 反馈）：

1. 在 [Supabase](https://supabase.com) 新建项目
2. SQL Editor 执行 `supabase/migrations/0001_init.sql`
3. 复制 `.env.example` 为 `.env`，填入 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`
4. 重启开发服务器，`dataSourceMode()` 返回 `'supabase'`
5. 如需登录，在 Supabase Authentication 启用 Email 提供商

详见 `SUPABASE_SETUP.md`。

---

## 🤝 贡献

- **提交资源**：站点内「投稿」页填写名称/链接/子类型/简介，接入 Supabase 后进入审核库
- **反馈问题**：每个资源卡片右上角「⚠」按钮可一键报告失效/错误等问题
- **代码**：Fork → 分支 → PR（GitCode）

---

## 📄 许可

MIT © badhope
