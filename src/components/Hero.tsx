import { memo, useEffect, useState } from "react";
import { RefreshCw, Activity, ShieldOff } from "lucide-react";
import { CATEGORY_META, sites as ALL_SITES, type Category } from "@/data/sites";
import { CATEGORY_COUNTS, useFilterStore } from "@/store/useFilterStore";
import { useRecheckHealth } from "@/hooks/useSiteHealth";
import { useT, useI18n, translate } from "@/i18n/useI18n";
import { cn } from "@/lib/utils";
import { CAT_ORDER } from "@/lib/constants";

// 全部站点数（不含黑名单，用于 Hero 顶部 "全部" 统计，避免把黑名单算进总数）
const TOTAL_NON_BLACKLIST = ALL_SITES.filter((s) => s.category !== "blacklist").length;

function StatCard({
  label,
  value,
  color,
  active,
  onClick,
}: {
  label: string;
  value: number;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      data-active={active}
      aria-pressed={active}
      aria-label={`${label} · ${value}`}
      className={cn(
        "group relative flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all duration-200",
        active
          ? "border-transparent"
          : "border-cyber-border bg-cyber-surface/60 hover:border-cyber-border/80 hover:bg-cyber-elevated",
      )}
      style={
        active
          ? {
              background: `linear-gradient(135deg, ${color}22, ${color}05)`,
              boxShadow: `0 0 0 1px ${color}, 0 0 18px ${color}33`,
            }
          : undefined
      }
    >
      <span
        className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
        style={{ background: color }}
      />
      <span
        className="font-mono text-xl font-bold leading-none sm:text-2xl"
        style={{ color }}
      >
        {value}
      </span>
      <span className="text-[10px] leading-tight text-cyber-muted group-hover:text-cyber-text sm:text-[11px]">
        {label}
      </span>
    </button>
  );
}

function LiveStatusBadge() {
  const liveProgress = useFilterStore((s) => s.liveProgress);
  const lastCheckedAt = useFilterStore((s) => s.lastCheckedAt);
  const recheck = useRecheckHealth();
  const t = useT();

  // 每 30 秒触发一次重渲染，让相对时间文案（"3 分钟前"）自动刷新
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const total = liveProgress.total || ALL_SITES.length;
  const checking = liveProgress.checked < total && liveProgress.checked !== 0;
  const pct = total ? Math.round((liveProgress.checked / total) * 100) : 0;

  const relativeTime = (() => {
    if (!lastCheckedAt) return null;
    const diff = now - lastCheckedAt;
    const min = Math.floor(diff / 60000);
    if (min < 1) return t("hero.checked.justNow");
    if (min < 60) return t("hero.checked.minAgo", { n: min });
    return t("hero.checked.hourAgo", { n: Math.floor(min / 60) });
  })();

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-full border border-cyber-border bg-cyber-surface/60 px-3 py-1.5 font-mono text-[11px] backdrop-blur sm:gap-3 sm:flex-nowrap">
      <span className="flex items-center gap-1.5 text-cyber-cyan">
        <Activity className="h-3.5 w-3.5" />
        {t("hero.live")}
      </span>
      {checking ? (
        <span className="flex items-center gap-2 text-cyber-muted">
          <span className="live-checking h-1.5 w-1.5 rounded-full bg-cyber-amber" />
          {liveProgress.checked}/{total}
          <span className="hidden h-1 w-16 overflow-hidden rounded-full bg-cyber-border sm:inline-block">
            <span
              className="block h-full bg-cyber-cyan transition-all"
              style={{ width: `${pct}%` }}
            />
          </span>
        </span>
      ) : relativeTime ? (
        <span className="text-cyber-muted">{t("hero.checked.doneAt", { time: relativeTime })}</span>
      ) : (
        <span className="text-cyber-muted">{t("hero.checked.pending")}</span>
      )}
      <button
        onClick={recheck}
        className="flex items-center gap-1 rounded-full border border-cyber-border px-2 py-0.5 text-cyber-muted transition-colors hover:border-cyber-cyan/50 hover:text-cyber-cyan"
        aria-label={t("hero.recheck")}
      >
        <RefreshCw className={cn("h-3 w-3", checking && "animate-spin")} />
        {t("hero.recheck")}
      </button>
    </div>
  );
}

function Hero() {
  const category = useFilterStore((s) => s.category);
  const setCategory = useFilterStore((s) => s.setCategory);
  const total = TOTAL_NON_BLACKLIST;
  const lang = useI18n((s) => s.lang);
  const t = useT();

  return (
    <section className="relative overflow-hidden border-b border-cyber-border">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyber-cyan/80 to-transparent" />

      {/* 压缩 Hero：py-8 md:py-12，让筛选栏进首屏 */}
      <div className="container relative py-6 md:py-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
          <div className="min-w-0">
            <div className="mb-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyber-border bg-cyber-surface/60 px-3 py-1 font-mono text-[11px] text-cyber-cyan backdrop-blur">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-cyber-green text-cyber-green" />
                {t("hero.badge")}
              </div>
            </div>
            <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
              <span className="bg-gradient-to-r from-cyber-cyan via-cyber-text to-cyber-magenta bg-clip-text text-transparent">
                {t("hero.title")}
              </span>
              <span className="mt-2 block font-mono text-sm font-normal text-cyber-muted md:ml-3 md:mt-0 md:inline md:text-lg">
                {t("hero.subtitle", { total })}
              </span>
            </h1>
            <p className="mt-3 max-w-2xl text-xs leading-relaxed text-cyber-muted sm:text-sm">
              {t("hero.desc")}
            </p>
          </div>
          <LiveStatusBadge />
        </div>

        {/* 分类统计卡片：移动端 2 列，桌面端 4-8 列 */}
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8">
          <StatCard
            label={t("cat.all")}
            value={total}
            color="#e6edf3"
            active={category === "all"}
            onClick={() => setCategory("all")}
          />
          {CAT_ORDER.map((key) => (
            <StatCard
              key={key}
              label={translate(lang, `cat.${key}`)}
              value={CATEGORY_COUNTS[key]}
              color={CATEGORY_META[key].color}
              active={category === key}
              onClick={() => setCategory(key as Category | "all")}
            />
          ))}
          {/* 黑名单卡片：跳转到黑名单页面 */}
          <a
            href="#/blacklist"
            className="group relative flex flex-col items-start gap-1 rounded-xl border border-cyber-border bg-cyber-surface/60 p-3 text-left transition-all duration-200 hover:border-cyber-dead/50 hover:bg-cyber-dead/10"
          >
            <ShieldOff
              className="absolute right-2 top-2 h-3 w-3"
              style={{ color: CATEGORY_META.blacklist.color }}
            />
            <span
              className="font-mono text-xl font-bold leading-none sm:text-2xl"
              style={{ color: CATEGORY_META.blacklist.color }}
            >
              {CATEGORY_COUNTS.blacklist}
            </span>
            <span className="text-[10px] leading-tight text-cyber-muted group-hover:text-cyber-dead sm:text-[11px]">
              {translate(lang, "cat.blacklist")}
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}

export default memo(Hero);
