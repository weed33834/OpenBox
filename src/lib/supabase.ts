import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const hasSupabase = !!(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = hasSupabase
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * 认证功能总开关。
 * - true：显示登录/注册入口，用户需登录才能查看站点详情。
 * - false：隐藏登录入口，所有功能对匿名用户开放。
 */
export const AUTH_ENABLED = false;
