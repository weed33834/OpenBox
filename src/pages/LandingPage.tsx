import { useT } from '@/i18n/useI18n';
import { navigate } from '@/hooks/useHashRoute';
import { LangSwitcher } from '@/components/LangSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Icon } from '@/components/Icon';

export function LandingPage() {
  const t = useT();
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 text-center">
      {/* 极简背景：柔和径向渐变 + 网格 */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60rem 40rem at 50% 35%, var(--color-primary-soft), transparent 70%), var(--color-bg)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(var(--color-fg) 1px, transparent 1px), linear-gradient(90deg, var(--color-fg) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* 右上角极简控件 */}
      <div className="absolute right-4 top-4 flex items-center gap-1.5">
        <LangSwitcher />
        <ThemeToggle />
      </div>

      <div className="route-fade flex flex-col items-center">
        {/* 标记 */}
        <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-primary-fg)] shadow-[var(--shadow-card)]">
          <span className="text-3xl font-black">O</span>
        </span>

        <h1 className="text-4xl font-black tracking-tight text-[var(--color-fg)] sm:text-6xl">OpenBox</h1>

        <p className="mx-auto mt-4 max-w-md text-base text-[var(--color-muted)] sm:text-lg">{t('landing.slogan')}</p>

        <button
          className="btn btn-primary mt-9 px-10 py-3 text-base"
          onClick={() => navigate('/home')}
        >
          {t('landing.enter')}
          <Icon name="ChevronRight" size={18} />
        </button>

        <p className="mt-5 text-xs text-[var(--color-muted)]">{t('landing.hint')}</p>
      </div>

      <footer className="absolute bottom-5 text-xs text-[var(--color-muted)]">{t('footer.tagline')}</footer>
    </div>
  );
}
