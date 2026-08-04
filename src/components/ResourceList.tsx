import type { Resource } from '@/lib/types';
import { useT } from '@/i18n/useI18n';
import { ResourceCard } from './ResourceCard';
import { ResourceCardSkeleton } from './Skeleton';
import { EmptyState } from './EmptyState';

export function ResourceList({ resources, loading = false }: { resources: Resource[]; loading?: boolean }) {
  const t = useT();

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <ResourceCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!resources.length) {
    return <EmptyState icon="Search" title={t('common.empty')} />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {resources.map((r, i) => (
        <ResourceCard key={r.id} resource={r} index={i} />
      ))}
    </div>
  );
}
