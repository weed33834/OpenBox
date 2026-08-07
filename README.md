# OpenBox · 开源 AI 资源导航

> **社区驱动的开源免费资源导航站** —— 聚合 AI 时代免费、可白嫖的资源：免费 API、中转站、代理节点、免费服务器、免费域名、AI 应用、实用工具、学习资料、公益站与邀请码/激活码。内容由社区投稿 + 集体验证 + 人工精选共同维护，一处收录、随时直达。

![MIT](https://img.shields.io/badge/license-MIT-green) ![GitHub Pages](https://img.shields.io/badge/status-online-2ea44f) ![React](https://img.shields.io/badge/React-19-61dafb) ![Vite](https://img.shields.io/badge/Vite-8-646cff) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)

🌐 **主站（GitHub Pages）**：[intelvor.github.io/OpenBox](https://intelvor.github.io/OpenBox/) · 📂 **代码仓库**：[GitHub](https://github.com/Intelvor/OpenBox)

---

## ✨ 这是什么

OpenBox 是一个**社区化的内容型资源导航平台**：任何人都可以投稿新资源、对已有资源投"还能用/已失效"票、留言分享避坑经验、一键报告失效链接——**每一条资源的状态都由社区共同维护**，不是站长一个人的事。

**内容构成（透明）**：
- 🧑‍🤝‍🧑 **社区投稿**：站内投稿页提交，审核后展示
- ✅ **集体验证**：每条资源可投「还能用 / 已失效」，显示「N 人验证 · 最近验证」时间
- ✍️ **精选收录**：人工挑选的官方免费层、永久免费、稳定项目（含免费服务器/域名/公益站等 9 大分类）
- 📊 **实跳审计**：全部外链定期真实请求验证，死链过滤/标注，拒绝"点过去没用"

## 🎯 核心特性

- **14 大分类 · 135+ 精选资源**：免费 API / 中转站 / 代理节点 / 免费服务器 VPS / 免费域名 / AI 应用 / 实用工具 / 学习资源 / 公益站 / 邀请码激活码（系统软件/专业应用/手机软件/游戏/平台邀请），外加「小白白嫖 / 开发者 / 研究者 / 创作者 / 邀请码」五场景交叉筛选
- **社区验证投票**：每张卡片「👍还能用 / ⚠已失效」+「N 人验证 · 最近验证 MM-DD」，匿名可投、云端共享、本地兜底
- **评论区**：每个资源一个轻量评论区，分享经验与避坑（匿名可留）
- **一键反馈**：卡片右上角 ⚠ 报告资源失效/链接错误，入库供审核
- **投稿审核**：投稿进审核库（pending → approved），杜绝垃圾；URL 白名单校验 + 60s 提交冷却 + 双端长度校验
- **登录/收藏（可选）**：配置 Supabase 后开启注册即登录，收藏上云跨设备同步
- **三语界面**（zh / en / ja）：分类名、界面、语录全三语，语言一键切换
- **双视图浏览**：网格卡 / 信息密集列表行，偏好本地记忆
- **移动端专属设计**：底部 Tab 导航、触控优化、safe-area 适配，不压缩桌面布局
- **品牌过渡**：路由切换 1.5s / 引导页进站 2.8s 圆形光环 + Logo + 随机语录加载
- **SEO 就绪**：动态标题、OG/Twitter 卡片、结构化数据（SearchAction + WebApplication）、sitemap/robots

## 🧱 技术栈

| 层 | 选型 |
|----|------|
| 框架 | React 19 + TypeScript（严格模式） |
| 构建 | Vite 8（base: `/OpenBox/`，产物提交 `docs/` 由 Pages 从分支部署） |
| 样式 | Tailwind CSS v4（`@theme` 语义令牌 + `.dark` 覆写） |
| 状态 | Zustand + `persist`（主题 / 收藏 / 提示 / 语言 / 会话） |
| 路由 | 原生 Hash 路由（引导 / 首页 / 分类 / 场景 / 资源 / 搜索 / 投稿 / 关于 / 收藏 / 登录） |
| 后端 | Supabase BaaS（可选：Auth / Database / RLS，本地种子兜底） |
| 图标 | lucide-react 1.27 |

## 🚀 本地开发

```bash
npm install --legacy-peer-deps
npm run dev        # 开发服务器 http://localhost:5173/OpenBox/
npm run build      # tsc -b && vite build（输出 docs/）
npm run preview    # 本地预览
```

> ⚠️ 项目 `base` 为 `/OpenBox/`，开发/预览均需通过 `/OpenBox/` 路径访问。

## 🗂️ 项目结构

```
src/
├─ main.tsx                 # 入口（ErrorBoundary + App）
├─ App.tsx                  # 路由分发 + 全局布局 + 过渡加载层 + 动态标题
├─ index.css                # 设计系统（令牌 / 组件类 / 关键帧动画）
├─ components/              # 通用组件（NavBar / ResourceCard / ResourceRow / FeaturedCard /
│                           #  PageLoader / MobileTabBar / VerifyWidget / CommentsWidget ...）
├─ pages/                   # 页面（10 个）
├─ store/                   # Zustand 状态（theme / auth / favorites / toast / i18n）
├─ hooks/useHashRoute.ts    # Hash 路由解析
├─ i18n/                    # 三语字典（zh / en / ja）+ 站点语录池
├─ lib/                     # 数据模型 / 数据访问层（Supabase + 本地兜底）/ 校验
└─ data/
   ├─ taxonomy.ts           # 两级分类单一数据源（配置驱动）
   ├─ curated.ts            # 社区整理收录（135+ 条稳定内容）
   ├─ sites.ts / seed.ts    # 旧数据映射 + 存活白名单过滤 → seedResources
   └─ weekly.ts             # 每周更新 / 账号动态
supabase/migrations/        # 0001 基础表 / 0002 验证投票表 / 0003 评论表（均含 RLS）
```

## 🔌 接入 Supabase（可选，开箱即用）

本地种子即可完整运行。启用云后端（投稿审核 / 登录 / 云端收藏 / 反馈 / 投票 / 评论）：

1. 在 [Supabase](https://supabase.com) 新建项目
2. SQL Editor 依次执行 `supabase/migrations/0001_init.sql` → `0002_verifications.sql` → `0003_comments.sql`
3. 复制 `.env.example` 为 `.env`，填入 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_ANON_KEY`（anon 可公开，受 RLS 保护；service_role 严禁入前端）
4. Authentication → Email 关闭「Confirm email」实现注册即登录

详见 `SUPABASE_SETUP.md`。

## 🤝 参与社区（欢迎所有人）

OpenBox 是社区项目，**任何人都可以贡献，不需要会写代码**。详细的操作规范请参阅 [CONTRIBUTING.md](./CONTRIBUTING.md)，内含 AI 也能执行的标准操作流程。

- 📤 **投稿资源**：站内「投稿」页填名称/链接/分类/简介 → 审核通过后全站展示
- 🗳️ **验证资源**：薅到了投「还能用」、踩坑了投「已失效」——你的票直接更新社区状态
- 💬 **留言避坑**：在资源详情页评论区分享你的使用经验
- ⚠️ **报告问题**：资源失效/链接错误，卡片右上角一键上报
- 🌍 **翻译**：三语界面，欢迎补充改进 zh / en / ja 文案
- 🧑‍💻 **代码**：Fork → 分支 → PR，修 bug、加功能、提优化
- 📢 **反馈建议**：任何想法都可以开 Issue 讨论

## 📄 许可

MIT © Intelvor —— 自由使用、修改、分发，欢迎二次开发与部署。
