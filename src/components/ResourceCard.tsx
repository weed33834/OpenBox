import type { CSSProperties } from 'react';
import type { Resource } from '@/lib/types';
import { useT, useLocalize } from '@/i18n/useI18n';
import { navigate } from '@/hooks/useHashRoute';
import { getSubType } from '@/data/taxonomy';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { Icon } from './Icon';
import { StatusBadge, TypeBadge } from './Badge';

export function ResourceCard({ resource, index = 0 }: { resource: Resource; index?: number }) {
  const t = useT();
  const localize = useLocalize();
  const cat = getSubType(resource.subType);
  const fav = useFavoritesStore((s) => s.ids.includes(resource.id));
  const toggleFav = useFavoritesStore((s) => s.toggle);

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
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-[var(--color-muted)]">
        {resource.summary || resource.description}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <TypeBadge type={resource.type} />
        <StatusBadge status={resource.status} />
        {resource.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="chip" data-active={false}>
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button className="btn btn-primary btn-sm" onClick={() => navigate(`/resource/${resource.id}`)}>
          {t('common.viewDetail')}
        </button>
        <a className="btn btn-ghost btn-sm" href={resource.url} target="_blank" rel="noreferrer">
          <Icon name="ExternalLink" size={15} />
          {t('common.visit')}
        </a>
      </div>
    </div>
  );
}
