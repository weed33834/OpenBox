import { useState, useEffect, useRef, type FormEvent } from "react";
import { supabase, hasSupabase, AUTH_ENABLED } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { useT } from "@/i18n/useI18n";
import { isEmail, mapAuthError } from "@/lib/auth-utils";
import {
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import PasswordInput from "@/components/PasswordInput";

type Mode = "login" | "register";

export default function AuthModal() {
  const showAuthModal = useAuthStore((s) => s.showAuthModal);
  const closeAuthModal = useAuthStore((s) => s.closeAuthModal);
  const passwordRecovery = useAuthStore((s) => s.passwordRecovery);
  const setPasswordRecovery = useAuthStore((s) => s.setPasswordRecovery);
  const t = useT();

  const [mode, setMode] = useState<Mode>("login");
  const [resetMode, setResetMode] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [slowHint, setSlowHint] = useState(false);

  const firstInputRef = useRef<HTMLInputElement>(null);

  // Reset on modal close
  useEffect(() => {
    if (!showAuthModal) {
      setMode("login");
      setResetMode(false);
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirm("");
      setNewPassword("");
      setConfirmNewPassword("");
      setError("");
      setInfo("");
      setSlowHint(false);
    }
  }, [showAuthModal]);

  // Focus first input when modal opens or mode switches
  useEffect(() => {
    if (showAuthModal) {
      const id = setTimeout(() => firstInputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [showAuthModal, mode]);

  // Slow response hint
  useEffect(() => {
    if (!submitting) {
      setSlowHint(false);
      return;
    }
    const id = setTimeout(() => setSlowHint(true), 10000);
    return () => clearTimeout(id);
  }, [submitting]);

  if (!AUTH_ENABLED) return null;
  if (!showAuthModal) return null;

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
    setInfo("");
  };

  // 用户开始编辑任何字段时，自动清除旧错误/成功提示
  const clearHints = () => {
    if (error) setError("");
    if (info) setInfo("");
  };

  // Real-time password match feedback (only when confirm has content)
  const passwordMismatch =
    mode === "register" && confirm.length > 0 && password !== confirm;

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !isEmail(trimmedEmail)) {
      setError(t("auth.invalidEmail"));
      return;
    }
    if (password.length < 6) {
      setError(t("auth.invalidPassword"));
      return;
    }
    if (!hasSupabase || !supabase) {
      setError(t("auth.unavailable"));
      return;
    }
    setSubmitting(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (err) {
        setError(mapAuthError(err, t));
      } else {
        closeAuthModal();
      }
    } catch {
      setError(t("auth.networkError"));
    }
    setSubmitting(false);
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    const trimmedEmail = email.trim();
    const trimmedName = username.trim();
    if (trimmedName.length < 2) {
      setError(t("auth.invalidUsername"));
      return;
    }
    if (!trimmedEmail || !isEmail(trimmedEmail)) {
      setError(t("auth.invalidEmail"));
      return;
    }
    if (password.length < 6) {
      setError(t("auth.invalidPassword"));
      return;
    }
    if (password !== confirm) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    if (!hasSupabase || !supabase) {
      setError(t("auth.unavailable"));
      return;
    }
    setSubmitting(true);
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: { data: { username: trimmedName } },
      });
      if (err) {
        setError(mapAuthError(err, t));
      } else if (data.session) {
        // Supabase 关闭了邮箱确认 → 注册即登录
        setInfo(t("auth.registerSuccess"));
        // 延迟关闭，让用户看到成功提示
        setTimeout(() => closeAuthModal(), 1500);
      } else {
        // 后端仍要求邮箱确认：提示用户去登录
        setInfo(t("auth.registerDoneLogin"));
        setMode("login");
        setConfirm("");
      }
    } catch {
      setError(t("auth.networkError"));
    }
    setSubmitting(false);
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !isEmail(trimmedEmail)) {
      setError(t("auth.invalidEmail"));
      return;
    }
    if (!hasSupabase || !supabase) {
      setError(t("auth.unavailable"));
      return;
    }
    setSubmitting(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(
        trimmedEmail,
        {
          redirectTo: window.location.origin + window.location.pathname,
        },
      );
      if (err) {
        setError(mapAuthError(err, t));
      } else {
        setInfo(t("auth.resetSent"));
      }
    } catch {
      setError(t("auth.networkError"));
    }
    setSubmitting(false);
  };

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (newPassword.length < 6) {
      setError(t("auth.invalidPassword"));
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    if (!hasSupabase || !supabase) {
      setError(t("auth.unavailable"));
      return;
    }
    setSubmitting(true);
    try {
      const { error: err } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (err) {
        setError(mapAuthError(err, t));
      } else {
        // 密码更新成功，退出恢复模式，提示用户重新登录
        setInfo(t("auth.passwordUpdated"));
        setPasswordRecovery(false);
        // 退出当前恢复会话
        await supabase.auth.signOut();
        setMode("login");
        setTimeout(() => closeAuthModal(), 2000);
      }
    } catch {
      setError(t("auth.networkError"));
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        onClick={closeAuthModal}
        className="absolute inset-0 bg-cyber-bg/80 backdrop-blur-sm"
        aria-label={t("drawer.close")}
      />

      <div className="relative w-full max-w-sm rounded-2xl border border-cyber-border bg-cyber-surface p-6 shadow-2xl animate-slide-up">
        <button
          onClick={closeAuthModal}
          className="absolute right-4 top-4 rounded-lg p-1 text-cyber-muted transition-colors hover:text-cyber-text"
          aria-label={t("drawer.close")}
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="mb-1 font-display text-xl font-bold text-cyber-text">
          {passwordRecovery
            ? t("auth.updatePassword")
            : resetMode
              ? t("auth.resetPassword")
              : mode === "login"
                ? t("auth.loginTitle")
                : t("auth.registerTitle")}
        </h2>
        <p className="mb-5 text-sm text-cyber-muted">
          {passwordRecovery
            ? t("auth.updatePasswordDesc")
            : resetMode
              ? t("auth.forgotPassword")
              : mode === "login"
                ? t("auth.loginDesc")
                : t("auth.registerDesc")}
        </p>

        {/* Success hint */}
        {info && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-cyber-live/30 bg-cyber-live/10 px-3 py-2 text-sm text-cyber-live">
            <CheckCircle2 className="h-4 w-4 shrink-0 animate-pulse" />
            <span>{info}</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-cyber-dead/30 bg-cyber-dead/10 px-3 py-2 text-sm text-cyber-dead">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {passwordRecovery ? (
          <form onSubmit={handleUpdatePassword} className="space-y-3">
            {/* 新密码 */}
            <PasswordInput
              ref={firstInputRef}
              value={newPassword}
              onChange={(v) => {
                setNewPassword(v);
                clearHints();
              }}
              placeholder={t("auth.passwordPlaceholder")}
              label={t("auth.newPasswordLabel")}
              autoComplete="new-password"
            />
            {/* 确认新密码 */}
            <PasswordInput
              value={confirmNewPassword}
              onChange={(v) => {
                setConfirmNewPassword(v);
                clearHints();
              }}
              placeholder={t("auth.confirmPasswordPlaceholder")}
              label={t("auth.confirmNewPasswordLabel")}
              autoComplete="new-password"
              mismatch={
                confirmNewPassword.length > 0 &&
                newPassword !== confirmNewPassword
              }
            />
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyber-cyan py-2.5 text-sm font-semibold text-cyber-bg transition-all hover:shadow-glow-cyan disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? t("auth.submitting") : t("auth.updateBtn")}
            </button>
          </form>
        ) : resetMode ? (
          <form onSubmit={handleResetPassword} className="space-y-3">
            {/* 邮箱输入框 */}
            <div>
              <label className="mb-1.5 block font-mono text-[11px] text-cyber-muted">
                {t("auth.emailLabel")}
              </label>
              <input
                ref={firstInputRef}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearHints();
                }}
                placeholder={t("auth.emailPlaceholder")}
                className="w-full rounded-lg border border-cyber-border bg-cyber-bg px-3 py-2 text-sm text-cyber-text placeholder:text-cyber-muted/50 focus:border-cyber-cyan/50 focus:outline-none"
                autoComplete="email"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyber-cyan py-2.5 text-sm font-semibold text-cyber-bg transition-all hover:shadow-glow-cyan disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? t("auth.submitting") : t("auth.resetPassword")}
            </button>
            <button
              type="button"
              onClick={() => {
                setResetMode(false);
                setError("");
                setInfo("");
              }}
              className="w-full text-xs text-cyber-cyan transition-colors hover:text-cyber-cyan/80"
            >
              {t("auth.switchToLogin")}
            </button>
          </form>
        ) : mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="mb-1.5 block font-mono text-[11px] text-cyber-muted">
                {t("auth.emailLabel")}
              </label>
              <input
                ref={firstInputRef}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearHints();
                }}
                placeholder={t("auth.emailPlaceholder")}
                className="w-full rounded-lg border border-cyber-border bg-cyber-bg px-3 py-2 text-sm text-cyber-text placeholder:text-cyber-muted/50 focus:border-cyber-cyan/50 focus:outline-none"
                autoComplete="email"
              />
            </div>
            <PasswordInput
              value={password}
              onChange={(v) => {
                setPassword(v);
                clearHints();
              }}
              placeholder={t("auth.passwordPlaceholder")}
              label={t("auth.passwordLabel")}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => {
                setResetMode(true);
                setError("");
                setInfo("");
              }}
              className="text-right text-xs text-cyber-muted transition-colors hover:text-cyber-cyan"
            >
              {t("auth.forgotPassword")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyber-cyan py-2.5 text-sm font-semibold text-cyber-bg transition-all hover:shadow-glow-cyan disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? t("auth.submitting") : t("auth.loginBtn")}
            </button>
            {submitting && slowHint && (
              <p className="flex items-center justify-center gap-1.5 text-xs text-cyber-amber">
                <Clock className="h-3.5 w-3.5" />
                {t("auth.slowHint")}
              </p>
            )}
            <button
              type="button"
              onClick={() => switchMode("register")}
              className="w-full text-xs text-cyber-cyan transition-colors hover:text-cyber-cyan/80"
            >
              {t("auth.switchToRegister")}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="mb-1.5 block font-mono text-[11px] text-cyber-muted">
                {t("auth.usernameLabel")}
              </label>
              <input
                ref={firstInputRef}
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  clearHints();
                }}
                placeholder={t("auth.usernamePlaceholder")}
                className="w-full rounded-lg border border-cyber-border bg-cyber-bg px-3 py-2 text-sm text-cyber-text placeholder:text-cyber-muted/50 focus:border-cyber-cyan/50 focus:outline-none"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[11px] text-cyber-muted">
                {t("auth.emailLabel")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearHints();
                }}
                placeholder={t("auth.emailPlaceholder")}
                className="w-full rounded-lg border border-cyber-border bg-cyber-bg px-3 py-2 text-sm text-cyber-text placeholder:text-cyber-muted/50 focus:border-cyber-cyan/50 focus:outline-none"
                autoComplete="email"
              />
            </div>
            <PasswordInput
              value={password}
              onChange={(v) => {
                setPassword(v);
                clearHints();
              }}
              placeholder={t("auth.passwordPlaceholder")}
              label={t("auth.passwordLabel")}
              autoComplete="new-password"
            />
            <div>
              <PasswordInput
                value={confirm}
                onChange={(v) => {
                  setConfirm(v);
                  clearHints();
                }}
                placeholder={t("auth.confirmPasswordPlaceholder")}
                label={t("auth.confirmPasswordLabel")}
                autoComplete="new-password"
                mismatch={passwordMismatch}
              />
              {passwordMismatch && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-cyber-dead">
                  <AlertTriangle className="h-3 w-3" />
                  {t("auth.passwordMismatch")}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyber-cyan py-2.5 text-sm font-semibold text-cyber-bg transition-all hover:shadow-glow-cyan disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? t("auth.submitting") : t("auth.registerBtn")}
            </button>
            {submitting && slowHint && (
              <p className="flex items-center justify-center gap-1.5 text-xs text-cyber-amber">
                <Clock className="h-3.5 w-3.5" />
                {t("auth.slowHint")}
              </p>
            )}
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="w-full text-xs text-cyber-cyan transition-colors hover:text-cyber-cyan/80"
            >
              {t("auth.switchToLogin")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
