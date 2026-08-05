import { useT } from '@/i18n/useI18n';
import { useHashRoute, navigate, type RouteName } from '@/hooks/useHashRoute';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { LangSwitcher } from './LangSwitcher';
import { Icon } from './Icon';
import { AUTH_ENABLED, hasSupabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

const GITHUB = 'https://github.com/weed33834/OpenBox';

export function NavBar() {
  const t = useT();
  const route = useHashRoute();
  const authOn = AUTH_ENABLED && hasSupabase;
  const user = useAuthStore((s) => s.user);
  const openAuth = useAuthStore((s) => s.openAuth);
  const signOut = useAuthStore((s) => s.signOut);

  const links: { name: RouteName; label: string; href: string }[] = [
    { name: 'home', label: t('nav.home'), href: '#/home' },
    { name: 'submit', label: t('nav.submit'), href: '#/submit' },
    { name: 'favorites', label: t('nav.favorites'), href: '#/favorites' },
    { name: 'about', label: t('nav.about'), href: '#/about' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="container flex h-14 items-center gap-3">
        <Logo />
        <nav className="ml-2 hidden items-center gap-1 sm:flex">
          {links.map((l) => {
            const active = route.name === l.name;
            return (
              <a
                key={l.name}
                href={l.href}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(l.href.replace('#', ''));
                }}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-fg)]'
                }`}
              >
                {l.label}
              </a>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/search')}
            aria-label={t('nav.search')}
          >
            <Icon name="Search" size={18} />
          </button>
          <LangSwitcher />
          <ThemeToggle />
          {authOn && (
            user ? (
              <div className="flex items-center gap-2">
                <span
                  className="hidden max-w-[140px] truncate text-sm text-[var(--color-muted)] sm:inline"
                  title={user.email ?? ''}
                >
                  {user.email}
                </span>
                <button className="btn btn-ghost btn-sm" onClick={() => signOut()}>
                  {t('auth.logout')}
                </button>
              </div>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={() => openAuth('signin')}>
                {t('auth.login')}
              </button>
            )
          )}
          <a
            className="btn btn-ghost btn-sm"
            href={GITHUB}
            target="_blank"
            rel="noreferrer"
            aria-label={t('nav.github')}
          >
            <Icon name="Code" size={18} />
          </a>
        </div>
      </div>

      {/* 移动端导航已由 MobileTabBar（底部 Tab）承担，顶部仅保留 Logo 与控件 */}
    </header>
  );
}
