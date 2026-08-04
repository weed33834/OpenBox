import { useT } from '@/i18n/useI18n';
import { Icon } from '@/components/Icon';

export function AboutPage() {
  const t = useT();
  const items = [
    { icon: 'Plus', title: t('about.contribute'), desc: t('about.contributeDesc') },
    { icon: 'AlertTriangle', title: t('about.disclaimer'), desc: t('about.disclaimerDesc') },
    { icon: 'Wrench', title: t('about.tech'), desc: t('about.techDesc') },
  ];
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-[var(--color-fg)]">{t('about.title')}</h1>
        <p className="mt-3 leading-relaxed text-[var(--color-muted)]">{t('about.desc')}</p>
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
