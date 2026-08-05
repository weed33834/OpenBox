import { useMemo } from 'react';
import { useI18nStore } from '@/i18n/useI18n';
import { slogans } from '@/i18n/slogans';

/**
 * 页面跳转过渡加载层：圆形旋转光环 + 中心 Logo（品牌露出）+ 随机语录。
 * 时长由 App 控制（引导页→主站长 3s，页面间 1.5s）。
 */
export function PageLoader() {
  const lang = useI18nStore((s) => s.lang);

  // 每次渲染随机一条语录（按当前语言）
  const slogan = useMemo(() => {
    const pool = slogans[lang] ?? slogans.zh;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [lang]);

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-8"
      style={{ background: 'var(--color-bg)' }}
      role="status"
      aria-label="loading"
    >
      {/* 圆形光环 + 中心 Logo */}
      <div className="relative flex h-28 w-28 items-center justify-center">
        {/* 外圈旋转光环（主色） */}
        <span
          className="absolute inset-0 rounded-full border-4 border-transparent"
          style={{ borderTopColor: 'var(--color-primary)', borderRightColor: 'var(--color-primary-soft)', animation: 'spin 0.9s linear infinite' }}
        />
        {/* 外圈慢速反向光环（层次感） */}
        <span
          className="absolute -inset-3 rounded-full border-2 border-transparent"
          style={{ borderBottomColor: 'var(--color-primary-soft)', animation: 'spin 2.4s linear infinite reverse' }}
        />
        {/* 中心 Logo：呼吸脉冲 */}
        <span
          className="flex h-16 w-16 items-center justify-center rounded-2xl text-4xl font-black"
          style={{
            background: 'var(--color-primary)',
            color: 'var(--color-primary-fg)',
            boxShadow: '0 8px 24px -6px var(--color-primary-soft)',
            animation: 'breathe 1.6s ease-in-out infinite',
          }}
        >
          O
        </span>
      </div>

      {/* 站点名 + 语录 */}
      <div className="flex flex-col items-center gap-2 px-8 text-center">
        <p className="text-xl font-bold tracking-tight text-[var(--color-fg)]" style={{ animation: 'slogan-in 0.5s ease-out both' }}>
          OpenBox
        </p>
        <p
          className="max-w-xs text-sm leading-relaxed text-[var(--color-muted)]"
          style={{ animation: 'slogan-in 0.5s ease-out 0.15s both' }}
        >
          {slogan}
        </p>
      </div>
    </div>
  );
}
