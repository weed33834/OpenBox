import { useEffect, useMemo, useState } from 'react';
import type { Resource } from '@/lib/types';
import { useT, useLocalize } from '@/i18n/useI18n';
import { getResources } from '@/lib/data';
import { buildScenarioTree } from '@/data/taxonomy';
import { SearchBox } from '@/components/SearchBox';
import { CategoryCard } from '@/components/CategoryCard';
import { Icon } from '@/components/Icon';
import { navigate } from '@/hooks/useHashRoute';
import { RankingList } from '@/components/RankingList';
import { TagCloud } from '@/components/TagCloud';
import { StatusMonitor } from '@/components/StatusMonitor';
import { WeeklyUpdates } from '@/components/WeeklyUpdates';

export function HomePage() {
  const t = useT();
  const localize = useLocalize();
  const [resources, setResources] = useState<Resource[]>([]);

  useEffect(() => {
    let m = true;
    getResources({ sort: 'default' }).then((list) => {
      if (m) {
        setResources(list);
      }
    });
    return () => {
      m = false;
    };
  }, []);

  const tree = useMemo(() => buildScenarioTree(resources), [resources]);

  // 场景 → 子类型 的资源计数（用于场景树上的角标）
  const scenarioCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of resources) {
      for (const sc of r.scenarios ?? []) {
        const k = `${sc}:${r.subType}`;
        m[k] = (m[k] ?? 0) + 1;
      }
    }
    return m;
  }, [resources]);

  // 状态聚合（「现在还能不能薅」的全局一眼观感）
  const statusCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of resources) m[r.status] = (m[r.status] ?? 0) + 1;
    return m;
  }, [resources]);

  // 状态占比（健康度条形图）
  const pct = (n?: number) => (resources.length ? Math.round(((n ?? 0) / resources.length) * 100) : 0);

  return (
    <div className="space-y-10 sm:space-y-14">
      {/* 紧凑头部：标题 + 搜索 + 统计 */}
      <section className="relative rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-8 text-center sm:px-12 sm:py-10">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 opacity-60"
          style={{ background: 'radial-gradient(40rem 18rem at 50% -30%, var(--color-primary-soft), transparent 70%)' }}
        />
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-fg)] sm:text-4xl">{t('home.title')}</h1>
        <p className="mx-auto mt-3 max-w-xl text-[var(--color-muted)]">{t('home.subtitle')}</p>
        <div className="mx-auto mt-6 max-w-xl">
          <SearchBox big />
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-[var(--color-muted)]">
          <span>{t('home.stats')}：</span>
          <span className="font-semibold text-[var(--color-primary)]">{resources.length}</span>
          <span>·</span>
          <span>
            {tree.length} {t('nav.categories')}
          </span>
        </div>

        {/* 状态聚合条：一眼看到「现在还能不能薅」（全站健康度） */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-1.5 font-medium text-[#10b981]">
            <span className="status-dot" style={{ background: '#10b981' }} />
            {statusCounts.ok ?? 0} {t('status.ok')}
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-[#f59e0b]">
            <span className="status-dot" style={{ background: '#f59e0b' }} />
            {statusCounts.unstable ?? 0} {t('status.unstable')}
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-[#ef4444]">
            <span className="status-dot" style={{ background: '#ef4444' }} />
            {statusCounts.dead ?? 0} {t('status.dead')}
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-[var(--color-muted)]">
            <span className="status-dot" style={{ background: '#94a3b8' }} />
            {statusCounts.unknown ?? 0} {t('status.unknown')}
          </span>
        </div>

        {/* 状态分布健康度条形（各状态占比，一眼看全局） */}
        <div className="mx-auto mt-5 flex h-2 w-full max-w-md overflow-hidden rounded-full bg-[var(--color-border)]">
          <span className="h-full transition-all" style={{ width: `${pct(statusCounts.ok)}%`, background: '#10b981' }} />
          <span className="h-full transition-all" style={{ width: `${pct(statusCounts.unstable)}%`, background: '#f59e0b' }} />
          <span className="h-full transition-all" style={{ width: `${pct(statusCounts.dead)}%`, background: '#ef4444' }} />
          <span className="h-full transition-all" style={{ width: `${pct(statusCounts.unknown)}%`, background: '#94a3b8' }} />
        </div>
      </section>

      {/* 全部分类：搜索下方直接展示分类入口，具体资源在各分类页内 */}
      <section>
        <h2 className="mb-1 text-lg font-semibold text-[var(--color-fg)]">{t('home.allCategories')}</h2>
        <p className="mb-5 text-sm text-[var(--color-muted)]">{t('scenario.subtitle')}</p>
        <div className="space-y-8">
          {tree.map((node) => (
            <div key={node.scenario.slug}>
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: `${node.scenario.color}1a`, color: node.scenario.color }}
                >
                  <Icon name={node.scenario.icon} size={17} />
                </span>
                <button
                  className="text-base font-semibold text-[var(--color-fg)] hover:text-[var(--color-primary)]"
                  onClick={() => navigate(`/scenario/${node.scenario.slug}`)}
                >
                  {localize(node.scenario.name)}
                </button>
                <span className="text-sm text-[var(--color-muted)]">{node.count}</span>
                <button
                  className="ml-auto text-xs text-[var(--color-primary)] hover:underline"
                  onClick={() => navigate(`/scenario/${node.scenario.slug}`)}
                >
                  {t('scenario.viewAll')}
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {node.subTypes.map((st) => (
                  <CategoryCard
                    key={st.slug}
                    subType={st}
                    count={scenarioCounts[`${node.scenario.slug}:${st.slug}`] ?? 0}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 增强模块（配置/数据驱动骨架） */}
      <div className="grid gap-10 lg:grid-cols-2">
        <RankingList resources={resources} />
        <StatusMonitor resources={resources} />
      </div>
      <TagCloud resources={resources} />
      <WeeklyUpdates />
    </div>
  );
}
