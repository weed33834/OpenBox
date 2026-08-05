import type { CSSProperties } from 'react';
import { useState } from 'react';
import type { Resource } from '@/lib/types';
import { useT } from '@/i18n/useI18n';
import { navigate } from '@/hooks/useHashRoute';
import { getSubType } from '@/data/taxonomy';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { submitReport } from '@/lib/data';
import { Icon } from './Icon';
import { StatusBadge, TypeBadge } from './Badge';
import { ReportModal } from './ReportModal';
import { VerifyWidget } from './VerifyWidget';

/** 显示 MM-DD（ISO 或短日期兼容） */
function fmtDate(s?: string): string {
  if (!s) return '';
  const m = s.match(/^\d{4}-(\d{2}-\d{2})/);
  return m ? m[1] : s.slice(0, 5);
}

/**
 * 列表行形态（信息密集行）：横向图标 + 标题/徽章/标签/摘要 + 底部操作。
 * 与 ResourceCard（网格卡）并存，由 ResourceList 的「网格/列表」视图切换使用。
 */
export function ResourceRow({ resource, index = 0 }: { resource: Resource; index?: number }) {
  const t = useT();
  const cat = getSubType(resource.subType);
  const fav = useFavoritesStore((s) => s.ids.includes(resource.id));
  const toggleFav = useFavoritesStore((s) => s.toggle);
  const [showReport, setShowReport] = useState(false);

  return (
    <div className="card card-hover card-in p-4" style={{ ['--i' as string]: index } as CSSProperties}>
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ background: `${cat?.color ?? '#888'}1a`, color: cat?.color }}
        >
          <Icon name={cat?.icon ?? 'Globe'} size={19} />
        </span>
        <div className="min-w-0 flex-1">
          {/* 标题行：名称 + 官方标 + 状态/类型徽章 */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              className="truncate text-left font-semibold text-[var(--color-fg)] hover:text-[var(--color-primary)]"
              onClick={() => navigate(`/resource/${resource.id}`)}
            >
              {resource.name}
            </button>
            {resource.official && <Icon name="Check" size={14} className="shrink-0 text-[var(--color-primary)]" />}
            <span className="hidden sm:inline-flex">
              <StatusBadge status={resource.status} />
            </span>
            <span className="hidden md:inline-flex">
              <TypeBadge type={resource.type} />
            </span>
          </div>
          {/* 标签 chips */}
          {resource.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {resource.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-md border border-[var(--color-border)] px-1.5 py-0.5 text-[0.7rem] text-[var(--color-muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {/* 摘要：列表行单行截断，信息优先 */}
          <p className="mt-1.5 truncate text-sm text-[var(--color-muted)]">{resource.summary || resource.description}</p>
          {/* 底部 meta：更新 + 验证 + 收藏/反馈 */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-muted)]">
            {resource.updatedAt && (
              <span className="inline-flex items-center gap-1">
                <Icon name="Clock" size={12} />
                {t('card.updated')} {fmtDate(resource.updatedAt)}
              </span>
            )}
            <span className="flex items-center gap-2">
              <button
                onClick={() => toggleFav(resource.id)}
                className="inline-flex items-center gap-1 transition-colors hover:text-[var(--color-primary)]"
                aria-label={t('detail.favorite')}
              >
                <Icon name="Heart" size={13} fill={fav ? 'var(--color-primary)' : 'none'} color={fav ? 'var(--color-primary)' : undefined} />
                {fav ? t('detail.unfavorite') : t('detail.favorite')}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowReport(true); }}
                className="inline-flex items-center gap-1 transition-colors hover:text-orange-500"
                aria-label={t('report.button')}
              >
                <Icon name="AlertTriangle" size={13} />
                {t('report.button')}
              </button>
            </span>
          </div>
        </div>
      </div>

      {/* 操作行：验证投票 + 详情/访问 */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <VerifyWidget resourceId={resource.id} />
        <div className="ml-auto flex items-center gap-2">
          <button className="btn btn-primary btn-sm" onClick={() => navigate(`/resource/${resource.id}`)}>
            {t('common.viewDetail')}
          </button>
          <a className="btn btn-ghost btn-sm" href={resource.url} target="_blank" rel="noreferrer">
            <Icon name="ExternalLink" size={14} />
            {t('common.visit')}
          </a>
        </div>
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
