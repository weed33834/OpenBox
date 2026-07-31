import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  ExternalLink,
  KeyRound,
  Coins,
  UserPlus,
  CreditCard,
  StickyNote,
  Cpu,
  Check,
  Copy,
  Clock,
  AlertTriangle,
  Heart,
  GitCompare,
  Activity,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
} from "lucide-react";
import { sites as ALL_SITES, CATEGORY_META, STATUS_META, TYPE_META, deriveFeatures, type Site } from "@/data/sites";
import { useFilterStore } from "@/store/useFilterStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useCompareStore } from "@/store/useCompareStore";
import { useToastStore } from "@/store/useToastStore";
import { useDeepHealthCheck } from "@/hooks/useSiteHealth";
import { useT, useI18n, translate, translateFeature } from "@/i18n/useI18n";
import { cn, copyToClipboard } from "@/lib/utils";
import { FEATURE_COLOR } from "@/lib/constants";
import { formatDateTime } from "@/lib/date-utils";
import { supabase, AUTH_ENABLED } from "@/lib/supabase";
import ReportModal from "@/components/ReportModal";

// O(1) 站点查找：模块级 Map，避免每次渲染都遍历 ALL_SITES
const SITE_MAP = new Map<string, Site>(ALL_SITES.map((s) => [s.id, s]));

function DetailDrawer() {
  const selectedId = useFilterStore((s) => s.selectedId);
  const setSelectedId = useFilterStore((s) => s.setSelectedId);
  const live = useFilterStore((s) => (selectedId ? s.liveStatus[selectedId] ?? "checking" : "checking"));
  const lastCheckedAt = useFilterStore((s) => s.lastCheckedAt);

  const lang = useI18n((s) => s.lang);
  const t = useT();

  const user = useAuthStore((s) => s.user);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const isFav = useFavoritesStore((s) => s.isFavorite(selectedId ?? ""));
  const toggleFavorite = useFavoritesStore((s) => s.toggle);
  const isComparing = useCompareStore((s) => s.isInCompare(selectedId ?? ""));
  const toggleCompare = useCompareStore((s) => s.toggle);
  const toast = useToastStore();
  const { checkSite: deepCheck, isChecking: isDeepChecking, result: deepResult } = useDeepHealthCheck();

  const site = selectedId ? (SITE_MAP.get(selectedId) ?? null) : null;
  const dialogRef = useRef<HTMLElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [copied, setCopied] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportCount, setReportCount] = useState(0);
  // 报告提交后自增，触发 reportCount 重新拉取（修复提交后计数陈旧的问题）
  const [reportVersion, setReportVersion] = useState(0);

  // 打开时记录焦点 + 聚焦抽屉；关闭时恢复焦点
  useEffect(() => {
    if (!site) return;
    previouslyFocused.current = document.activeElement as HTMLElement;
    // 聚焦关闭按钮
    const id = setTimeout(() => {
      const first = dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]");
      first?.focus();
    }, 50);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedId(null);
        return;
      }
      // focus trap：Tab 循环
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(id);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previouslyFocused.current?.focus?.();
    };
  }, [site, setSelectedId]);

  // 拉取该站点的反馈数量（通过 RPC 函数绕过 RLS，获取总数而非仅当前用户的）
  useEffect(() => {
    if (!selectedId || !supabase) return;
    void (async () => {
      try {
        const { data } = await supabase.rpc("get_site_report_count", {
          site_id_param: selectedId,
        });
        setReportCount(data ?? 0);
      } catch {
        /* 函数可能尚未部署 */
      }
    })();
  }, [selectedId, reportVersion]);

  // 复制提示计时器卸载时清理，避免设置已卸载组件的状态
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  // 特点标签：与 SiteCard 一致，useMemo 缓存避免每次渲染重算（须在条件 return 之前调用）
  const features = useMemo(() => (site ? deriveFeatures(site) : []), [site]);

  if (!site) return null;

  const catMeta = CATEGORY_META[site.category];
  const statusMeta = STATUS_META[site.status];
  const typeMeta = TYPE_META[site.type];

  const catLabel = translate(lang, `cat.${site.category}`);
  const typeLabel = translate(lang, `type.${site.type}`);
  const statusLabel = translate(lang, `status.${site.status}`);
  const liveLabel = translate(lang, `live.${live}`);

  const handleCopy = async (text: string) => {
    try {
      await copyToClipboard(text);
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 1500);
      toast.success(t("toast.copy.success"));
    } catch {
      toast.error(t("toast.copy.error"));
    }
  };

  const handleFavoriteToggle = () => {
    const wasFav = isFav;
    toggleFavorite(site.id);
    toast.success(wasFav ? t("toast.favorite.removed") : t("toast.favorite.added"));
  };

  const handleCompareToggle = () => {
    const wasComparing = isComparing;
    if (!wasComparing && useCompareStore.getState().compareIds.length >= 4) {
      toast.warning(t("toast.compare.limit"));
      return;
    }
    toggleCompare(site.id);
    toast.success(wasComparing ? t("toast.compare.removed") : t("toast.compare.added"));
  };

  const handleDeepCheck = async () => {
    if (!site.apiBase) {
      toast.info(t("health.noApiBase"));
      return;
    }
    toast.info(t("health.checking"));
    const result = await deepCheck(site);
    if (result.status === "up") {
      toast.success(t("health.success", { code: String(result.httpStatus ?? 200) }));
    } else if (result.status === "down") {
      if (result.message.includes("Timeout")) {
        toast.error(t("health.timeout"));
      } else {
        toast.error(t("health.failure", { code: String(result.httpStatus ?? 0) }));
      }
    } else {
      toast.warning(t("health.networkError"));
    }
  };

  // 实时状态条文案拼接
  const lastCheckStr = lastCheckedAt
    ? ` · ${translate(lang, "live.lastCheck")} ${formatDateTime(lastCheckedAt, lang)}`
    : "";
  const probeLabel = live === "down" ? translate(lang, "live.serverProbe") : translate(lang, "live.endpointProbe");

  // 访问按钮文案
  const isDown = live === "down";
  const isForumLink = site.url.includes("linux.do/t/");
  const isGithubLink = site.url.includes("github.com/");
  const btnClass = isDown
    ? "border-cyber-dead/60 bg-cyber-dead/10 text-cyber-dead hover:bg-cyber-dead/20"
    : "bg-cyber-cyan text-cyber-bg hover:shadow-glow-cyan";
  const btnText = isDown
    ? t("drawer.visitDown")
    : isForumLink
      ? t("drawer.visitForum")
      : isGithubLink
        ? t("drawer.visitGithub")
        : t("drawer.visit");

  // 提示文案拼接
  const hintParts = [t("drawer.hintTitle")];
  if (live === "down") hintParts.push(t("drawer.hintDown"));
  if (live === "unknown") hintParts.push(t("drawer.hintUnknown"));
  hintParts.push(t("drawer.hintAd"));

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        onClick={() => setSelectedId(null)}
        className="absolute inset-0 bg-cyber-bg/70 backdrop-blur-sm animate-fade-in"
        aria-label={t("drawer.close")}
      />

      <aside
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="relative flex h-full w-full max-w-lg flex-col border-l border-cyber-border bg-cyber-surface shadow-2xl animate-slide-in-right"
        style={{ animationDuration: "0.3s" }}
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className="absolute inset-x-0 top-0 h-0.5"
          style={{ background: catMeta.color, boxShadow: `0 0 12px ${catMeta.color}` }}
        />

        {/* 头部 */}
        <header className="flex items-start justify-between gap-3 border-b border-cyber-border p-4 sm:p-5">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
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
              <span
                className="flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px]"
                style={{
                  color: statusMeta.color,
                  borderColor: `${statusMeta.color}55`,
                  background: `${statusMeta.color}11`,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: statusMeta.color }}
                />
                {translate(lang, "live.dataStatus")} {statusLabel}
              </span>
            </div>
            <h2 id="drawer-title" className="font-display text-xl font-bold text-cyber-text sm:text-2xl">
              {site.name}
            </h2>
            <p className="mt-1 break-all font-mono text-xs text-cyber-muted">{site.url}</p>
            {/* 名字下方简短介绍 + 特点标签 */}
            {site.tagline && (
              <p className="mt-2 text-[13px] leading-relaxed text-cyber-text/80">{site.tagline}</p>
            )}
            {features.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {features.map((f, i) => {
                  const c = FEATURE_COLOR[f] ?? "#94a3b8";
                  return (
                    <span
                      key={i}
                      className="rounded px-2 py-0.5 font-mono text-[11px] font-medium"
                      style={{ color: c, background: `${c}1a`, border: `1px solid ${c}33` }}
                    >
                      {translateFeature(lang, f)}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={handleFavoriteToggle}
              className={cn(
                "rounded-lg border p-2 transition-all",
                isFav
                  ? "border-cyber-dead/30 bg-cyber-dead/10 text-cyber-dead hover:bg-cyber-dead/20"
                  : "border-cyber-border bg-cyber-elevated text-cyber-muted hover:text-cyber-dead",
              )}
              aria-label={isFav ? t("favorite.remove") : t("favorite.add")}
            >
              <Heart
                className={cn("h-4 w-4", isFav && "fill-cyber-dead")}
              />
            </button>
            <button
              onClick={handleCompareToggle}
              className={cn(
                "rounded-lg border p-2 transition-all",
                isComparing
                  ? "border-cyber-violet/30 bg-cyber-violet/10 text-cyber-violet hover:bg-cyber-violet/20"
                  : "border-cyber-border bg-cyber-elevated text-cyber-muted hover:text-cyber-violet",
              )}
              aria-label={isComparing ? t("compare.remove") : t("compare.add")}
              title={isComparing ? t("compare.remove") : t("compare.add")}
            >
              <GitCompare className={cn("h-4 w-4", isComparing && "fill-cyber-violet/30")} />
            </button>
            <button
              data-autofocus
              onClick={() => setSelectedId(null)}
              className="shrink-0 rounded-lg border border-cyber-border bg-cyber-elevated p-2 text-cyber-muted transition-colors hover:text-cyber-text"
              aria-label={t("drawer.close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* 滚动内容 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {AUTH_ENABLED && !user && (
            <div className="relative mb-4 overflow-hidden rounded-xl border border-cyber-amber/30 bg-cyber-amber/5 p-5 text-center">
              <div className="relative z-10">
                <p className="mb-1 font-display text-base font-semibold text-cyber-amber">
                  {t("gate.title")}
                </p>
                <p className="mb-3 text-sm text-cyber-muted">
                  {t("gate.desc")}
                </p>
                <button
                  onClick={() => openAuthModal()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-cyber-amber px-4 py-2 text-sm font-semibold text-cyber-bg transition-all hover:shadow-glow-amber"
                >
                  {t("gate.loginBtn")}
                </button>
              </div>
            </div>
          )}

          {/* 实时检测状态条 */}
          <div
            className={cn(
              "mb-4 flex items-center gap-2 rounded-lg border p-3 font-mono text-xs",
              live === "up"
                ? "border-cyber-green/40 bg-cyber-green/5 text-cyber-green"
                : live === "down"
                  ? "border-cyber-dead/40 bg-cyber-dead/5 text-cyber-dead"
                  : "border-cyber-border bg-cyber-elevated text-cyber-muted",
              live === "checking" && "live-checking",
            )}
          >
            {live === "down" ? (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            ) : (
              <Clock className="h-4 w-4 shrink-0" />
            )}
            <span className="min-w-0 break-words">
              {translate(lang, "live.realtime")}：{liveLabel}{lastCheckStr}
            </span>
            <span className="ml-auto hidden shrink-0 text-cyber-muted/70 sm:inline">{probeLabel}</span>
          </div>

          {/* 深度健康检测按钮 */}
          {site.apiBase && (
            <div className="mb-4">
              <button
                onClick={handleDeepCheck}
                disabled={isDeepChecking}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 font-mono text-xs font-semibold transition-all",
                  "border-cyber-cyan/30 bg-cyber-cyan/5 text-cyber-cyan hover:bg-cyber-cyan/10",
                  isDeepChecking && "cursor-wait opacity-60",
                )}
              >
                <Activity className={cn("h-3.5 w-3.5", isDeepChecking && "animate-spin")} />
                {isDeepChecking ? t("health.checkingBtn") : t("health.checkBtn")}
              </button>
              {deepResult && (
                <div className={cn(
                  "mt-2 rounded-lg border p-2.5 font-mono text-[11px] leading-relaxed",
                  deepResult.status === "up"
                    ? "border-cyber-green/30 bg-cyber-green/5 text-cyber-green"
                    : deepResult.status === "down"
                      ? "border-cyber-dead/30 bg-cyber-dead/5 text-cyber-dead"
                      : "border-cyber-amber/30 bg-cyber-amber/5 text-cyber-amber",
                )}>
                  <span className="flex items-center gap-1.5">
                    {deepResult.status === "up" ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    {deepResult.message}
                    {deepResult.latency && <span className="text-cyber-muted">· {deepResult.latency}ms</span>}
                  </span>
                  {deepResult.status === "unknown" && (
                    <p className="mt-1 text-cyber-muted">{t("health.corsNote")}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 描述 */}
          <p className="mb-5 text-sm leading-relaxed text-cyber-text/90">{site.desc}</p>

          {/* 优势 / 劣势 / 使用建议 */}
          {(site.pros?.length || site.cons?.length || site.tips) && (
            <div className="mb-5 space-y-3">
              {site.pros && site.pros.length > 0 && (
                <div className="rounded-lg border border-cyber-green/20 bg-cyber-green/5 p-3">
                  <h4 className="mb-1.5 flex items-center gap-1.5 font-display text-xs font-semibold uppercase tracking-wider text-cyber-green">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    {t("drawer.pros")}
                  </h4>
                  <ul className="space-y-1 text-xs leading-relaxed text-cyber-text/80">
                    {site.pros.map((p, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="mt-0.5 text-cyber-green">+</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {site.cons && site.cons.length > 0 && (
                <div className="rounded-lg border border-cyber-dead/20 bg-cyber-dead/5 p-3">
                  <h4 className="mb-1.5 flex items-center gap-1.5 font-display text-xs font-semibold uppercase tracking-wider text-cyber-dead">
                    <ThumbsDown className="h-3.5 w-3.5" />
                    {t("drawer.cons")}
                  </h4>
                  <ul className="space-y-1 text-xs leading-relaxed text-cyber-text/80">
                    {site.cons.map((c, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="mt-0.5 text-cyber-dead">-</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {site.tips && (
                <div className="rounded-lg border border-cyber-amber/20 bg-cyber-amber/5 p-3">
                  <h4 className="mb-1.5 flex items-center gap-1.5 font-display text-xs font-semibold uppercase tracking-wider text-cyber-amber">
                    <Lightbulb className="h-3.5 w-3.5" />
                    {t("drawer.tips")}
                  </h4>
                  <p className="text-xs leading-relaxed text-cyber-text/80">{site.tips}</p>
                </div>
              )}
            </div>
          )}

          {/* 访问按钮：根据实时状态变色，离线时给警告 */}
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`mb-3 flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 font-mono text-sm font-semibold transition-all ${btnClass}`}
          >
            {isDown ? <AlertTriangle className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
            {btnText}
          </a>

          {/* 提示：实时检测的局限性 */}
          <div className="mb-6 rounded-lg border border-cyber-border bg-cyber-elevated/50 p-2.5 font-mono text-[11px] leading-relaxed text-cyber-muted">
            ⚠ {hintParts.join(" ")}
          </div>

          {/* 支持的模型 */}
          <section className="mb-6">
            <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-cyber-cyan">
              <Cpu className="h-4 w-4" />
              {t("drawer.models")}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {site.models.map((m, i) => (
                <span
                  key={i}
                  className="rounded border border-cyber-border bg-cyber-elevated px-2 py-1 font-mono text-xs text-cyber-text/90"
                >
                  {m}
                </span>
              ))}
            </div>
          </section>

          {/* 详情字段 */}
          <section className="space-y-3">
            <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-cyber-cyan">
              {t("drawer.details")}
            </h3>

            {site.apiBase && (
              <DetailRow
                icon={<KeyRound className="h-4 w-4" />}
                label={t("drawer.apiBase")}
                value={site.apiBase}
                mono
                copyable
                copied={copied}
                onCopy={() => handleCopy(site.apiBase!)}
                copyLabel={t("drawer.copy")}
                copiedLabel={t("drawer.copied")}
                copyAria={t("drawer.copyAria", { label: t("drawer.apiBase") })}
              />
            )}
            {site.billing && (
              <DetailRow
                icon={<Coins className="h-4 w-4" />}
                label={t("drawer.billing")}
                value={site.billing}
                copyLabel={t("drawer.copy")}
                copiedLabel={t("drawer.copied")}
                copyAria={t("drawer.copyAria", { label: t("drawer.billing") })}
              />
            )}
            {site.register && (
              <DetailRow
                icon={<UserPlus className="h-4 w-4" />}
                label={t("drawer.register")}
                value={site.register}
                copyLabel={t("drawer.copy")}
                copiedLabel={t("drawer.copied")}
                copyAria={t("drawer.copyAria", { label: t("drawer.register") })}
              />
            )}
            {site.payment && (
              <DetailRow
                icon={<CreditCard className="h-4 w-4" />}
                label={t("drawer.payment")}
                value={site.payment}
                copyLabel={t("drawer.copy")}
                copiedLabel={t("drawer.copied")}
                copyAria={t("drawer.copyAria", { label: t("drawer.payment") })}
              />
            )}
            {site.note && (
              <DetailRow
                icon={<StickyNote className="h-4 w-4" />}
                label={t("drawer.note")}
                value={site.note}
                copyLabel={t("drawer.copy")}
                copiedLabel={t("drawer.copied")}
                copyAria={t("drawer.copyAria", { label: t("drawer.note") })}
              />
            )}
          </section>
        </div>

        {/* 底部 */}
        <footer className="flex items-center justify-between border-t border-cyber-border p-4 font-mono text-[11px] leading-relaxed text-cyber-muted">
          <span>{t("drawer.footer", { id: site.id })}</span>
          <button
            onClick={() => setReportOpen(true)}
            className="flex items-center gap-1.5 text-cyber-muted/50 transition-colors hover:text-cyber-muted"
          >
            {t("gate.reportIssue")}
            {reportCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-cyber-dead/20 px-1 text-[10px] font-semibold text-cyber-dead">
                {reportCount}
              </span>
            )}
          </button>
        </footer>
      </aside>
      <ReportModal
        siteId={site.id}
        siteName={site.name}
        isOpen={reportOpen}
        onClose={() => {
          setReportOpen(false);
          // 关闭报告弹窗时刷新反馈计数，避免提交后计数陈旧
          setReportVersion((v) => v + 1);
        }}
      />
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  mono,
  copyable,
  copied,
  onCopy,
  copyLabel,
  copiedLabel,
  copyAria,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
  copied?: boolean;
  onCopy?: () => void;
  copyLabel: string;
  copiedLabel: string;
  copyAria: string;
}) {
  return (
    <div className="rounded-lg border border-cyber-border bg-cyber-elevated/50 p-3">
      <div className="mb-1 flex items-center gap-2 text-cyber-muted">
        {icon}
        <span className="font-mono text-[11px] uppercase tracking-wider">{label}</span>
        {copyable && (
          <button
            onClick={onCopy}
            className="ml-auto flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[11px] text-cyber-cyan transition-colors hover:bg-cyber-surface"
            aria-label={copyAria}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                {copiedLabel}
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                {copyLabel}
              </>
            )}
          </button>
        )}
      </div>
      <p className={`text-sm text-cyber-text/90 ${mono ? "break-all font-mono" : ""}`}>{value}</p>
    </div>
  );
}

export default memo(DetailDrawer);
