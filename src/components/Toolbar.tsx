import { memo, useEffect, useState } from "react";
import { Search, X, SlidersHorizontal, ArrowUpDown, ChevronDown, RotateCcw, ShieldOff, GitCompare } from "lucide-react";
import { useFilterStore, useFilteredCount, CATEGORY_COUNTS, type SortKey } from "@/store/useFilterStore";
import { useCompareStore } from "@/store/useCompareStore";
import { TYPE_META, STATUS_META, type SiteType, type Status } from "@/data/sites";
import { useT, useI18n, translate } from "@/i18n/useI18n";
import { cn } from "@/lib/utils";

const SORT_KEYS: SortKey[] = ["default", "name", "status"];

/* 类型 / 状态筛选 chips：移动端与桌面端共用，靠 md: 断点切换"纵向分组 / 横向内联" */
function FilterChips() {
  const type = useFilterStore((s) => s.type);
  const setType = useFilterStore((s) => s.setType);
  const status = useFilterStore((s) => s.status);
  const setStatus = useFilterStore((s) => s.setStatus);
  const lang = useI18n((s) => s.lang);
  const t = useT();

  return (
    <>
      <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:gap-x-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-cyber-muted">
          {t("tb.type")}
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            className="chip"
            data-active={type === "all"}
            style={type === "all" ? { background: "#e6edf3" } : undefined}
            onClick={() => setType("all")}
          >
            {t("tb.all")}
          </button>
          {(Object.keys(TYPE_META) as SiteType[]).map((k) => (
            <button
              key={k}
              className="chip"
              data-active={type === k}
              style={type === k ? { background: TYPE_META[k].color } : undefined}
              onClick={() => setType(k)}
            >
              {translate(lang, `type.${k}`)}
            </button>
          ))}
        </div>
      </div>

      <span className="hidden h-4 w-px bg-cyber-border md:block" aria-hidden />

      <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:gap-x-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-cyber-muted sm:ml-1">
          {t("tb.status")}
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            className="chip"
            data-active={status === "all"}
            style={status === "all" ? { background: "#e6edf3" } : undefined}
            onClick={() => setStatus("all")}
          >
            {t("tb.all")}
          </button>
          {(Object.keys(STATUS_META) as Status[]).map((k) => (
            <button
              key={k}
              className="chip"
              data-active={status === k}
              style={
                status === k
                  ? { background: STATUS_META[k].color, color: "#0a0e14" }
                  : undefined
              }
              onClick={() => setStatus(k)}
            >
              {translate(lang, `status.${k}`)}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/* 次要操作：仅 API 开关 / 清空 / 黑名单入口 / 对比入口。onClose 在移动端弹层内点击后关闭弹层 */
function FilterActions({ onClose }: { onClose?: () => void }) {
  const keyword = useFilterStore((s) => s.keyword);
  const model = useFilterStore((s) => s.model);
  const type = useFilterStore((s) => s.type);
  const status = useFilterStore((s) => s.status);
  const onlyApi = useFilterStore((s) => s.onlyApi);
  const setOnlyApi = useFilterStore((s) => s.setOnlyApi);
  const category = useFilterStore((s) => s.category);
  const reset = useFilterStore((s) => s.reset);
  const compareIds = useCompareStore((s) => s.compareIds);
  const setCompareOpen = useCompareStore((s) => s.setOpen);
  const lang = useI18n((s) => s.lang);
  const t = useT();

  const hasFilter =
    keyword !== "" ||
    model !== "" ||
    type !== "all" ||
    status !== "all" ||
    onlyApi ||
    category !== "all";

  return (
    <div className="flex flex-wrap items-center gap-2 md:ml-auto">
      {/* 仅 API toggle（独立强调） */}
      <button
        onClick={() => setOnlyApi(!onlyApi)}
        aria-pressed={onlyApi}
        className={cn(
          "flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] transition-colors",
          onlyApi
            ? "border-cyber-cyan/60 bg-cyber-cyan/10 text-cyber-cyan"
            : "border-cyber-border bg-cyber-surface/60 text-cyber-muted hover:text-cyber-text",
        )}
      >
        <span
          className={cn(
            "flex h-3.5 w-6 items-center rounded-full p-0.5 transition-colors",
            onlyApi ? "bg-cyber-cyan" : "bg-cyber-border",
          )}
        >
          <span
            className={cn(
              "h-2.5 w-2.5 rounded-full bg-cyber-bg transition-transform",
              onlyApi && "translate-x-2.5",
            )}
          />
        </span>
        {t("tb.onlyApi")}
      </button>

      {hasFilter && (
        <button
          onClick={() => {
            reset();
            onClose?.();
          }}
          className="flex items-center gap-1 rounded-full border border-cyber-magenta/40 bg-cyber-magenta/10 px-2.5 py-1.5 font-mono text-[11px] text-cyber-magenta transition-colors hover:bg-cyber-magenta/20"
        >
          <RotateCcw className="h-3 w-3" />
          {t("tb.clearFilter")}
        </button>
      )}

      {/* 黑名单入口 */}
      <a
        href="#/blacklist"
        onClick={onClose}
        className="flex items-center gap-1.5 rounded-full border border-cyber-dead/40 bg-cyber-dead/10 px-3 py-1.5 font-mono text-[11px] text-cyber-dead transition-colors hover:bg-cyber-dead/20"
      >
        <ShieldOff className="h-3.5 w-3.5" />
        {translate(lang, "cat.blacklist")}
        <span className="rounded bg-cyber-dead/20 px-1.5 py-0.5 text-[10px]">{CATEGORY_COUNTS.blacklist}</span>
      </a>

      {/* 站点对比入口：选中站点后显示 */}
      {compareIds.length > 0 && (
        <button
          onClick={() => {
            setCompareOpen(true);
            onClose?.();
          }}
          className="flex items-center gap-1.5 rounded-full border border-cyber-violet/40 bg-cyber-violet/10 px-3 py-1.5 font-mono text-[11px] text-cyber-violet transition-colors hover:bg-cyber-violet/20"
        >
          <GitCompare className="h-3.5 w-3.5" />
          {t("compare.open", { n: compareIds.length })}
        </button>
      )}
    </div>
  );
}

function Toolbar() {
  // 精确切片订阅，避免 selectedId/liveStatus 变化触发重渲染
  const keyword = useFilterStore((s) => s.keyword);
  const setKeyword = useFilterStore((s) => s.setKeyword);
  const model = useFilterStore((s) => s.model);
  const setModel = useFilterStore((s) => s.setModel);
  const sort = useFilterStore((s) => s.sort);
  const setSort = useFilterStore((s) => s.setSort);
  const type = useFilterStore((s) => s.type);
  const status = useFilterStore((s) => s.status);
  const onlyApi = useFilterStore((s) => s.onlyApi);
  const category = useFilterStore((s) => s.category);

  const t = useT();

  const [sheetOpen, setSheetOpen] = useState(false);

  // 搜索输入本地态 + debounce 写入 store（避免逐字符重渲染整列表）
  const [kwInput, setKwInput] = useState(keyword);
  useEffect(() => {
    const id = setTimeout(() => setKeyword(kwInput), 160);
    return () => clearTimeout(id);
  }, [kwInput, setKeyword]);
  useEffect(() => setKwInput(keyword), [keyword]);

  // 结果计数（轻量 hook，仅返回数量，跳过排序与数组构建）
  const count = useFilteredCount();

  // 弹层打开时锁定滚动 + ESC 关闭
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  // 移动端"筛选"按钮上的已选条件计数（不含顶栏的关键词/模型）
  const activeCount =
    (type !== "all" ? 1 : 0) +
    (status !== "all" ? 1 : 0) +
    (onlyApi ? 1 : 0) +
    (category !== "all" ? 1 : 0);

  return (
    <div className="sticky top-[calc(env(safe-area-inset-top)+3.5rem)] z-30 border-b border-cyber-border bg-cyber-bg/85 backdrop-blur-xl">
      <div className="container py-3">
        {/* 第一行：搜索 + 模型 + 排序 + 移动端"筛选"按钮
            移动端纵向堆叠，桌面端横排 */}
        <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:gap-3">
          <div className="relative flex-1">
            <label htmlFor="nav-search" className="sr-only">
              {t("tb.searchLabel")}
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyber-muted"
              aria-hidden
            />
            <input
              id="nav-search"
              value={kwInput}
              onChange={(e) => setKwInput(e.target.value)}
              placeholder={t("tb.searchPlaceholder")}
              className="h-10 w-full rounded-lg border border-cyber-border bg-cyber-surface/70 pl-9 pr-16 font-mono text-sm text-cyber-text placeholder:text-cyber-muted focus:border-cyber-cyan/60 focus:outline-none focus:ring-1 focus:ring-cyber-cyan/40"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-cyber-muted">
              {t("tb.results", { n: count })}
            </span>
            {kwInput && (
              <button
                onClick={() => setKwInput("")}
                className="absolute right-12 top-1/2 -translate-y-1/2 rounded p-1 text-cyber-muted hover:bg-cyber-elevated hover:text-cyber-text sm:right-16"
                aria-label={t("tb.clearSearch")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* 模型过滤 */}
          <div className="relative md:w-52">
            <label htmlFor="nav-model" className="sr-only">
              {t("tb.modelLabel")}
            </label>
            <SlidersHorizontal
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyber-muted"
              aria-hidden
            />
            <input
              id="nav-model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={t("tb.modelPlaceholder")}
              className="h-10 w-full rounded-lg border border-cyber-border bg-cyber-surface/70 pl-9 pr-3 font-mono text-sm text-cyber-text placeholder:text-cyber-muted focus:border-cyber-magenta/60 focus:outline-none focus:ring-1 focus:ring-cyber-magenta/40"
            />
          </div>

          {/* 排序（自定义箭头） */}
          <div className="relative md:w-44">
            <label htmlFor="nav-sort" className="sr-only">
              {t("tb.sortLabel")}
            </label>
            <ArrowUpDown
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyber-muted"
              aria-hidden
            />
            <select
              id="nav-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-10 w-full appearance-none rounded-lg border border-cyber-border bg-cyber-surface/70 pl-9 pr-8 font-mono text-sm text-cyber-text focus:border-cyber-cyan/60 focus:outline-none focus:ring-1 focus:ring-cyber-cyan/40"
            >
              {SORT_KEYS.map((k) => (
                <option key={k} value={k} className="bg-cyber-surface text-cyber-text">
                  {t(`tb.sort.${k}`)}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cyber-muted"
              aria-hidden
            />
          </div>

          {/* 移动端：展开筛选弹层的入口按钮（桌面隐藏） */}
          <button
            onClick={() => setSheetOpen(true)}
            className="relative flex items-center justify-center gap-2 rounded-lg border border-cyber-border bg-cyber-surface/70 px-3 py-2.5 font-mono text-sm text-cyber-text transition-colors hover:border-cyber-cyan/40 md:hidden"
            aria-label={t("tb.filters")}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t("tb.filters")}
            {activeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-cyber-cyan px-1.5 font-mono text-[11px] font-semibold text-cyber-bg">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        {/* 第二行（桌面内联）：类型 / 状态 / 仅 API / 清空 / 黑名单 / 对比
            移动端统一收进底部弹层，避免吸顶栏过高 */}
        <div className="mt-2.5 hidden flex-wrap items-center gap-x-2 gap-y-2 md:flex">
          <FilterChips />
          <FilterActions />
        </div>
      </div>

      {/* 移动端筛选底部弹层 */}
      {sheetOpen && (
        <div className="fixed inset-0 z-[55] flex flex-col justify-end md:hidden">
          <button
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 bg-cyber-bg/70 backdrop-blur-sm animate-fade-in"
            aria-label={t("drawer.close")}
          />
          <div
            className="relative max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-cyber-border bg-cyber-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] animate-sheet-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-base font-semibold text-cyber-text">
                {t("tb.filters")}
                {activeCount > 0 && (
                  <span className="ml-2 rounded-full bg-cyber-cyan/20 px-2 py-0.5 font-mono text-[11px] font-semibold text-cyber-cyan">
                    {activeCount}
                  </span>
                )}
              </span>
              <button
                onClick={() => setSheetOpen(false)}
                className="rounded-lg border border-cyber-border bg-cyber-elevated p-2 text-cyber-muted transition-colors hover:text-cyber-text"
                aria-label={t("drawer.close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <FilterChips />
            <div className="my-3 h-px w-full bg-cyber-border/60" />
            <FilterActions onClose={() => setSheetOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(Toolbar);
