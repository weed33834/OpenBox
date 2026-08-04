import type { Resource, ResourceStatus } from '@/lib/types';
import { useT } from '@/i18n/useI18n';
import { ALL_STATUSES, STATUS_META } from '@/lib/format';
import { Icon } from './Icon';

// 状态监测：聚合资源的 status 字段做可视化。后续可平滑接入「实时探测」，
// 只需把数据源换成带 last_checked 的接口，本组件无需改动。
export function StatusMonitor({ resources }: { resources: Resource[] }) {
  const t = useT();
  const counts: Record<ResourceStatus, number> = { ok: 0, unstable: 0, unknown: 0, dead: 0 };
  for (const r of resources) counts[r.status] = (counts[r.status] ?? 0) + 1;
  const total = resources.length;
  const lastUpdated = resources.reduce((max, r) => (r.updatedAt && r.updatedAt > max ? r.updatedAt : max), '');

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-fg)]">
        <Icon name="Activity" size={18} className="text-[var(--color-primary)]" /> {t('status.title')}
      </h2>
      <div className="card flex flex-wrap items-center gap-x-6 gap-y-3 p-5">
        {ALL_STATUSES.map((st) => (
          <div key={st} className="flex items-center gap-2">
            <span className="status-dot" style={{ background: STATUS_META[st].color }} />
            <span className="text-sm font-semibold text-[var(--color-fg)]">{counts[st]}</span>
            <span className="text-xs text-[var(--color-muted)]">{t(`status.${st}`)}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-[var(--color-muted)]">
        {t('status.lastUpdated')}：{lastUpdated || '—'} · {t('status.monitored')} {total}
      </p>
    </section>
  );
}
