/** 邮箱格式校验 */
export function isEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}

/** 将 Supabase 错误映射为用户可读的友好提示 */
export function mapAuthError(
  err: { message?: string; status?: number },
  t: (k: string, vars?: Record<string, string | number>) => string,
): string {
  const m = err.message?.toLowerCase() ?? "";
  if (
    m.includes("already registered") ||
    m.includes("already been registered") ||
    m.includes("user already registered")
  ) {
    return t("auth.emailExists");
  }
  if (
    m.includes("invalid login") ||
    m.includes("invalid credentials") ||
    m.includes("wrong password") ||
    m.includes("invalid email or password")
  ) {
    return t("auth.invalidCredentials");
  }
  if (
    m.includes("rate") ||
    m.includes("too many") ||
    m.includes("limit") ||
    err.status === 429
  )
    return t("auth.rateLimited");
  if (
    m.includes("network") ||
    m.includes("timeout") ||
    m.includes("fetch") ||
    m.includes("unreachable") ||
    m.includes("econnrefused")
  )
    return t("auth.networkError");
  return err.message || t("auth.unexpectedError");
}

/** 将 Supabase 数据库操作错误映射为用户可读提示 */
export function mapDbError(
  err: { message?: string },
  t: (k: string, vars?: Record<string, string | number>) => string,
): string {
  const msg = err.message?.toLowerCase() ?? "";
  if (
    msg.includes("could not find the table") ||
    msg.includes("schema cache") ||
    msg.includes("does not exist")
  ) {
    return t("report.tableMissing");
  }
  if (
    msg.includes("network") ||
    msg.includes("timeout") ||
    msg.includes("fetch")
  ) {
    return t("auth.networkError");
  }
  return err.message || t("auth.unexpectedError");
}
