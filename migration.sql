-- ============================================================
-- FreeAPI 完整数据库迁移脚本（幂等，可重复执行）
-- 在 Supabase Dashboard → SQL Editor 中运行
-- https://app.supabase.com/project/_/sql
-- ============================================================

-- ============================================================
-- 1. profiles 表：用户档案（用户名、邮箱）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username   TEXT UNIQUE NOT NULL,
  email      TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. 自动创建用户档案的触发器
--    注册时 auth.users 插入新行 → 自动在 profiles 插入对应行
--    这是修复 "Database error saving new user" 的关键
-- ============================================================

-- 先删除可能存在的旧触发器和函数（修复坏掉的旧版本）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 创建正确的触发器函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 绑定触发器：用户注册后自动执行
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 3. RLS 行级安全策略
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 用户只能创建自己的档案（触发器以 SECURITY DEFINER 身份运行，不受 RLS 限制）
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
CREATE POLICY "Users can create their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 所有人都可读取 profiles（用于用户名查找）
DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;
CREATE POLICY "Profiles are publicly readable"
  ON public.profiles
  FOR SELECT
  USING (true);

-- 用户只能更新自己的档案
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================
-- 4. site_reports 表：用户反馈/报错
-- ============================================================
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

-- ============================================================
-- 5. get_site_report_count 函数：获取站点反馈数量（绕过 RLS）
--    DetailDrawer 需要显示某站点的总反馈数，但 RLS 限制用户只能看自己的报告。
--    此函数以 SECURITY DEFINER 身份运行，只返回计数，不暴露具体报告内容。
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_site_report_count(site_id_param TEXT)
RETURNS INTEGER
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM site_reports WHERE site_id = site_id_param;
$$;

GRANT EXECUTE ON FUNCTION public.get_site_report_count(TEXT) TO authenticated;

-- ============================================================
-- 6. user_favorites 表：用户收藏（跨设备同步）
-- ============================================================
CREATE TABLE IF NOT EXISTS user_favorites (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, site_id)
);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own favorites" ON user_favorites;
CREATE POLICY "Users can manage own favorites"
  ON user_favorites FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
