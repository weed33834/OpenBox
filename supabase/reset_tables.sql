-- 彻底重置：删掉旧表，重新建
DROP TABLE IF EXISTS public.submissions CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;

CREATE TABLE public.submissions (
  id          uuid primary key default gen_random_uuid(),
  "subType"   text not null,
  name        text not null,
  url         text not null,
  type        text not null default 'free',
  summary     text not null,
  description text,
  submitter   text,
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at  timestamptz default now()
);

CREATE TABLE public.reports (
  id          uuid primary key default gen_random_uuid(),
  resource_id text,
  reason      text,
  reporter    uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now()
);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "submissions_insert" ON public.submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "submissions_read_public" ON public.submissions FOR SELECT USING (status = 'approved');
CREATE POLICY "submissions_read_auth" ON public.submissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "reports_insert_anon" ON public.reports FOR INSERT WITH CHECK (true);
CREATE POLICY "reports_read_auth" ON public.reports FOR SELECT TO authenticated USING (true);
