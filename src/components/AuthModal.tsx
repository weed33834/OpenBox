import { useState, type FormEvent } from 'react';
import { useT } from '@/i18n/useI18n';
import { useAuthStore } from '@/store/useAuthStore';

// 登录 / 注册模态框。仅在 useAuthStore.showAuth 为 true 时渲染（由 NavBar 的登录按钮触发）。
export function AuthModal() {
  const t = useT();
  const show = useAuthStore((s) => s.showAuth);
  const mode = useAuthStore((s) => s.mode);
  const error = useAuthStore((s) => s.error);
  const loading = useAuthStore((s) => s.loading);
  const closeAuth = useAuthStore((s) => s.closeAuth);
  const setMode = useAuthStore((s) => s.setMode);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!show) return null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      useAuthStore.setState({ error: t('auth.needEmailPwd') });
      return;
    }
    if (mode === 'signin') void signIn(email, password);
    else void signUp(email, password);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={closeAuth}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {mode === 'signin' ? t('auth.signIn') : t('auth.signUp')}
          </h2>
          <button className="btn btn-ghost btn-sm" onClick={closeAuth} aria-label="close">
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--color-muted)]">{t('auth.email')}</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--color-muted)]">{t('auth.password')}</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button className="btn btn-primary w-full" type="submit" disabled={loading}>
            {loading ? t('common.loading') : mode === 'signin' ? t('auth.signIn') : t('auth.signUp')}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-[var(--color-muted)]">
          {mode === 'signin' ? (
            <button className="text-[var(--color-primary)] hover:underline" onClick={() => setMode('signup')}>
              {t('auth.toSignUp')}
            </button>
          ) : (
            <button className="text-[var(--color-primary)] hover:underline" onClick={() => setMode('signin')}>
              {t('auth.toSignIn')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
