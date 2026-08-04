import type { Resource } from '@/lib/types';
import { useT, useLocalize } from '@/i18n/useI18n';
import { navigate } from '@/hooks/useHashRoute';
import { getSubType } from '@/data/taxonomy';
import { Icon } from './Icon';

// 热度评分：编辑人气(0-100) 为主信号，辅以编辑精选、更新新鲜度与标签丰富度。
// 三者均为静态、全局、可解释；后续接入后端（Supabase）可平滑替换为收藏数/点击量等真实信号。
function daysSince(iso?: string): number {
  if (!iso) return 999;
  const d = Date.parse(iso);
  if (Number.isNaN(d)) return 999;
  return Math.max(0, (Date.now() - d) / 86_400_000);
}
function hotScore(r: Resource): number {
  const featured = r.featured ? 40 : 0;
  const fresh = Math.max(0, 30 - daysSince(r.updatedAt));
  const tagBoost = Math.min(r.tags?.length ?? 0, 5);
  const popularity = Math.max(0, Math.min(r.popularity ?? 0, 100));
  return popularity + featured + fresh + tagBoost;
}

export function RankingList({ resources, limit = 8 }: { resources: Resource[]; limit?: number }) {
  const t = useT();
  const localize = useLocalize();
  const top = [...resources].sort((a, b) => hotScore(b) - hotScore(a)).slice(0, limit);
  if (!top.length) return null;

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-fg)]">
        <Icon name="TrendingUp" size={18} className="text-[var(--color-primary)]" /> {t('ranking.title')}
      </h2>
      <div className="card divide-y divide-[var(--color-border)] overflow-hidden">
        {top.map((r, i) => {
          const st = getSubType(r.subType);
          return (
            <button
              key={r.id}
              onClick={() => navigate(`/resource/${r.id}`)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-primary-soft)]"
            >
              <span className="w-6 text-center text-sm font-bold text-[var(--color-muted)]">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate font-medium text-[var(--color-fg)]">{r.name}</span>
              {st && <span className="chip hidden sm:inline-flex" data-active={false}>{localize(st.name)}</span>}
              {i < 3 && <Icon name="Flame" size={15} className="shrink-0 text-orange-500" />}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-[var(--color-muted)]">{t('ranking.basedOn')}</p>
    </section>
  );
}
