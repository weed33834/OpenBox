import { useEffect, useMemo, useState } from 'react';
import type { Resource, ResourceStatus, ResourceType } from '@/lib/types';
import { useT } from '@/i18n/useI18n';
import { getResources } from '@/lib/data';
import { useHashRoute } from '@/hooks/useHashRoute';
import { SearchBox } from '@/components/SearchBox';
import { ResourceList } from '@/components/ResourceList';
import { FilterBar } from '@/components/FilterBar';

export function SearchPage() {
  const t = useT();
  const route = useHashRoute();
  const q = route.q ?? '';

  const [all, setAll] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<ResourceType | 'all'>('all');
  const [status, setStatus] = useState<ResourceStatus | 'all'>('all');

  useEffect(() => {
    let m = true;
    setLoading(true);
    getResources({ q }).then((list) => {
      if (m) {
        setAll(list);
        setLoading(false);
      }
    });
    return () => {
      m = false;
    };
  }, [q]);

  const filtered = useMemo(
    () => all.filter((r) => (type === 'all' || r.type === type) && (status === 'all' || r.status === status)),
    [all, type, status],
  );

  return (
    <div className="space-y-5">
      <SearchBox initial={q} autoFocus big />
      <FilterBar type={type} status={status} onType={setType} onStatus={setStatus} />
      <p className="text-sm text-[var(--color-muted)]">
        {filtered.length} {t('common.results')}
      </p>
      <ResourceList resources={filtered} loading={loading} />
    </div>
  );
}
