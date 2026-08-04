-- ============================================================
-- OpenBox 统一导航站 —— 数据库初始化（v2）
-- 用法：在 Supabase 控制台 SQL Editor 执行一次即可。
-- 设计要点：
--   1) 资源主数据由前端本地种子 src/data/seed.ts 提供（离线可渲染、无需联网）。
--   2) Supabase 在本项目中承担「社区投稿审核库」：游客提交 -> submissions(pending)
--      -> 管理员在后台 approve -> 已通过投稿合并进站点列表。
--   3) profiles / favorites / reports 为「未来登录」预留，当前 AUTH_ENABLED=false 时不使用，
--      待登录功能上线（需另建 auth UI）后再启用。
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- 分类（当前由代码 src/data/taxonomy.ts 提供，本表为可选权威来源）----------
create table if not exists public.categories (
  slug        text primary key,
  name        text not null,
  name_en     text,
  icon        text,
  color       text,
  description text,
  sort        integer default 0
);

-- ---------- 资源（云端可编辑来源；当前前端默认仍用本地种子）----------
create table if not exists public.resources (
  id          text primary key,
  subType     text not null default '',
  scenarios   text[] default '{}',
  name        text not null,
  url         text not null,
  type        text not null default 'free'
                check (type in ('free','freemium','trial','paid')),
  status      text not null default 'unknown'
                check (status in ('ok','unstable','unknown','dead')),
  summary     text default '',
  description text default '',
  tags        text[] default '{}',
  models      text[] default '{}',
  protocols   text[] default '{}',
  region      text,
  pricing     text,
  register    text,
  pros        text[] default '{}',
  cons        text[] default '{}',
  tips        text,
  official    boolean default false,
  featured    boolean default false,
  popularity  integer default 0,
  updated_at  timestamptz default now()
);

create index if not exists idx_resources_subtype on public.resources(subType);
create index if not exists idx_resources_featured on public.resources(featured);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_resources_updated on public.resources;
create trigger trg_resources_updated
  before update on public.resources
  for each row execute function public.set_updated_at();

-- ---------- 社区投稿（核心：游客提交、管理员审核）----------
create table if not exists public.submissions (
  id          uuid primary key default gen_random_uuid(),
  subType     text not null,
  name        text not null,
  url         text not null,
  type        text not null default 'free',
  summary     text not null,
  description text,
  submitter   text,
  status      text not null default 'pending'
                check (status in ('pending','approved','rejected')),
  created_at  timestamptz default now()
);

create index if not exists idx_submissions_status on public.submissions(status);

-- 修复旧表结构：此前部分执行的残留表可能缺少 subType 列
alter table public.submissions add column if not exists subType text not null default 'free-api';
alter table public.submissions add column if not exists scenarios text[] default '{}';
alter table public.submissions alter column subType drop default;

-- ---------- 用户资料（未来登录预留）----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text,
  created_at timestamptz default now()
);

-- ---------- 收藏（未来登录预留，关联 auth.users）----------
create table if not exists public.favorites (
  user_id     uuid references auth.users(id) on delete cascade,
  resource_id text,
  created_at  timestamptz default now(),
  primary key (user_id, resource_id)
);

-- ---------- 举报（未来登录预留）----------
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  resource_id text,
  reason      text,
  reporter    uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now()
);

-- ============================================================
-- 行级安全 (RLS)
-- ============================================================
alter table public.categories enable row level security;
alter table public.resources  enable row level security;
alter table public.submissions enable row level security;
alter table public.profiles   enable row level security;
alter table public.favorites  enable row level security;
alter table public.reports    enable row level security;

-- 分类：公开可读
drop policy if exists "categories_read" on public.categories;
create policy "categories_read" on public.categories for select using (true);

-- 资源：公开可读（云端可编辑来源；写权限留给未来服务端/管理员）
drop policy if exists "resources_read" on public.resources;
create policy "resources_read"  on public.resources for select using (true);

-- 投稿：
--   任何人（含匿名 anon key）可插入 -> 进入审核队列
drop policy if exists "submissions_insert" on public.submissions;
create policy "submissions_insert" on public.submissions for insert with check (true);
--   匿名用户仅可读取「已通过」的投稿（前端据此展示社区资源）
drop policy if exists "submissions_read_public" on public.submissions;
create policy "submissions_read_public" on public.submissions for select using (status = 'approved');
--   登录用户可读取全部投稿（用于后台审核）
drop policy if exists "submissions_read_auth" on public.submissions;
create policy "submissions_read_auth" on public.submissions for select to authenticated using (true);

-- 资料：用户仅访问/修改自己（未来登录）
drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read"   on public.profiles for select using (true);
drop policy if exists "profiles_upsert" on public.profiles;
create policy "profiles_upsert" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- 收藏：用户仅操作自己（未来登录）
drop policy if exists "favorites_all" on public.favorites;
create policy "favorites_all" on public.favorites for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 举报：任何登录用户可提交（未来登录）
drop policy if exists "reports_insert" on public.reports;
create policy "reports_insert" on public.reports for insert to authenticated with check (true);
drop policy if exists "reports_read" on public.reports;
create policy "reports_read"   on public.reports for select to authenticated using (true);
-- 匿名用户也可提交反馈报告（资源失效/链接错误等无需登录即可上报）
drop policy if exists "reports_insert_anon" on public.reports;
create policy "reports_insert_anon" on public.reports for insert with check (true);
