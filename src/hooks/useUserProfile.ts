import type { User } from "@supabase/supabase-js";

/**
 * 从 Supabase User 对象统一提取展示信息（头像、邮箱、用户名、登录方式）。
 * 消除 UserMenu / Profile / AuthModal 中重复的推导逻辑。
 */
export function deriveUserDisplay(user: User) {
  const meta = user.user_metadata ?? {};
  const avatarUrl = meta.avatar_url as string | undefined;
  const email = user.email ?? "";
  const username =
    (meta.username as string) ||
    (meta.user_name as string) ||
    (meta.full_name as string) ||
    email.split("@")[0] ||
    "User";

  const provider = user.app_metadata?.provider as string | undefined;
  const isOAuth = !!provider && provider !== "email";

  return { avatarUrl, email, username, provider, isOAuth };
}
