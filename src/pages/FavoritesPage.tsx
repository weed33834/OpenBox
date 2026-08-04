import { useEffect, useMemo, useState } from 'react';
import type { Resource } from '@/lib/types';
import { useT } from '@/i18n/useI18n';
import { getResources } from '@/lib/data';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { ResourceList } from '@/components/ResourceList';
import { EmptyState } from '@/components/EmptyState';
import { navigate } from '@/hooks/useHashRoute';

export function FavoritesPage() {
  const t = useT();
  const ids = useFavoritesStore((s) => s.ids);
  const [all, setAll] = useState<Resource[]>([]);

  useEffect(() => {
    getResources({ sort: 'default' }).then(setAll);
  }, []);

  const favs = useMemo(() => all.filter((r) => ids.includes(r.id)), [all, ids]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-[var(--color-fg)]">{t('nav.favorites')}</h1>
      {favs.length === 0 ? (
        <EmptyState
          icon="Heart"
          title={t('common.empty')}
          hint={
            <button className="btn btn-primary btn-sm mt-3" onClick={() => navigate('/home')}>
              {t('home.browseCategories')}
            </button>
          }
        />
      ) : (
        <ResourceList resources={favs} />
      )}
    </div>
  );
}
