-- ============================================================
-- OpenBox —— 资源留言/评论区（参考 baipiao 社区 BBS 的轻量落地）
-- 用法：在 Supabase 控制台 SQL Editor 执行一次即可。
-- 说明：匿名可留言（带昵称）；RLS 允许 anon 读写，前端用 localStorage 兜底。
-- ============================================================

create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  resource_id text not null,
  content     text not null check (char_length(content) <= 500),
  nickname    text default '匿名',
  created_at  timestamptz default now()
);

create index if not exists idx_comments_resource
  on public.comments (resource_id, created_at desc);

alter table public.comments enable row level security;

-- 任何人（含匿名）可留言
drop policy if exists "comments_insert_anon" on public.comments;
create policy "comments_insert_anon" on public.comments for insert with check (true);

-- 任何人可读留言
drop policy if exists "comments_read" on public.comments;
create policy "comments_read" on public.comments for select using (true);
