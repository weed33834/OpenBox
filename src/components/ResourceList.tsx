import { useState } from 'react';
import type { Resource } from '@/lib/types';
import { useT } from '@/i18n/useI18n';
import { ResourceCard } from './ResourceCard';
import { ResourceRow } from './ResourceRow';
import { ResourceCardSkeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import { Icon } from './Icon';

type ViewMode = 'grid' | 'list';

/** 读取/保存视图偏好（localStorage 记忆，默认网格） */
function loadView(): ViewMode {
  try {
    return localStorage.getItem('ob_view') === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
}

/**
 * 资源列表：支持「网格卡 / 信息密集列表行」两种形态（baipiao 式差异化），
 * 视图偏好本地记忆；移动端网格单列、列表行自然纵向，不做强制压缩。
 */
export function ResourceList({ resources, loading = false, allowViewSwitch = true }: { resources: Resource[]; loading?: boolean; allowViewSwitch?: boolean }) {
  const t = useT();
  const [view, setView] = useState<ViewMode>(loadView);

  const switchView = (v: ViewMode) => {
    setView(v);
    try {
      localStorage.setItem('ob_view', v);
    } catch { /* ignore */ }
  };

  const Toggle = (
    <div className="mb-3 flex items-center justify-end gap-1">
      <button
        className={`flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
          view === 'grid' ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]' : 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-fg)]'
        }`}
        onClick={() => switchView('grid')}
        aria-label={t('view.grid')}
        title={t('view.grid')}
      >
        <Icon name="LayoutGrid" size={16} />
      </button>
      <button
        className={`flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
          view === 'list' ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]' : 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-fg)]'
        }`}
        onClick={() => switchView('list')}
        aria-label={t('view.list')}
        title={t('view.list')}
      >
        <Icon name="List" size={16} />
      </button>
    </div>
  );

  if (loading) {
    return (
      <div>
        {allowViewSwitch && Toggle}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <ResourceCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!resources.length) {
    return <EmptyState icon="Search" title={t('common.empty')} />;
  }

  if (view === 'list') {
    return (
      <div>
        {allowViewSwitch && Toggle}
        <div className="space-y-3">
          {resources.map((r, i) => (
            <ResourceRow key={r.id} resource={r} index={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {allowViewSwitch && Toggle}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((r, i) => (
          <ResourceCard key={r.id} resource={r} index={i} />
        ))}
      </div>
    </div>
  );
}
