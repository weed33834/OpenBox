import { memo, useEffect, useMemo } from "react";
import { GitCompare, X, Trash2 } from "lucide-react";
import {
  sites as ALL_SITES,
  CATEGORY_META,
  TYPE_META,
  STATUS_META,
  deriveFeatures,
  type Site,
} from "@/data/sites";
import { useCompareStore, MAX_COMPARE } from "@/store/useCompareStore";
import { useFilterStore } from "@/store/useFilterStore";
import { useT, useI18n, translate, translateFeature } from "@/i18n/useI18n";
import type { Lang } from "@/i18n/translations";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { LIVE_COLOR, FEATURE_COLOR } from "@/lib/constants";

// O(1) 站点查找：模块级 Map，避免每次渲染都遍历 ALL_SITES
const SITE_MAP = new Map<string, Site>(ALL_SITES.map((s) => [s.id, s]));

interface CompareRow {
  label: string;
  cells: React.ReactNode[];
}

function CompareModal() {
  const isOpen = useCompareStore((s) => s.isOpen);
  const setOpen = useCompareStore((s) => s.setOpen);
  const compareIds = useCompareStore((s) => s.compareIds);
  const clear = useCompareStore((s) => s.clear);

  const liveStatus = useFilterStore((s) => s.liveStatus);
  const lang = useI18n((s) => s.lang);
  const t = useT();

  // ESC 关闭 + 滚动锁定（与 DetailDrawer 一致）
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, setOpen]);

  // 站点查找（useMemo 缓存，compareIds 变化时重算）
  const sitesList = useMemo(
    () => compareIds.map((id) => SITE_MAP.get(id)).filter((s): s is Site => !!s),
    [compareIds],
  );

  // 行数据（useMemo 缓存：站点列表 / 语言 / 实时状态变化时重算）
  const rows = useMemo<CompareRow[]>(() => {
    if (sitesList.length < 2) return [];
    const na = t("compare.na");
    return [
      {
        label: t("compare.siteName"),
        cells: sitesList.map((s) => (
          <span className="font-semibold text-cyber-text">{s.name}</span>
        )),
      },
      {
        label: t("compare.category"),
        cells: sitesList.map((s) => {
          const c = CATEGORY_META[s.category].color;
          return (
            <span className="font-mono text-[11px]" style={{ color: c }}>
              {translate(lang, `cat.${s.category}`)}
            </span>
          );
        }),
      },
      {
        label: t("tb.type"),
        cells: sitesList.map((s) => {
          const c = TYPE_META[s.type].color;
          return (
            <span className="font-mono text-[11px]" style={{ color: c }}>
              {translate(lang, `type.${s.type}`)}
            </span>
          );
        }),
      },
      {
        label: t("compare.features"),
        cells: sitesList.map((s) => (
          <div className="flex flex-wrap gap-1">
            {deriveFeatures(s).map((f, i) => {
              const c = FEATURE_COLOR[f] ?? "#94a3b8";
              return (
                <span
                  key={i}
                  className="rounded px-1.5 py-0.5 font-mono text-[10px]"
                  style={{ color: c, background: `${c}1a`, border: `1px solid ${c}33` }}
                >
                  {translateFeature(lang, f)}
                </span>
              );
            })}
          </div>
        )),
      },
      {
        label: t("live.dataStatus"),
        cells: sitesList.map((s) => {
          const c = STATUS_META[s.status].color;
          return (
            <span className="inline-flex items-center gap-1 font-mono text-[11px]" style={{ color: c }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
              {translate(lang, `status.${s.status}`)}
            </span>
          );
        }),
      },
      {
        label: t("compare.liveStatus"),
        cells: sitesList.map((s) => {
          const live = liveStatus[s.id] ?? "unknown";
          const c = LIVE_COLOR[live] ?? LIVE_COLOR.unknown;
          return (
            <span className="inline-flex items-center gap-1 font-mono text-[11px]" style={{ color: c }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
              {translate(lang, `live.${live}`)}
            </span>
          );
        }),
      },
      {
        label: t("drawer.models"),
        cells: sitesList.map((s) => (
          <div className="flex flex-wrap gap-1">
            {s.models.map((m, i) => (
              <span
                key={i}
                className="rounded border border-cyber-border bg-cyber-bg/60 px-1.5 py-0.5 font-mono text-[10px] text-cyber-text/80"
              >
                {m}
              </span>
            ))}
          </div>
        )),
      },
      {
        label: t("drawer.billing"),
        cells: sitesList.map((s) => (
          <span className="text-cyber-text/80">{s.billing ?? na}</span>
        )),
      },
      {
        label: t("drawer.apiBase"),
        cells: sitesList.map((s) => (
          <span className="break-all font-mono text-[11px] text-cyber-text/80">
            {s.apiBase ?? na}
          </span>
        )),
      },
    ];
  }, [sitesList, lang, t, liveStatus]);

  // 移动端竖向对照：把"按属性列"的 rows 转成"按站点卡片"，每卡内竖向列出属性。
  // 复用 rows，避免重复推导逻辑；首行（站点名）已在卡头展示，故剔除。
  const perSite = useMemo(
    () =>
      sitesList.map((site, i) => ({
        site,
        items: rows.slice(1).map((r) => ({ label: r.label, node: r.cells[i] })),
      })),
    [sitesList, rows],
  );

  const isMobile = useIsMobile();

  if (!isOpen) return null;

  const isComparable = sitesList.length >= 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-cyber-bg/70 backdrop-blur-sm animate-fade-in"
        aria-label={t("compare.close")}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-title"
        className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-cyber-border bg-cyber-surface shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部色条（青） */}
        <span
          className="absolute inset-x-0 top-0 h-0.5 bg-cyber-cyan"
          style={{ boxShadow: "0 0 12px #00e5ff" }}
        />

        {/* 头部：标题 + 数量徽标 + 关闭 */}
        <header className="flex items-center justify-between gap-3 border-b border-cyber-border p-4 sm:p-5">
          <div id="compare-title" className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-cyber-cyan" />
            <h2 className="font-display text-base font-bold text-cyber-text sm:text-lg">
              {t("compare.title")}
            </h2>
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-cyber-cyan/20 px-1.5 font-mono text-[11px] font-semibold text-cyber-cyan">
              {compareIds.length}
            </span>
          </div>
          <button
            data-autofocus
            onClick={() => setOpen(false)}
            className="shrink-0 rounded-lg border border-cyber-border bg-cyber-elevated p-2 text-cyber-muted transition-colors hover:text-cyber-text"
            aria-label={t("compare.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* 主体：对比表格（桌面） / 竖向卡片（移动端专门设计） / 空状态 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {isComparable ? (
            isMobile ? (
              <div className="space-y-3">
                {perSite.map(({ site, items }) => (
                  <MobileCompareCard key={site.id} site={site} items={items} lang={lang} />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-cyber-border">
                <div
                  className="grid min-w-fit"
                  style={{
                    gridTemplateColumns: `120px repeat(${sitesList.length}, minmax(160px, 1fr))`,
                  }}
                >
                  {rows.map((row, idx) => (
                    <Row key={row.label} label={row.label} cells={row.cells} stripe={idx % 2 === 1} />
                  ))}
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <GitCompare className="mb-3 h-10 w-10 text-cyber-muted/40" />
              <p className="font-display text-sm font-semibold text-cyber-text">
                {t("compare.empty.title")}
              </p>
              <p className="mt-1 font-mono text-xs text-cyber-muted">{t("compare.empty.desc")}</p>
            </div>
          )}
        </div>

        {/* 底部：已选数量 + 清空按钮 */}
        <footer className="flex items-center justify-between gap-3 border-t border-cyber-border p-4">
          <span className="font-mono text-[11px] text-cyber-muted">
            {t("compare.selected", { n: compareIds.length })} · {t("compare.max", { n: MAX_COMPARE })}
          </span>
          <button
            onClick={clear}
            disabled={compareIds.length === 0}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs transition-all",
              compareIds.length === 0
                ? "cursor-not-allowed border-cyber-border bg-cyber-elevated text-cyber-muted/40"
                : "border-cyber-dead/30 bg-cyber-dead/10 text-cyber-dead hover:bg-cyber-dead/20",
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t("compare.clear")}
          </button>
        </footer>
      </div>
    </div>
  );
}

/** 移动端对比卡片：每站一张，属性竖向排列，避免桌面并排表格在手机上被横向硬撑 */
function MobileCompareCard({
  site,
  items,
  lang,
}: {
  site: Site;
  items: { label: string; node: React.ReactNode }[];
  lang: Lang;
}) {
  const cat = CATEGORY_META[site.category];
  return (
    <div className="rounded-xl border border-cyber-border bg-cyber-surface/60 p-3">
      <div className="mb-2 flex items-center justify-between gap-2 border-b border-cyber-border/60 pb-2">
        <span className="min-w-0 truncate font-display text-sm font-semibold text-cyber-text">
          {site.name}
        </span>
        <span className="shrink-0 font-mono text-[11px]" style={{ color: cat.color }}>
          {translate(lang, `cat.${site.category}`)}
        </span>
      </div>
      <dl className="space-y-1.5">
        {items.map((it) => (
          <div key={it.label} className="flex items-start justify-between gap-3 text-xs">
            <dt className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-cyber-muted">
              {it.label}
            </dt>
            <dd className="min-w-0 text-right text-cyber-text/90">{it.node}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** 单元格：统一内边距与下边框，构成表格网格 */
function Cell({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div
      className={cn(
        "border-b border-cyber-border/50 px-3 py-2 text-xs text-cyber-text/90",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** 行：使用 display:contents 让其单元格直接参与父级 grid 布局；首列为粘性标签列 */
function Row({
  label,
  cells,
  stripe,
}: {
  label: string;
  cells: React.ReactNode[];
  stripe?: boolean;
}) {
  return (
    <div className="contents">
      <Cell className="sticky left-0 z-10 bg-cyber-surface font-mono text-[11px] uppercase tracking-wider text-cyber-muted">
        {label}
      </Cell>
      {cells.map((c, i) => (
        <Cell key={i} className={cn(stripe && "bg-cyber-elevated/40")}>
          {c}
        </Cell>
      ))}
    </div>
  );
}

export default memo(CompareModal);
