# OpenBox · 开源 AI 资源导航

> 一个聚合 **AI 时代免费、可白嫖资源** 的开源导航站。一处收录、随时直达：免费 API、中转站、代理节点、AI 应用、实用工具与学习资料。

🌐 **在线网站**：[https://weed33834.github.io/OpenBox/](https://weed33834.github.io/OpenBox/)
📂 **GitHub 仓库**：[https://github.com/weed33834/OpenBox](https://github.com/weed33834/OpenBox)

---

## ✨ 定位与特性

OpenBox 不是「工具箱」，而是一个**内容型合集导航平台**：

- **统一资源模型**：免费 API、中转站、代理节点、AI 应用、实用工具、学习资源全部归入同一套 `Resource` 结构，通过 `subType`（子类型）+ `scenarios`（场景，可多归属）两个维度归类，筛选/搜索/详情逻辑完全复用。
- **两级分类（场景 + 子类型）**：一级「场景」如 `小白白嫖 / 开发者 / 研究者 / 创作者`；二级「子类型」如 `免费API / 中转站 / 代理节点 / AI应用 / 工具 / 学习`。场景与子类型交叉，场景下的子类型由数据动态推导。分类全部由 `src/data/taxonomy.ts` 单一配置驱动，**新增/调整分类只改配置、不碰业务代码**。
- **本地种子兜底**：未配置数据库也能直接运行（内置 278+ 策展条目 + 精选真实资源），配置 Supabase 后自动切换到生产数据。
- **三语文案（zh / en / ja）**：界面中 / 英 / 日切换；分类与场景名用 `LocalizedText`（数据即多语），资源内容保持原文。
- **收藏与投稿**：本地收藏（localStorage）；投稿在未接数据库时存为本地草稿，接入后进入审核库。
- **明暗主题**：跟随系统，可手动切换，无闪烁（FOUC 已处理）。
- **极简技术栈**：React 19 + Vite 8 + TypeScript + Tailwind CSS v4 + Zustand，零后端也能跑。

---

## 🧱 技术栈

| 层 | 选型 |
|----|------|
| 框架 | React 19 + TypeScript（严格模式） |
| 构建 | Vite 8（base: `/OpenBox/`，适配 GitHub Pages） |
| 样式 | Tailwind CSS v4（`@theme` 语义令牌 + `.dark` 覆写） |
| 状态 | Zustand（`persist` 中间件：主题 / 收藏 / 提示 / 语言） |
| 路由 | 原生 Hash 路由（`#/`（引导页）、`#/home`、`#/category/:slug`、`#/scenario/:slug`、`#/resource/:id`、`#/search?q=`、`#/submit`、`#/about`、`#/favorites`） |
| 数据 | Supabase（可选）+ 本地种子兜底 |
| 图标 | lucide-react |

---

## 🚀 本地开发

```bash
# 1. 安装依赖（任选其一）
npm install --legacy-peer-deps
# 或 pnpm install

# 2. 启动开发服务器
npm run dev
# 打开 http://localhost:5173/OpenBox/

# 3. 生产构建
npm run build      # tsc -b && vite build
npm run preview    # 本地预览 dist/
```

> ⚠️ 注意：项目 `base` 设为 `/OpenBox/`，开发/预览均需通过 `/OpenBox/` 路径访问（Vite 会自动 302 重定向）。

---

## 🗂️ 项目结构

```
src/
├─ main.tsx                 # 入口（ErrorBoundary + App）
├─ App.tsx                  # 路由分发 + 全局布局
├─ index.css                # 设计系统（@theme 令牌 / 组件类 / 动画）
├─ components/              # 通用组件（NavBar / Footer / Card / Badge / Modal 等）
├─ pages/                   # 页面（首页 / 分类 / 搜索 / 详情 / 投稿 / 关于 / 收藏）
├─ store/                   # Zustand 状态（theme / favorites / toast / i18n）
├─ hooks/useHashRoute.ts    # Hash 路由解析
├─ i18n/                    # 轻量三语文案（zh / en / ja）
├─ lib/
│  ├─ types.ts              # 核心数据模型（Resource / SubType / Scenario / Submission）
│  ├─ data.ts               # 数据访问层（Supabase + 本地兜底，单一入口）
│  ├─ supabase.ts           # Supabase 客户端（无凭证时自动关闭）
│  └─ format.ts             # 类型 / 状态展示元数据
└─ data/
   ├─ taxonomy.ts           # 两级分类单一数据源（scenarios / subTypes / 场景树）
   ├─ sites.ts              # 既有策展数据（免费API/中转类，278+ 条）
   ├─ seed.ts               # 映射 + 新分类精选条目 → seedResources
   └─ weekly.ts              # 每周更新 / 账号动态（配置驱动）
```

---

## 📊 数据模型

所有资源共用一个 `Resource` 模型，通过 `subType`（子类型）+ `scenarios`（场景，可多归属）两个维度归类：

```ts
type ResourceType   = 'free' | 'freemium' | 'paid' | 'trial';
type ResourceStatus = 'ok' | 'unstable' | 'unknown' | 'dead';

interface Resource {
  id: string;
  subType: string;           // 子类型 slug（对应 SubType.slug，路由 #/category/:slug 过滤维度）
  scenarios: string[];       // 归属场景 slug（对应 Scenario.slug，可多个）
  name: string;
  url: string;
  type: ResourceType;
  status: ResourceStatus;
  summary: string;
  description: string;
  tags: string[];
  models?: string[];         // 支持模型
  protocols?: string[];      // 代理协议（节点类）
  region?: string;           // 地区
  pricing?: string;          // 价格说明
  register?: string;         // 注册方式
  pros?: string[];           // 优点
  cons?: string[];           // 缺点
  tips?: string;             // 使用提示
  official?: boolean;        // 是否官方
  featured?: boolean;        // 是否精选
  updatedAt?: string;
}
```

数据访问层（`src/lib/data.ts`）向页面暴露 `getSubTypes / getScenarios / getResources / getResource / submitResource`，上层不关心数据来自 Supabase 还是本地种子。

> **扩展分类**：只需在 `src/data/taxonomy.ts` 的 `subTypes` / `scenarios` 中追加一条（含 `LocalizedText` 多语名与图标），并在 `SUBTYPE_SCENARIOS` 中声明子类型默认归属的场景即可，无需改动任何页面或组件。

---

## 🔌 接入 Supabase（可选，生产模式）

本地种子即可运行；若要启用生产数据库与投稿审核，执行：

1. 在 Supabase 中执行 `supabase/migrations/0001_init.sql`（建表 + RLS 策略）。
2. 复制 `.env.example` 为 `.env`，填入：
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. 重启 `npm run dev`。`dataSourceMode()` 会返回 `'supabase'`，数据层自动切换。

> 未配置时 `hasSupabase` 为 `false`，自动回退到本地种子（页面顶部会提示「本地演示模式」）。

---

## 🤝 贡献

- **提交资源**：在站点内点击「投稿」，填写名称 / 链接 / 子类型 / 简介；接入 Supabase 后进入审核库，本地模式下存为浏览器草稿。
- **代码**：Fork → 分支 → PR。CI（`deploy.yml`）在 push 到 `main` 时自动构建并发布到 GitHub Pages。

---

## 📄 许可

MIT © weed
