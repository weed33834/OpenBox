-- 用户反馈/报错表
CREATE TABLE IF NOT EXISTS site_reports (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site_id TEXT NOT NULL,
  issue_type TEXT NOT NULL CHECK (issue_type IN ('down', 'ssl', 'hijacked', 'wrong_info', 'other')),
  description TEXT NOT NULL DEFAULT '',
  reporter_email TEXT,
  reporter_contact TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS site_reports_updated_at ON site_reports;
CREATE TRIGGER site_reports_updated_at
  BEFORE UPDATE ON site_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS：已登录用户可插入
ALTER TABLE site_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth users can insert reports" ON site_reports;
CREATE POLICY "auth users can insert reports"
  ON site_reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "auth users can read own reports" ON site_reports;
CREATE POLICY "auth users can read own reports"
  ON site_reports FOR SELECT
  TO authenticated
  USING (reporter_email = (SELECT email FROM auth.users WHERE id = auth.uid()));
