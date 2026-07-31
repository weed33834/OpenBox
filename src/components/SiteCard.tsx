import { memo, useMemo } from "react";
import { ExternalLink, KeyRound, ChevronRight, Lock, Heart, GitCompare } from "lucide-react";
import type { Site } from "@/data/sites";
import { CATEGORY_META, TYPE_META, deriveFeatures } from "@/data/sites";
import { useFilterStore } from "@/store/useFilterStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useCompareStore } from "@/store/useCompareStore";
import { useToastStore } from "@/store/useToastStore";
import { AUTH_ENABLED } from "@/lib/supabase";
import { FEATURE_COLOR, LIVE_COLOR } from "@/lib/constants";
import { useT, useI18n, translate, translateFeature } from "@/i18n/useI18n";
import { cn } from "@/lib/utils";

interface Props {
  site: Site;
  index: number;
  /** 上报问题回调：由 SiteGrid 统一接管 ReportModal，避免每张卡片各挂一个弹窗 */
  onReport?: (siteId: string) => void;
}

function SiteCard({ site, index, onReport }: Props) {
  const setSelectedId = useFilterStore((s) => s.setSelectedId);
  const live = useFilterStore((s) => s.liveStatus[site.id] ?? "checking");

  const lang = useI18n((s) => s.lang);
  const t = useT();

  const user = useAuthStore((s) => s.user);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const isFav = useFavoritesStore((s) => s.isFavorite(site.id));
  const toggleFavorite = useFavoritesStore((s) => s.toggle);
  const isComparing = useCompareStore((s) => s.isInCompare(site.id));
  const toggleCompare = useCompareStore((s) => s.toggle);
  const toast = useToastStore();

  const catMeta = CATEGORY_META[site.category];
  const typeMeta = TYPE_META[site.type];
  const liveColor = LIVE_COLOR[live];
  const liveLabel = translate(lang, `live.${live}`);

  // 特点标签（显式优先，缺失时自动从 type/billing/note 推导）
  const features = useMemo(() => deriveFeatures(site).slice(0, 5), [site]);
  // 名字下方的简短介绍：优先 tagline，回退到 desc
  const tagline = site.tagline ?? site.desc;

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(site.url, "_blank", "noopener,noreferrer");
  };

  const visitAria = t("card.visitAria", { name: site.name });
  const catLabel = translate(lang, `cat.${site.category}`);
  const typeLabel = translate(lang, `type.${site.type}`);

  const handleCardClick = () => {
    if (AUTH_ENABLED && !user) {
      openAuthModal();
      return;
    }
    setSelectedId(site.id);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={onKey}
      aria-label={t("card.ariaTemplate", { name: site.name, cat: catLabel, live: liveLabel })}
      className="group relative flex cursor-pointer flex-col gap-3 rounded-xl border border-cyber-border bg-cyber-surface/70 p-4 transition-all duration-200 card-enter card-glow hover:-translate-y-0.5 hover:border-cyber-cyan/40 hover:bg-cyber-elevated hover:shadow-card"
      style={{ ["--i" as string]: Math.min(index, 16) }}
    >
        {/* 顶部色条 */}
        <span
          className="absolute inset-x-0 top-0 h-px opacity-60 transition-opacity group-hover:opacity-100"
          style={{
            background: `linear-gradient(90deg, transparent, ${catMeta.color}, transparent)`,
          }}
        />

        {/* 标题行 */}
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              <span
                className="rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider"
                style={{
                  color: catMeta.color,
                  background: `${catMeta.color}1a`,
                  border: `1px solid ${catMeta.color}33`,
                }}
              >
                {catLabel}
              </span>
              <span
                className="rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold"
                style={{ color: typeMeta.color, background: `${typeMeta.color}1a` }}
              >
                {typeLabel}
              </span>
            </div>
            <h3 className="truncate font-display text-base font-semibold text-cyber-text group-hover:text-cyber-cyan sm:text-lg">
              {site.name}
            </h3>
            <p className="mt-0.5 truncate font-mono text-xs text-cyber-muted">
              {site.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </p>
            {/* 名字下方简短介绍：一句话定位 */}
            {tagline && (
              <p className="mt-1.5 line-clamp-1 text-[12px] leading-tight text-cyber-text/70">
                {tagline}
              </p>
            )}
          </div>

          {/* 实时状态点（右上角，形状固定，颜色+文字区分） */}
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[11px]",
                live === "checking" && "live-checking",
              )}
              style={{
                color: liveColor,
                borderColor: `${liveColor}55`,
                background: `${liveColor}11`,
              }}
              title={`${translate(lang, "live.realtime")}：${liveLabel}`}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: liveColor }}
              />
              {liveLabel}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const wasFav = isFav;
                  toggleFavorite(site.id);
                  toast.success(wasFav ? t("toast.favorite.removed") : t("toast.favorite.added"));
                }}
                className={cn(
                  "flex min-h-[44px] min-w-[44px] items-center justify-center rounded p-2 transition-all",
                  isFav
                    ? "text-cyber-dead hover:text-cyber-dead/80"
                    : "text-cyber-muted/40 hover:text-cyber-dead",
                )}
                aria-label={isFav ? t("favorite.remove") : t("favorite.add")}
              >
                <Heart
                  className={cn("h-3.5 w-3.5", isFav && "fill-cyber-dead")}
                />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const wasComparing = isComparing;
                  if (!wasComparing && useCompareStore.getState().compareIds.length >= 4) {
                    toast.warning(t("toast.compare.limit"));
                    return;
                  }
                  toggleCompare(site.id);
                  toast.success(wasComparing ? t("toast.compare.removed") : t("toast.compare.added"));
                }}
                className={cn(
                  "flex min-h-[44px] min-w-[44px] items-center justify-center rounded p-2 transition-all",
                  isComparing
                    ? "text-cyber-violet hover:text-cyber-violet/80"
                    : "text-cyber-muted/40 hover:text-cyber-violet",
                )}
                aria-label={isComparing ? t("compare.remove") : t("compare.add")}
                title={isComparing ? t("compare.remove") : t("compare.add")}
              >
                <GitCompare className={cn("h-3.5 w-3.5", isComparing && "fill-cyber-violet/30")} />
              </button>
              <button
                onClick={handleOpen}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded p-2 text-cyber-muted transition-all hover:bg-cyber-elevated hover:text-cyber-cyan"
                aria-label={visitAria}
                title={live === "down" ? t("card.downHint") : visitAria}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 特点标签：免费 / 签到 / 免费额度 / 国产 / 低延迟 …（用户最关心的痛点） */}
        {features.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {features.map((f, i) => {
              const c = FEATURE_COLOR[f] ?? "#94a3b8";
              return (
                <span
                  key={i}
                  className="rounded px-1.5 py-0.5 font-mono text-[10px] font-medium"
                  style={{ color: c, background: `${c}1a`, border: `1px solid ${c}33` }}
                >
                  {translateFeature(lang, f)}
                </span>
              );
            })}
          </div>
        )}

        {/* 描述（详细） */}
        <p className="line-clamp-2 text-sm leading-relaxed text-cyber-text/80">
          {site.desc}
        </p>

        {/* 模型标签 */}
        <div className="flex flex-wrap gap-1">
          {site.models.slice(0, 4).map((m, i) => (
            <span
              key={i}
              className="rounded border border-cyber-border bg-cyber-bg/50 px-1.5 py-0.5 font-mono text-[11px] text-cyber-muted"
            >
              {m}
            </span>
          ))}
          {site.models.length > 4 && (
            <span className="rounded border border-cyber-border bg-cyber-bg/50 px-1.5 py-0.5 font-mono text-[11px] text-cyber-muted">
              +{site.models.length - 4}
            </span>
          )}
        </div>

        {/* 底部信息：常显 affordance（移动端友好） */}
        <div className="mt-auto flex items-center justify-between border-t border-cyber-border/60 pt-2">
          <div className="flex min-w-0 items-center gap-2 font-mono text-[11px] text-cyber-muted sm:gap-3">
            {site.apiBase && (
              <span className="flex shrink-0 items-center gap-1 text-cyber-green/80">
                <KeyRound className="h-3 w-3" />
                {t("card.api")}
              </span>
            )}
            {site.billing && (
              <span className="truncate" title={site.billing}>
                {site.billing}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReport?.(site.id);
              }}
              className="font-mono text-[11px] text-cyber-muted/50 transition-colors hover:text-cyber-muted"
            >
              {t("gate.reportIssue")}
            </button>
            <span className="flex shrink-0 items-center gap-0.5 font-mono text-[11px] text-cyber-cyan/70 group-hover:text-cyber-cyan">
              {user ? (
                <>
                  {t("card.detail")}
                  <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" />
                  {t("gate.loginBtn")}
                </>
              )}
            </span>
          </div>
        </div>
    </article>
  );
}

export default memo(SiteCard);
