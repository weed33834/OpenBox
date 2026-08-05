-- ============================================================
-- OpenBox —— 社区验证投票表（参考 baipiao「还能不能薅」）
-- 用法：在 Supabase 控制台 SQL Editor 执行一次即可。
-- 说明：匿名用户也可投票（无需登录），前端用 localStorage 防本设备重复投；
--       统计通过 resource_id 聚合，驱动卡片/详情页的「N 人验证 · 最近验证」。
-- ============================================================

create table if not exists public.verifications (
  id          uuid primary key default gen_random_uuid(),
  resource_id text not null,
  result      text not null check (result in ('ok','dead')),
  created_at  timestamptz default now()
);

create index if not exists idx_verifications_resource
  on public.verifications (resource_id, created_at desc);

alter table public.verifications enable row level security;

-- 任何人（含匿名 anon key）可投票
drop policy if exists "verifications_insert_anon" on public.verifications;
create policy "verifications_insert_anon" on public.verifications for insert with check (true);

-- 任何人可读统计（聚合用）
drop policy if exists "verifications_read" on public.verifications;
create policy "verifications_read" on public.verifications for select using (true);
