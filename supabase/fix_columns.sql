-- 修复列名大小写 + 反馈权限（单独执行这段即可）
-- 1. 投稿表：添加驼峰列名
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS "subType" text;
UPDATE public.submissions SET "subType" = 'free-api' WHERE "subType" IS NULL;
ALTER TABLE public.submissions ALTER COLUMN "subType" SET NOT NULL;

-- 2. 反馈表：重建匿名插入策略
DROP POLICY IF EXISTS "reports_insert_anon" ON public.reports;
CREATE POLICY "reports_insert_anon" ON public.reports FOR INSERT WITH CHECK (true);
