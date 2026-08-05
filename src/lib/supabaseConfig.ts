// 公开的 Supabase 连接配置（anon key 设计上可公开，受 RLS 保护，可安全提交到仓库）。
//
// 为什么写在这里而不是 .env：
//   静态站点（GitHub Pages）构建时不会打包 .env（被 gitignore），导致线上产物拿不到凭证、
//   登录/收藏/反馈等云端功能全部失效。把公开 anon key 直接写进源码，保证「提交到 main 的
//   构建产物」也能启用云端功能。本地开发仍可用 .env 的 VITE_SUPABASE_* 覆盖本文件。
//
// ⚠️ 切勿在此写入 service_role / secret key —— 那等于把数据库管理权公开给所有人。
export const SUPABASE_URL = "https://eqnvxhmfleoijscyhchx.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_ZCqkpQfkwv2fo9X_kmM_mQ_wBx4_j9l";
