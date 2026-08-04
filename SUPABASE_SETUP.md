# OpenBox × Supabase 接入指南

本指南说明如何为 OpenBox 启用后端能力。当前后端承担 **「社区投稿审核库」** 职责：
游客在前端提交资源 → 进入 `submissions` 表（pending）→ 你在后台审核通过（approved）→ 该资源自动合并进站点列表。

> 资源主数据仍由前端本地 `src/data/seed.ts` 提供（离线可渲染）。Supabase 不存储主资源库，因此**无需先做数据迁移**，建库即用。

---

## 一、创建 Supabase 项目

1. 打开 https://supabase.com ，登录后 **New Project**。
2. 填项目名称（如 `openbox`）、设置数据库密码（请妥善保存），区域选离用户近的。
3. 等待项目初始化完成（约 1 分钟）。

## 二、初始化数据库

1. 进入项目控制台 → **SQL Editor** → **New query**。
2. 将本仓库 `supabase/migrations/0001_init.sql` 的全部内容粘贴进去。
3. 点击 **Run** 执行。看到 `Success` 即完成建表与 RLS 策略。

表结构说明：
- `submissions`：社区投稿（核心）。匿名可插入、匿名仅可读 `approved`、登录用户可读全部（用于审核）。
- `resources` / `categories`：云端可编辑资源来源（预留，当前前端默认用本地种子）。
- `profiles` / `favorites` / `reports`：登录功能预留，当前 `AUTH_ENABLED=false` 时不使用。

## 三、获取前端密钥

1. 项目控制台 → **Project Settings** → **API**。
2. 复制两样：
   - **Project URL**（形如 `https://xxxx.supabase.co`）
   - **anon public key**（以 `eyJ` 开头的较长字符串）
3. 打开仓库根目录 `.env`（部署平台则填对应的环境变量），填入：

```env
VITE_SUPABASE_URL=https://你的-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=你的-anon-key
```

> ⚠️ `.env` 已被 `.gitignore` 忽略，真实密钥不会进版本库。anon key 本就设计为可公开（受 RLS 保护），但请勿误填 service_role key（那会绕过 RLS，极其危险）。

## 四、审核投稿（日常运营）

1. 前端任意访问者通过「投稿」页提交资源，数据落入 `submissions`（`status=pending`）。
2. 你在 Supabase 控制台 → **Table Editor** → `submissions`，找到新行：
   - 确认内容合规后，将 `status` 改为 `approved` → 该资源立即出现在站点对应分类下（标记为「社区投稿」）。
   - 不合规则改 `rejected`（前端不会展示）。
3. 也可用 SQL 批量审核：
   ```sql
   update public.submissions set status = 'approved' where id = '待审核的-uuid';
   ```

## 五、部署时注入环境变量

本前端是纯静态 SPA，可部署到任意静态托管（GitHub Pages / Vercel / Netlify / Cloudflare Pages）。
部署平台的环境变量设置处需填入上面两个 `VITE_` 变量（构建时注入）。**未填则自动回退本地模式**，不影响上线。

## 六、启用登录 / 云端收藏（已内置，按需开启）

登录与云端收藏功能**已在代码中实现**（`AUTH_ENABLED = true`），但仅在「同时配置了 Supabase 凭证」时前端才显示登录入口——未配置则自动隐藏，不影响纯静态运行。

启用步骤：
1. 在 Supabase 控制台 → **Authentication** → **Providers**，确认 **Email** 已启用（默认开启）。
   - 若想免去邮箱确认直接体验，可在 **Auth → Providers → Email** 关闭「Confirm email」（仅建议测试环境）。
   - 也可在此开启 GitHub / Google 等第三方登录（需对应 OAuth 凭据）。
2. 确保 `.env` 已填入 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_ANON_KEY`（见第三节）。
3. 重新构建并部署。顶部栏会出现「登录」按钮；注册/登录后：
   - **云端收藏**：点收藏时自动写入 `favorites` 表，登录成功时本地收藏会与云端合并（并集），实现跨设备同步。
   - **会话持久化**：Supabase Auth 自带 localStorage 会话，刷新/重开无需重新登录。
4. 审核投稿、管理用户：在 Supabase 控制台 → **Table Editor**（`submissions`）、**Authentication → Users**。

`profiles` / `favorites` / `reports` 三张预留表已在 `0001_init.sql` 中建好并配置 RLS，可直接使用。
