import { useT } from '@/i18n/useI18n';
import { Logo } from './Logo';
import { Icon } from './Icon';
import { dataSourceMode } from '@/lib/data';
import { navigate } from '@/hooks/useHashRoute';

export function Footer() {
  const t = useT();
  const mode = dataSourceMode();
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="container flex flex-col gap-6 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-3 text-sm text-[var(--color-muted)]">{t('footer.tagline')}</p>
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            {mode === 'supabase' ? t('common.dataSource.supabase') : t('common.dataSource.local')}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 text-sm md:grid-cols-4">
          <div>
            <p className="mb-2 font-semibold text-[var(--color-fg)]">{t('about.title')}</p>
            <ul className="space-y-1.5 text-[var(--color-muted)]">
              <li><a className="hover:text-[var(--color-primary)]" href="#/submit" onClick={(e)=>{e.preventDefault();navigate('/submit');}}>{t('nav.submit')}</a></li>
              <li><a className="hover:text-[var(--color-primary)]" href="#/about" onClick={(e)=>{e.preventDefault();window.location.hash='/about';}}>{t('nav.about')}</a></li>
            </ul>
          </div>
          <div>
            <p className="mb-2 font-semibold text-[var(--color-fg)]">{t('footer.github')}</p>
            <ul className="space-y-1.5 text-[var(--color-muted)]">
              <li>
                <a className="inline-flex items-center gap-1 hover:text-[var(--color-primary)]" href="https://github.com/Intelvor/OpenBox" target="_blank" rel="noreferrer">
                  <Icon name="GitBranch" size={13} /> {t('about.source')}
                </a>
              </li>
              <li>
                <a className="inline-flex items-center gap-1 hover:text-[var(--color-primary)]" href="https://github.com/Intelvor/OpenBox/issues/new" target="_blank" rel="noreferrer">
                  <Icon name="AlertTriangle" size={13} /> {t('about.issue')}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-2 font-semibold text-[var(--color-fg)]">{t('about.tech')}</p>
            <p className="text-[var(--color-muted)]">{t('about.techDesc')}</p>
          </div>
          <div>
            <p className="mb-2 font-semibold text-[var(--color-fg)]">{t('about.license')}</p>
            <p className="text-[var(--color-muted)]">© {year} OpenBox</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
