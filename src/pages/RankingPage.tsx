import { useEffect, useMemo, useState } from 'react';
import { useT } from '@/i18n/useI18n';
import { seedResources } from '@/data/seed';
import { getVerificationStats } from '@/lib/data';
import { rankFreeApis, type RankScore } from '@/lib/ranking';
import { navigate } from '@/hooks/useHashRoute';
import { Icon } from '@/components/Icon';

const MEDALS = ['🥇', '🥈', '🥉'];

/** 免费 API 排行榜（第一期）：社区整理评分 + 实跳验证 + 社区投票，全维度透明可查 */
export function RankingPage() {
  const t = useT();
  const [rows, setRows] = useState<RankScore[] | null>(null);

  useEffect(() => {
    let m = true;
    (async () => {
      const apis = seedResources.filter((r) => r.subType === 'free-api');
      const list = await rankFreeApis(apis, async (id) => {
        const s = await getVerificationStats(id);
        return { ok: s.ok, dead: s.dead };
      });
      if (m) setRows(list);
    })();
    return () => {
      m = false;
    };
  }, []);

  const topTotal = useMemo(() => rows?.[0]?.total ?? 100, [rows]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="card p-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--color-fg)]">
          <Icon name="TrendingUp" size={22} className="text-[var(--color-primary)]" /> {t('lb.title')}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{t('lb.desc')}</p>
        {/* 评分体系说明 */}
        <details className="mt-3 rounded-lg border border-[var(--color-border)] p-3 text-xs text-[var(--color-muted)]">
          <summary className="cursor-pointer font-medium text-[var(--color-fg)]">{t('lb.method')}</summary>
          <ul className="mt-2 space-y-1">
            <li>免费额度 25 · 官方/社区 15 · 稳定性 20 · 易访问性 10</li>
            <li>模型丰富度 15 · 签到机制 5 · 人气 10 · 社区验证 ±5</li>
            <li>满分 100；稳定性来自实跳验证，社区验证来自「还能用/已失效」投票</li>
          </ul>
        </details>
      </div>

      {rows === null ? (
        <p className="py-10 text-center text-sm text-[var(--color-muted)]">{t('common.loading')}</p>
      ) : rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--color-muted)]">{t('common.empty')}</p>
      ) : (
        <ol className="space-y-3">
          {rows.map((row, i) => (
            <li key={row.resource.id} className="card p-4">
              <div className="flex items-start gap-3">
                {/* 名次 */}
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg font-bold" style={{ background: i < 3 ? 'var(--color-primary-soft)' : 'var(--color-border)', color: i < 3 ? 'var(--color-primary)' : 'var(--color-muted)' }}>
                  {MEDALS[i] ?? i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  {/* 名称 + 总分 */}
                  <div className="flex items-center gap-2">
                    <button
                      className="min-w-0 flex-1 truncate text-left font-semibold text-[var(--color-fg)] hover:text-[var(--color-primary)]"
                      onClick={() => navigate(`/resource/${row.resource.id}`)}
                    >
                      {row.resource.name}
                    </button>
                    {row.resource.official && (
                      <Icon name="Check" size={14} className="shrink-0 text-[var(--color-primary)]" />
                    )}
                    <span className="shrink-0 rounded-lg px-2 py-0.5 text-sm font-bold" style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}>
                      {row.total}
                    </span>
                  </div>
                  {/* 维度明细条（相对总分宽度） */}
                  <div className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
                    {row.parts.map((p) => (
                      <span
                        key={p.label}
                        className="h-full"
                        style={{ width: `${Math.max(0, (p.score / topTotal) * 100)}%`, background: p.score >= p.max ? 'var(--color-primary)' : 'var(--color-primary-soft)' }}
                        title={`${p.label} ${p.score}/${p.max}`}
                      />
                    ))}
                  </div>
                  {/* 明细文本 */}
                  <p className="mt-1.5 truncate text-xs text-[var(--color-muted)]">
                    {row.parts.map((p) => `${p.label} ${p.score}`).join(' · ')}
                    {row.votes.ok + row.votes.dead > 0 && ` · ${t('lb.votes')} ${row.votes.ok + row.votes.dead}`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-1.5 max-sm:hidden">
                  <a className="btn btn-ghost btn-sm" href={row.resource.url} target="_blank" rel="noreferrer">
                    <Icon name="ExternalLink" size={13} /> {t('common.visit')}
                  </a>
                </div>
              </div>
              {/* 移动端：访问按钮单独占满一行，避免挤掉名称 */}
              <a
                className="btn btn-primary btn-sm mt-2 hidden w-full justify-center max-sm:inline-flex"
                href={row.resource.url}
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="ExternalLink" size={14} /> {t('common.visit')}
              </a>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
