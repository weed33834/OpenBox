import type { CSSProperties } from 'react';
import { useState } from 'react';
import type { Resource } from '@/lib/types';
import { useT, useLocalize } from '@/i18n/useI18n';
import { navigate } from '@/hooks/useHashRoute';
import { getSubType } from '@/data/taxonomy';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { submitReport } from '@/lib/data';
import { Icon } from './Icon';
import { StatusBadge, TypeBadge } from './Badge';
import { ReportModal } from './ReportModal';
import { VerifyWidget } from './VerifyWidget';

/** 把 ISO 日期或短日期统一显示为 MM-DD（「更新 08-04」） */
function fmtUpdatedAt(s?: string): string {
  if (!s) return '';
  const m = s.match(/^\d{4}-(\d{2}-\d{2})/);
  return m ? m[1] : s.slice(0, 5);
}

export function ResourceCard({ resource, index = 0 }: { resource: Resource; index?: number }) {
  const t = useT();
  const localize = useLocalize();
  const cat = getSubType(resource.subType);
  const fav = useFavoritesStore((s) => s.ids.includes(resource.id));
  const toggleFav = useFavoritesStore((s) => s.toggle);
  const [showReport, setShowReport] = useState(false);

  return (
    <div
      className="card card-hover card-in flex flex-col p-4"
      style={{ ['--i' as string]: index } as CSSProperties}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${cat?.color ?? '#888'}1a`, color: cat?.color }}
        >
          <Icon name={cat?.icon ?? 'Globe'} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <button
              className="truncate text-left font-semibold text-[var(--color-fg)] hover:text-[var(--color-primary)]"
              onClick={() => navigate(`/resource/${resource.id}`)}
            >
              {resource.name}
            </button>
            {resource.official && (
              <Icon name="Check" size={14} className="shrink-0 text-[var(--color-primary)]" />
            )}
          </div>
          <p className="truncate text-xs text-[var(--color-muted)]">{cat ? localize(cat.name) : ''}</p>
        </div>
        <button
          onClick={() => toggleFav(resource.id)}
          aria-label={t('detail.favorite')}
          className="shrink-0 text-[var(--color-muted)] transition-colors hover:text-[var(--color-primary)]"
        >
          <Icon name="Heart" size={18} fill={fav ? 'var(--color-primary)' : 'none'} color={fav ? 'var(--color-primary)' : undefined} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setShowReport(true); }}
          aria-label={t('report.button')}
          className="shrink-0 text-[var(--color-muted)] transition-colors hover:text-orange-500"
          title={t('report.button')}
        >
          <Icon name="AlertTriangle" size={17} />
        </button>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-[var(--color-muted)]">
        {resource.summary || resource.description}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <TypeBadge type={resource.type} />
        <StatusBadge status={resource.status} />
        {/* 标签 chips：移动端最多 2 个 + 溢出计数，桌面端最多 3 个（两组互斥显示，避免重复渲染） */}
        {resource.tags.slice(0, 2).map((tag) => (
          <span key={`m-${tag}`} className="chip sm:hidden" data-active={false}>
            {tag}
          </span>
        ))}
        {resource.tags.length > 2 && (
          <span className="inline-flex items-center rounded-md border border-[var(--color-border)] px-1.5 py-0.5 text-[0.7rem] text-[var(--color-muted)] sm:hidden">
            +{resource.tags.length - 2}
          </span>
        )}
        {resource.tags.slice(0, 3).map((tag) => (
          <span key={`d-${tag}`} className="chip hidden sm:inline-flex" data-active={false}>
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-3">
        <VerifyWidget resourceId={resource.id} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {resource.updatedAt && (
          <span
            className="mr-auto inline-flex items-center gap-1 text-xs text-[var(--color-muted)]"
            title={resource.updatedAt}
          >
            <Icon name="Clock" size={13} />
            {t('card.updated')} {fmtUpdatedAt(resource.updatedAt)}
          </span>
        )}
        <button className="btn btn-primary btn-sm flex-1 sm:flex-none" onClick={() => navigate(`/resource/${resource.id}`)}>
          {t('common.viewDetail')}
        </button>
        <a className="btn btn-ghost btn-sm flex-1 sm:flex-none" href={resource.url} target="_blank" rel="noreferrer">
          <Icon name="ExternalLink" size={15} />
          {t('common.visit')}
        </a>
      </div>

      {showReport && (
        <ReportModal
          resourceName={resource.name}
          resourceId={resource.id}
          onClose={() => setShowReport(false)}
          onSubmit={async (id, reason, note) => {
            const res = await submitReport(id, reason, note);
            return res.ok;
          }}
        />
      )}
    </div>
  );
}
