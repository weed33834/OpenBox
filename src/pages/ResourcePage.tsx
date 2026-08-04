import { useEffect, useState } from 'react';
import type { Resource } from '@/lib/types';
import { useT } from '@/i18n/useI18n';
import { getResource } from '@/lib/data';
import { useHashRoute, navigate } from '@/hooks/useHashRoute';
import { ResourceDetail } from '@/components/DetailView';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';

export function ResourcePage() {
  const t = useT();
  const route = useHashRoute();
  const id = route.id ?? '';

  const [res, setRes] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let m = true;
    setLoading(true);
    getResource(id).then((r) => {
      if (m) {
        setRes(r);
        setLoading(false);
      }
    });
    return () => {
      m = false;
    };
  }, [id]);

  return (
    <div className="mx-auto max-w-2xl">
      <button className="btn btn-ghost btn-sm mb-4" onClick={() => navigate('/home')}>
        <Icon name="ArrowLeft" size={16} /> {t('common.back')}
      </button>
      {loading ? (
        <p className="text-[var(--color-muted)]">{t('common.loading')}</p>
      ) : res ? (
        <div className="card p-6">
          <ResourceDetail resource={res} />
        </div>
      ) : (
        <EmptyState icon="Search" title={t('common.empty')} />
      )}
    </div>
  );
}
