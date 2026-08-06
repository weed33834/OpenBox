import { useT } from '@/i18n/useI18n';
import { Icon } from '@/components/Icon';

const GITHUB = 'https://github.com/weed33834/OpenBox';

export function AboutPage() {
  const t = useT();
  const items = [
    { icon: 'Plus', title: t('about.contribute'), desc: t('about.contributeDesc') },
    { icon: 'AlertTriangle', title: t('about.disclaimer'), desc: t('about.disclaimerDesc') },
    { icon: 'Wrench', title: t('about.tech'), desc: t('about.techDesc') },
  ];
  // 社区直达入口：反馈 / 提 Issue / Star / 源码
  const links = [
    { icon: 'AlertTriangle', label: t('about.issue'), href: `${GITHUB}/issues/new`, primary: true },
    { icon: 'Star', label: t('about.star'), href: GITHUB },
    { icon: 'Code', label: t('about.source'), href: GITHUB },
    { icon: 'MessageSquare', label: t('about.contact'), href: `${GITHUB}/issues` },
  ];
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-[var(--color-fg)]">{t('about.title')}</h1>
        <p className="mt-3 leading-relaxed text-[var(--color-muted)]">{t('about.desc')}</p>
      </div>

      {/* 联系站长 / 去 GitHub 反馈（社区化开源项目入口） */}
      <div className="card p-6">
        <h2 className="flex items-center gap-2 font-semibold text-[var(--color-fg)]">
          <Icon name="GitBranch" size={18} className="text-[var(--color-primary)]" /> {t('about.github')}
        </h2>
        <p className="mt-1.5 text-sm text-[var(--color-muted)]">{t('about.githubDesc')}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                l.primary
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-fg)] hover:opacity-90'
                  : 'border-[var(--color-border)] text-[var(--color-fg)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
              }`}
            >
              <Icon name={l.icon} size={15} /> {l.label}
            </a>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {items.map((it) => (
          <div key={it.title} className="card p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <Icon name={it.icon} size={18} />
            </span>
            <h3 className="mt-3 font-semibold text-[var(--color-fg)]">{it.title}</h3>
            <p className="mt-1 text-sm text-[var(--color-muted)]">{it.desc}</p>
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-[var(--color-muted)]">{t('about.license')}</p>
    </div>
  );
}
