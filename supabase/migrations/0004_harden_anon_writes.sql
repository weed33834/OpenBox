-- ============================================================
-- OpenBox —— 匿名写接口温和加固（0004）
--
-- 背景：0001-0003 中 verifications / comments / submissions / reports
--       的 insert policy 均为 with check(true)，且 created_at 可由客户端
--       任意指定，存在「伪造验证时间 / 超长昵称撑库」等滥用空间。
--
-- 本次加固不改变「匿名可投票 / 可留言 / 可投稿 / 可反馈」的产品设计，
-- 仅做三件保守的事：
--   1) 服务端强制 created_at = now()，客户端传的时间一律覆盖（防时间造假）；
--   2) 评论昵称加长度上限（防超长文本撑库）；
--   3) 评论内容必须非空（配合已有的 500 字符上限）。
--
-- 用法：在 Supabase 控制台 SQL Editor 执行一次即可（幂等，可重复执行）。
-- ============================================================

-- ---------- 1) 强制 created_at 由服务端写入 ----------
create or replace function public.force_created_at()
returns trigger language plpgsql as $$
begin
  new.created_at = now();
  return new;
end;
$$;

drop trigger if exists trg_verifications_created_at on public.verifications;
create trigger trg_verifications_created_at
  before insert on public.verifications
  for each row execute function public.force_created_at();

drop trigger if exists trg_comments_created_at on public.comments;
create trigger trg_comments_created_at
  before insert on public.comments
  for each row execute function public.force_created_at();

drop trigger if exists trg_submissions_created_at on public.submissions;
create trigger trg_submissions_created_at
  before insert on public.submissions
  for each row execute function public.force_created_at();

drop trigger if exists trg_reports_created_at on public.reports;
create trigger trg_reports_created_at
  before insert on public.reports
  for each row execute function public.force_created_at();

-- ---------- 2) 评论：昵称长度上限 + 内容非空 ----------
alter table public.comments
  drop constraint if exists comments_nickname_len_check;
alter table public.comments
  add constraint comments_nickname_len_check check (char_length(nickname) <= 30);

alter table public.comments
  drop constraint if exists comments_content_not_empty;
alter table public.comments
  add constraint comments_content_not_empty check (btrim(content) <> '');
