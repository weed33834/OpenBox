# OpenBox 贡献指南

> 本文档面向**所有人**——包括人类贡献者和 AI 助手。请严格按规范操作，避免出错。

---

## 目录

1. [项目架构速览](#1-项目架构速览)
2. [快速开始：本地开发](#2-快速开始本地开发)
3. [添加一条新资源（最常见操作）](#3-添加一条新资源最常见操作)
4. [添加新分类 / 子类型](#4-添加新分类--子类型)
5. [标记资源已失效](#5-标记资源已失效)
6. [更新资源状态](#6-更新资源状态)
7. [添加每周更新 / 账号动态](#7-添加每周更新--账号动态)
8. [添加翻译 / 文案](#8-添加翻译--文案)
9. [提交 PR 规范](#9-提交-pr-规范)
10. [AI 贡献者特别规范](#10-ai-贡献者特别规范)

---

## 1. 项目架构速览

### 数据流

```
taxonomy.ts (分类定义)         ← 新增分类/子类型改这里
       ↓
curated.ts (资源条目)          ← 新增资源改这里（首选）
sites.ts + seed.ts (旧数据)    ← 旧数据迁移管道，非必要不动
       ↓
lib/data.ts (数据加载层)       ← 自动合并本地种子 + 社区投稿
       ↓
组件 (ResourceCard, ResourceList 等)
```

### 关键文件一览

| 文件 | 用途 | 何时修改 |
|------|------|----------|
| `src/data/taxonomy.ts` | 分类/子类型/场景的配置定义 | 新增分类时 |
| `src/data/curated.ts` | 社区整理的资源条目（JSON 数组） | **新增资源时** |
| `src/data/blacklist.ts` | 已确认死链的黑名单 | 标记资源失效时 |
| `src/data/weekly.ts` | 每周更新 / 账号动态 | 发布新动态时 |
| `src/i18n/translations.ts` | 界面三语字典 | 新增界面文案时 |
| `src/lib/types.ts` | Resource 数据模型定义 | 极少修改 |

### 数据模型速查（`Resource` 接口）

```typescript
interface Resource {
  id: string;              // 唯一标识，格式: "ob-{分类}-{英文短名}"
  subType: string;         // 子类型 slug，对应 taxonomy.ts 中的定义
  scenarios: string[];     // 场景 slug 列表，可空（自动回退到子类型默认场景）
  name: string;            // 资源名称
  url: string;             // 外链
  type: 'free' | 'freemium' | 'trial' | 'paid';  // 计费类型
  status: 'ok' | 'unstable' | 'unknown' | 'dead'; // 可用状态
  summary: string;         // 一句话简介（卡片展示）
  description: string;     // 详情描述（详情页展示）
  tags: string[];          // 特点标签
  models?: string[];       // 支持模型（API/中转类）
  protocols?: string[];    // 支持协议（代理节点类）
  region?: string;         // 地区
  pricing?: string;        // 价格/额度说明
  register?: string;       // 注册方式
  pros?: string[];         // 优点
  cons?: string[];         // 缺点/风险
  tips?: string;           // 使用建议
  steps?: string[];        // 分步教程
  official?: boolean;      // 是否官方出品
  featured?: boolean;      // 是否首页精选
  updatedAt?: string;      // ISO 日期，如 "2026-08-01"
  popularity?: number;     // 人气分 0-100
}
```

---

## 2. 快速开始：本地开发

```bash
# 克隆
git clone https://github.com/Intelvor/OpenBox.git
cd OpenBox

# 安装依赖
npm install --legacy-peer-deps

# 启动开发服务器
npm run dev          # 访问 http://localhost:5173/OpenBox/

# 构建
npm run build        # 输出到 docs/ 目录

# 本地预览构建结果
npm run preview
```

> 注意：项目 base path 为 `/OpenBox/`，开发/预览均需通过 `/OpenBox/` 路径访问。

---

## 3. 添加一条新资源（最常见操作）

### 3.1 确定归属子类型

在 `src/data/taxonomy.ts` 中查找 `subTypes` 数组，确认新资源属于哪个子类型（slug）。

当前可用子类型：

| slug | 说明 |
|------|------|
| `free-api` | 免费 API |
| `relays` | 中转站 |
| `proxy-nodes` | 代理节点 |
| `ai-apps` | AI 应用 |
| `tools` | 实用工具 |
| `learn` | 学习资源 |
| `free-server` | 免费服务器/VPS |
| `free-domain` | 免费域名 |
| `charity` | 公益站 |
| `invite-system` | 邀请码/激活码 - 系统软件 |
| `invite-professional` | 邀请码/激活码 - 专业应用 |
| `invite-mobile` | 邀请码/激活码 - 手机软件 |
| `invite-games` | 邀请码/激活码 - 游戏 |
| `invite-platform` | 邀请码/激活码 - 平台邀请 |

### 3.2 编辑 `src/data/curated.ts`

在 `curatedResources` 数组末尾追加一条新条目。**必须严格遵循 JSON 格式**（注意是对象字面量，不是字符串）。

**模板：**

```typescript
{
  "id": "ob-{subType}-{english-short-name}",
  "subType": "{slug}",           // 必须与 taxonomy.ts 中的 slug 一致
  "scenarios": [],               // 留空则自动使用子类型的默认场景
  "name": "资源名称",
  "url": "https://example.com",
  "type": "free",                // free | freemium | trial | paid
  "status": "ok",                // ok | unstable | unknown | dead
  "summary": "一句话简介，20-50 字，展示在卡片上",
  "description": "详细描述，100-300 字，展示在详情页",
  "tags": ["标签1", "标签2", "标签3"],
  "models": ["gpt", "claude"],   // API/中转类必填
  "pricing": "按量付费",         // 价格说明
  "register": "注册即用",         // 获取方式
  "pros": ["优点1", "优点2"],
  "cons": ["缺点1", "缺点2"],
  "tips": "使用建议",
  "updatedAt": "2026-08-01"
}
```

**字段规范：**

| 字段 | 必填 | 规范 |
|------|------|------|
| `id` | 是 | 全局唯一，格式 `ob-{subType}-{英文短名}`，全小写+连字符 |
| `subType` | 是 | 必须与 `taxonomy.ts` 中的子类型 slug 完全一致 |
| `name` | 是 | 简短直观，不超过 30 字 |
| `url` | 是 | 完整 URL，必须以 `https://` 开头 |
| `type` | 是 | 严格四选一 |
| `status` | 是 | 严格四选一，新增资源默认为 `ok` |
| `summary` | 是 | 20-50 字，卡片上直接展示，要让人一眼看懂这是什么 |
| `description` | 是 | 100-300 字，详情页展示，包含足够的上下文和注意事项 |
| `tags` | 是 | 至少 2 个，最多 8 个，用于搜索和筛选 |
| `updatedAt` | 否 | 格式 `YYYY-MM-DD`，建议填写 |

### 3.3 验证

```bash
npm run build
```

确保 TypeScript 编译通过且构建成功。

---

## 4. 添加新分类 / 子类型

编辑 `src/data/taxonomy.ts`，在对应数组中追加。

### 4.1 添加子类型

在 `subTypes` 数组末尾追加：

```typescript
{
  slug: 'new-category',
  name: { zh: '新分类', en: 'New Category', ja: '新カテゴリ' },
  icon: 'IconName',             // lucide-react 图标名（见下方说明）
  color: '#6366f1',             // 十六进制颜色，用于UI标识
  description: {
    zh: '中文描述',
    en: 'English description',
    ja: '日本語の説明',
  },
  sort: 10,                     // 排序权重，数字越小越靠前
}
```

**图标选择：** 在 [lucide-react](https://lucide.dev/icons) 中挑选，使用 PascalCase 名称（如 `Server`, `Globe`, `Heart`, `Sparkles`）。

### 4.2 添加场景

在 `scenarios` 数组末尾追加：

```typescript
{
  slug: 'new-scenario',
  name: { zh: '新场景', en: 'New Scenario', ja: '新シナリオ' },
  icon: 'Compass',
  color: '#22c55e',
  description: {
    zh: '中文描述',
    en: 'English description',
    ja: '日本語の説明',
  },
  sort: 5,
}
```

### 4.3 更新子类型 → 场景映射

在 `SUBTYPE_SCENARIOS` 对象中添加新子类型的默认场景映射：

```typescript
'new-category': ['newbie', 'developer'],
```

### 4.4 验证

```bash
npm run build
```

---

## 5. 标记资源已失效

### 5.1 确认死链

通过真实请求验证资源 URL 是否确实不可达（HTTP 5xx / 超时 / 域名转卖等）。

### 5.2 编辑 `src/data/blacklist.ts`

在 `BLACKLIST_HOSTS` 数组末尾追加死链的 host（域名，不含协议和路径）：

```typescript
'example.com',
'api.example.com',
```

### 5.3 同时在 `curated.ts` 中将该资源 status 改为 `dead`

找到对应资源条目，修改：

```typescript
"status": "dead",
"updatedAt": "2026-08-06"
```

### 5.4 验证

```bash
npm run build
```

---

## 6. 更新资源状态

当资源状态发生变化（如从 `ok` 变为 `unstable`），直接编辑 `src/data/curated.ts` 中对应条目：

```typescript
// 修改前
"status": "ok",
"updatedAt": "2026-06-28"

// 修改后
"status": "unstable",
"updatedAt": "2026-08-06"
```

**状态说明：**

| 状态 | 含义 | 何时使用 |
|------|------|----------|
| `ok` | 正常可用 | 实跳验证通过 |
| `unstable` | 不稳定 | 间歇性不可用，或存在已知问题 |
| `unknown` | 未知 | 新收录但尚未验证 |
| `dead` | 已失效 | 确认死链（需同时加入 blacklist.ts） |

---

## 7. 添加每周更新 / 账号动态

编辑 `src/data/weekly.ts`，在 `weeklyUpdates` 数组末尾追加：

```typescript
{
  id: 'unique-id',             // 唯一标识，简短英文
  date: '2026-08-06',          // 展示日期 YYYY-MM-DD
  kind: 'update',              // 'update' | 'account' | 'notice'
  title: {
    zh: '中文标题',
    en: 'English title',
    ja: '日本語タイトル',
  },
  desc: {
    zh: '中文描述（可选）',
    en: 'English description (optional)',
    ja: '日本語の説明（任意）',
  },
}
```

---

## 8. 添加翻译 / 文案

### 8.1 界面文案

编辑 `src/i18n/translations.ts`，找到对应 key 添加三语：

```typescript
'some.key': {
  zh: '中文',
  en: 'English',
  ja: '日本語',
},
```

### 8.2 分类/场景名

分类名、场景名使用 `LocalizedText` 类型，直接在 `taxonomy.ts` 中定义：

```typescript
name: { zh: '中文', en: 'English', ja: '日本語' },
```

---

## 9. 提交 PR 规范

### 分支命名

```
feature/add-xxx-resource    # 新增资源
fix/update-xxx-status       # 更新状态/修复
docs/update-contributing    # 文档更新
```

### 提交信息格式

```
类型(范围): 简短描述

- 细节1
- 细节2
```

类型：`feat` / `fix` / `docs` / `chore` / `refactor`

示例：

```
feat(data): add DeepSeek official free API

- 添加深度求索官方免费 API
- 已验证可用，status: ok
```

### PR 流程

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/add-xxx`
3. 提交变更：`git commit -m "feat(data): add xxx"`
4. 推送到 GitHub：`git push origin feature/add-xxx`
5. 创建 Pull Request，描述清楚：
   - 做了什么
   - 资源是否已验证
   - 关联的 Issue（如有）

---

## 10. AI 贡献者特别规范

> 以下规范适用于 AI 助手（如 ChatGPT、Claude、Copilot 等）操作本仓库。

### 10.1 必须遵守的原则

1. **先读后改**：修改任何文件前，先完整读取该文件内容。
2. **一次只做一件事**：一个 PR 只做一类变更（如：只添加资源，或只修改分类）。
3. **验证构建**：所有变更后必须执行 `npm run build`，确保无 TypeScript 错误。
4. **不修改不相关的文件**：只改需要改的文件，不碰其他代码。
5. **不添加注释/文档到源代码**：除非用户明确要求。

### 10.2 添加资源时的检查清单

- [ ] `id` 是否全局唯一？用 `grep` 检查 `curated.ts` 中无重复
- [ ] `subType` 是否与 `taxonomy.ts` 中的 slug 一致？
- [ ] `url` 是否以 `https://` 开头？
- [ ] `type` 是否严格四选一？
- [ ] `status` 是否严格四选一？
- [ ] `summary` 是否 20-50 字？
- [ ] `tags` 是否至少 2 个？
- [ ] `npm run build` 是否通过？

### 10.3 禁止的操作

- ❌ 修改 `package.json` 中的依赖版本
- ❌ 修改 `tsconfig.json` 编译配置
- ❌ 修改 `vite.config.ts` 构建配置
- ❌ 修改 `.github/workflows/` 下的 CI/CD 配置（除非明确要求）
- ❌ 删除或重命名已有资源的 `id`（会导致收藏/评论数据丢失）
- ❌ 批量添加未经验证的资源
- ❌ 修改 `src/lib/types.ts` 中的核心数据模型

### 10.4 处理不确定的情况

当不确定操作是否正确时，优先询问用户，而不是自行猜测。

---

## 附录：部署说明

### GitHub Pages

当前配置：**main 分支 /docs 目录**（legacy 模式）。

- 构建产物提交到 `docs/` 目录，GitHub Pages 自动从该目录提供服务
- 地址：https://intelvor.github.io/OpenBox/
- 每次推送 `main` 分支后，GitHub Actions 自动运行 CI 构建验证
- 无需额外部署步骤

### CI 工作流

`.github/workflows/ci.yml` 在每次推送/PR 时自动执行：
1. `npm install`
2. `tsc` 类型检查
3. `vite build` 构建
4. 验证 `docs/index.html` 存在

如果 CI 失败，检查：
- TypeScript 类型错误（最常见原因）
- 资源数据格式错误（如缺少必填字段）
- 依赖安装失败