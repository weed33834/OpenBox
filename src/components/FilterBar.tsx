import type { ResourceStatus, ResourceType } from '@/lib/types';
import { useT } from '@/i18n/useI18n';
import { ALL_STATUSES, ALL_TYPES, STATUS_META, TYPE_META } from '@/lib/format';

export function FilterBar({
  type,
  status,
  onType,
  onStatus,
}: {
  type: ResourceType | 'all';
  status: ResourceStatus | 'all';
  onType: (t: ResourceType | 'all') => void;
  onStatus: (s: ResourceStatus | 'all') => void;
}) {
  const t = useT();
  return (
    <div className="flex flex-nowrap items-center gap-2 overflow-x-auto scrollbar-none sm:flex-wrap">
      <button className="chip" data-active={type === 'all'} onClick={() => onType('all')}>
        {t('common.all')}
      </button>
      {ALL_TYPES.map((tp) => (
        <button key={tp} className="chip" data-active={type === tp} onClick={() => onType(tp)}>
          {TYPE_META[tp].label}
        </button>
      ))}
      <span className="mx-1 hidden h-4 w-px bg-[var(--color-border)] sm:block" />
      {ALL_STATUSES.map((st) => (
        <button key={st} className="chip" data-active={status === st} onClick={() => onStatus(st)}>
          {STATUS_META[st].label}
        </button>
      ))}
    </div>
  );
}
