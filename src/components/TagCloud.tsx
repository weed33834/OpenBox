import type { Resource } from '@/lib/types';
import { useT } from '@/i18n/useI18n';
import { navigate } from '@/hooks/useHashRoute';
import { Icon } from './Icon';

// 标签云：由资源 tags 聚合词频，字号随频率缩放；点击跳转搜索（数据驱动、可扩展）。
export function TagCloud({ resources, limit = 30 }: { resources: Resource[]; limit?: number }) {
  const t = useT();
  const freq = new Map<string, number>();
  for (const r of resources) for (const tag of r.tags ?? []) freq.set(tag, (freq.get(tag) ?? 0) + 1);
  const tags = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
  const max = tags.length ? tags[0][1] : 1;
  if (!tags.length) return null;

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-fg)]">
        <Icon name="Tag" size={18} className="text-[var(--color-primary)]" /> {t('tags.title')}
      </h2>
      <div className="card flex flex-wrap items-center gap-2 p-5">
        {tags.map(([tag, n]) => {
          const scale = 0.8 + (n / max) * 0.7; // 0.8rem ~ 1.5rem
          return (
            <button
              key={tag}
              onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
              className="chip"
              style={{ fontSize: `${scale}rem` }}
            >
              {tag}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-[var(--color-muted)]">{t('tags.hint')}</p>
    </section>
  );
}
