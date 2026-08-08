import { useT } from '@/i18n/useI18n';
import { useHashRoute, navigate } from '@/hooks/useHashRoute';
import { Icon } from './Icon';

/**
 * 移动端底部 Tab 导航（sm 以下显示）。
 * 移动端专属设计：固定底部、大触控目标、safe-area 适配，不挤在顶部导航里；
 * 桌面端（sm 以上）不渲染，仍用顶部 NavBar。
 */
export function MobileTabBar() {
  const t = useT();
  const route = useHashRoute();

  const tabs = [
    { name: 'home', label: t('nav.home'), icon: 'Home', href: '#/home', match: ['home', 'landing'] },
    { name: 'search', label: t('nav.search'), icon: 'Search', href: '#/search', match: ['search'] },
    { name: 'ranking', label: t('nav.ranking'), icon: 'TrendingUp', href: '#/ranking', match: ['ranking'] },
    { name: 'favorites', label: t('nav.favorites'), icon: 'Heart', href: '#/favorites', match: ['favorites'] },
    { name: 'submit', label: t('nav.submit'), icon: 'Plus', href: '#/submit', match: ['submit'] },
    { name: 'about', label: t('nav.about'), icon: 'Info', href: '#/about', match: ['about'] },
  ] as const;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-bg)] sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="mobile-nav"
    >
      <div className="flex">
        {tabs.map((tab) => {
          const active = tab.match.some((m) => m === route.name);
          return (
            <button
              key={tab.name}
              onClick={() => navigate(tab.href.replace('#', ''))}
              className={`flex min-h-[3.5rem] flex-1 flex-col items-center justify-center gap-0.5 text-[0.7rem] transition-colors ${
                active ? 'font-semibold text-[var(--color-primary)]' : 'text-[var(--color-muted)]'
              }`}
              aria-label={tab.label}
            >
              <Icon name={tab.icon} size={20} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
