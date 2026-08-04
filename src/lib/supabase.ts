import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? "";
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? "";

/**
 * 仅当配置了「真实」的 Supabase 凭证时才启用云端模式。
 * 仓库自带的 .env / .env.example 是占位符（your-project-id / your-anon-key-here），
 * 必须显式排除，否则 hasSupabase 会被误判为 true，导致每次加载都向无效主机发请求后回退。
 */
const isReal =
  supabaseUrl.startsWith("https://") &&
  !supabaseUrl.includes("your-project-id") &&
  supabaseAnonKey.length > 0 &&
  !supabaseAnonKey.includes("your-anon-key");

export const hasSupabase = isReal;

export const supabase: SupabaseClient | null = isReal
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * 认证功能总开关。
 * - true：显示登录/注册入口，用户需登录才能使用云端收藏等需身份的功能。
 * - false：隐藏登录入口，所有功能对匿名用户开放（当前默认；登录 UI 尚未构建）。
 *
 * 启用登录的前提：
 *   1) 在 Supabase 控制台 Authentication 开启登录提供商（邮箱/第三方）；
 *   2) 构建配套的登录/注册界面与会话管理（目前缺失，需另行开发）；
 *   3) 将本开关改为 true，并让收藏等模块在登录后读写 favorites 表。
 * profiles / favorites / reports 三张预留表已在 0001_init.sql 中建好，可直接使用。
 */
export const AUTH_ENABLED = true;
