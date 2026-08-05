import type { Resource } from '@/lib/types';
import { useT, useLocalize } from '@/i18n/useI18n';
import { navigate } from '@/hooks/useHashRoute';
import { getSubType } from '@/data/taxonomy';
import { Icon } from './Icon';
import { StatusBadge, TypeBadge } from './Badge';

/** 显示 MM-DD（ISO 或短日期兼容） */
function fmtDate(s?: string): string {
  if (!s) return '';
  const m = s.match(/^\d{4}-(\d{2}-\d{2})/);
  return m ? m[1] : s.slice(0, 5);
}

/**
 * 首页精选横幅大卡：与普通网格卡差异化 —— 整宽横向布局、大图标、副标题、双按钮。
 * 移动端自动纵向堆叠，不压缩。
 */
export function FeaturedCard({ resource }: { resource: Resource }) {
  const t = useT();
  const localize = useLocalize();
  const cat = getSubType(resource.subType);

  return (
    <div
      className="card relative overflow-hidden p-5 sm:p-6"
      style={{ borderColor: 'transparent', boxShadow: 'var(--shadow-card)' }}
    >
      {/* 顶部分类色条（差异化视觉锚点） */}
      <span className="absolute inset-x-0 top-0 h-1" style={{ background: cat?.color ?? '#888' }} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl sm:h-16 sm:w-16"
          style={{ background: `${cat?.color ?? '#888'}1a`, color: cat?.color }}
        >
          <Icon name={cat?.icon ?? 'Globe'} size={28} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-[var(--color-fg)]">{resource.name}</h3>
            {resource.official && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-primary-soft)] px-1.5 py-0.5 text-xs font-medium text-[var(--color-primary)]">
                <Icon name="Check" size={12} /> {t('common.official')}
              </span>
            )}
            <StatusBadge status={resource.status} />
            <TypeBadge type={resource.type} />
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--color-muted)]">
            {resource.summary || resource.description}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
            <span className="inline-flex items-center gap-1">
              <Icon name={cat?.icon ?? 'Globe'} size={12} style={{ color: cat?.color }} />
              {cat ? localize(cat.name) : ''}
            </span>
            {resource.updatedAt && (
              <span className="inline-flex items-center gap-1">
                <Icon name="Clock" size={12} />
                {t('card.updated')} {fmtDate(resource.updatedAt)}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:flex-col">
          <a className="btn btn-primary btn-sm w-full sm:w-auto" href={resource.url} target="_blank" rel="noreferrer">
            <Icon name="ExternalLink" size={15} /> {t('common.visit')}
          </a>
          <button className="btn btn-ghost btn-sm w-full sm:w-auto" onClick={() => navigate(`/resource/${resource.id}`)}>
            {t('common.viewDetail')}
          </button>
        </div>
      </div>
    </div>
  );
}
