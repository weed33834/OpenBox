import { useT, useLocalize } from '@/i18n/useI18n';
import { weeklyUpdates } from '@/data/weekly';
import { Icon } from './Icon';

// 每周更新 / 账号动态：完全由 src/data/weekly.ts 配置驱动，新增条目只改数据。
export function WeeklyUpdates() {
  const t = useT();
  const localize = useLocalize();

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-fg)]">
        <Icon name="Newspaper" size={18} className="text-[var(--color-primary)]" /> {t('weekly.title')}
      </h2>
      {weeklyUpdates.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">{t('weekly.empty')}</p>
      ) : (
        <div className="card divide-y divide-[var(--color-border)] overflow-hidden">
          {weeklyUpdates.map((u) => (
            <div key={u.id} className="flex gap-3 px-4 py-3">
              <Icon
                name={u.kind === 'account' ? 'Users' : 'RefreshCw'}
                size={16}
                className="mt-0.5 shrink-0 text-[var(--color-primary)]"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-[var(--color-fg)]">{localize(u.title)}</span>
                  <span className="text-xs text-[var(--color-muted)]">{u.date}</span>
                </div>
                {u.desc && <p className="mt-0.5 text-sm text-[var(--color-muted)]">{localize(u.desc)}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
