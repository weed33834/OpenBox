-- get_site_report_count 函数：获取站点反馈数量（绕过 RLS）
-- DetailDrawer 需要显示某站点的总反馈数，但 RLS 限制用户只能看自己的报告。
-- 此函数以 SECURITY DEFINER 身份运行，只返回计数，不暴露具体报告内容。

CREATE OR REPLACE FUNCTION public.get_site_report_count(site_id_param TEXT)
RETURNS INTEGER
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM site_reports WHERE site_id = site_id_param;
$$;

GRANT EXECUTE ON FUNCTION public.get_site_report_count(TEXT) TO authenticated;
