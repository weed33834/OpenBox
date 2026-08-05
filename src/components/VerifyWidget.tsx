import { useEffect, useState } from 'react';
import { useT } from '@/i18n/useI18n';
import { getVerificationStats, submitVerification, type VerificationStats } from '@/lib/data';
import { useToastStore } from '@/store/useToastStore';
import { Icon } from './Icon';

/** 显示 MM-DD（ISO 或短日期兼容） */
function fmtDate(s?: string | null): string {
  if (!s) return '';
  const m = s.match(/^\d{4}-(\d{2}-\d{2})/);
  return m ? m[1] : s.slice(0, 5);
}

/**
 * 社区验证投票（「还能不能薅」社区验证：薅到投「还能用」、踩坑投「已失效」，
 * 帮后来人确认状态；本设备防重复，统计云端共享/本地兜底）。
 * big=true 用于详情页（带引导文案），默认紧凑行用于卡片。
 */
export function VerifyWidget({ resourceId, big = false }: { resourceId: string; big?: boolean }) {
  const t = useT();
  const push = useToastStore((s) => s.push);
  const [stats, setStats] = useState<VerificationStats>({ ok: 0, dead: 0, total: 0, lastAt: null });
  const [voted, setVoted] = useState<'ok' | 'dead' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let m = true;
    getVerificationStats(resourceId).then((s) => {
      if (m) {
        setStats(s);
        // 本设备已投标记（防重复）：读 localStorage
        try {
          const map = JSON.parse(localStorage.getItem('ob_verifications') ?? '{}') as Record<
            string,
            { result: 'ok' | 'dead'; at: string }
          >;
          setVoted(map[resourceId]?.result ?? null);
        } catch {
          /* ignore */
        }
        setLoading(false);
      }
    });
    return () => {
      m = false;
    };
  }, [resourceId]);

  const vote = async (r: 'ok' | 'dead') => {
    if (voted) return;
    const res = await submitVerification(resourceId, r);
    if (!res.ok) {
      push(res.message ?? 'error', 'error');
      return;
    }
    setVoted(r);
    // 乐观更新统计
    setStats((s) => ({
      ok: s.ok + (r === 'ok' ? 1 : 0),
      dead: s.dead + (r === 'dead' ? 1 : 0),
      total: s.total + 1,
      lastAt: new Date().toISOString(),
    }));
    push(t('verify.thanks'), 'success');
  };

  if (loading) return null;

  const btnBase = 'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50';
  const btnOk = voted === 'ok' ? 'border-[#10b981] bg-[#10b9811a] text-[#10b981]' : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[#10b981] hover:text-[#10b981]';
  const btnDead = voted === 'dead' ? 'border-[#ef4444] bg-[#ef44441a] text-[#ef4444]' : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[#ef4444] hover:text-[#ef4444]';

  return (
    <div className={big ? 'rounded-xl border border-[var(--color-border)] p-3' : ''}>
      {big && (
        <p className="mb-2 flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
          <Icon name="Activity" size={14} />
          {t('verify.cta')}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button className={`${btnBase} ${btnOk}`} disabled={!!voted} onClick={() => vote('ok')} aria-label={t('verify.ok')}>
          <Icon name="ThumbsUp" size={13} /> {t('verify.ok')}
        </button>
        <button className={`${btnBase} ${btnDead}`} disabled={!!voted} onClick={() => vote('dead')} aria-label={t('verify.dead')}>
          <Icon name="AlertTriangle" size={13} /> {t('verify.dead')}
        </button>
        {stats.total > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-[var(--color-muted)]">
            <Icon name="Users" size={13} />
            {stats.total} {t('verify.people')}
            {stats.lastAt && (
              <span className="inline-flex items-center gap-0.5">
                · {t('verify.recent')} {fmtDate(stats.lastAt)}
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
