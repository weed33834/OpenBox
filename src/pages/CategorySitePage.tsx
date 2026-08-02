import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { ArrowLeft, ArrowUp, Search, X, SlidersHorizontal, RotateCcw, PackageX, ChevronsUpDown, Send, Wifi, WifiOff } from "lucide-react";
import { CATEGORY_META, sites as ALL_SITES, TYPE_META, STATUS_META, type Category, type SiteType, type Status } from "@/data/sites";
import { CAT_ORDER } from "@/lib/constants";
import SiteCard from "@/components/SiteCard";
import DetailDrawer from "@/components/DetailDrawer";
import CompareModal from "@/components/CompareModal";
import { useT, useI18n, translate } from "@/i18n/useI18n";
import { useToastStore } from "@/store/useToastStore";
import { useFilterStore } from "@/store/useFilterStore";

type SortKey = "default" | "name" | "status";
const SORT_KEYS: SortKey[] = ["default", "name", "status"];
const PAGE_SIZE = 20;

interface Props {
  category: Category;
  initialType?: string;
}

export default function CategorySitePage({ category, initialType }: Props) {
  const t = useT();
  const lang = useI18n((s) => s.lang);

  // 筛选状态
  const [keyword, setKeyword] = useState("");
  const [kwInput, setKwInput] = useState("");
  const [model, setModel] = useState("");
  const [type, setType] = useState<SiteType | "all">(
    initialType && ["free", "paid", "freemium"].includes(initialType)
      ? (initialType as SiteType)
      : "all",
  );
  const [status, setStatus] = useState<Status | "all">("all");
  const [sort, setSort] = useState<SortKey>("default");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const prevFilterKey = useRef("");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 实时状态
  const liveStatus = useFilterStore((s) => s.liveStatus);

  // 筛选条件变化时重置分页
  const filterKey = `${type}-${status}-${keyword}-${model}-${sort}`;
  useEffect(() => {
    if (prevFilterKey.current !== "" && prevFilterKey.current !== filterKey) {
      setVisibleCount(PAGE_SIZE);
    }
    prevFilterKey.current = filterKey;
  }, [filterKey]);

  // 防抖搜索
  const handleKwChange = (val: string) => {
    setKwInput(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => setKeyword(val), 160);
  };

  // 从该分类过滤站点
  const categorySites = useMemo(
    () => ALL_SITES.filter((s) => s.category === category),
    [category],
  );

  // 应用筛选
  const filtered = useMemo(() => {
    let result = [...categorySites];

    if (keyword) {
      const kw = keyword.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(kw) ||
          s.desc.toLowerCase().includes(kw) ||
          s.url.toLowerCase().includes(kw) ||
          s.models.some((m) => m.toLowerCase().includes(kw)),
      );
    }
    if (model) {
      const m = model.toLowerCase();
      result = result.filter((s) => s.models.some((sm) => sm.toLowerCase().includes(m)));
    }
    if (type !== "all") {
      result = result.filter((s) => s.type === type);
    }
    if (status !== "all") {
      result = result.filter((s) => s.status === status);
    }

    if (sort === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [categorySites, keyword, model, type, status, sort]);

  const reset = useCallback(() => {
    setKeyword("");
    setKwInput("");
    setModel("");
    setType("all");
    setStatus("all");
    setSort("default");
  }, []);

  const hasFilter = keyword || model || type !== "all" || status !== "all" || sort !== "default";
  const activeCount = (type !== "all" ? 1 : 0) + (status !== "all" ? 1 : 0) + (sort !== "default" ? 1 : 0);

  // 统计信息
  const stats = useMemo(() => {
    const total = categorySites.length;
    const online = categorySites.filter((s) => liveStatus[s.id] === "up").length;
    const offline = categorySites.filter((s) => liveStatus[s.id] === "down").length;
    const typeDist = {} as Record<string, number>;
    for (const s of categorySites) {
      typeDist[s.type] = (typeDist[s.type] || 0) + 1;
    }
    return { total, online, offline, typeDist };
  }, [categorySites, liveStatus]);

  // Report modal
  const [reportSiteId, setReportSiteId] = useState<string | null>(null);
  const [reportText, setReportText] = useState("");
  const handleReport = useCallback((siteId: string) => {
    setReportSiteId(siteId);
    setReportText("");
  }, []);
  const reportSite = reportSiteId ? filtered.find((s) => s.id === reportSiteId) ?? null : null;

  const meta = CATEGORY_META[category];

  // 自动提取模型
  const availableModels = useMemo(() => {
    const set = new Set<string>();
    for (const s of categorySites) {
      for (const m of s.models) set.add(m);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [categorySites]);

  // 提交反馈
  const toast = useToastStore();
  const handleSubmitReport = useCallback(() => {
    if (!reportText.trim()) {
      toast.warning("请描述问题后再提交");
      return;
    }
    console.log("[Report]", { siteId: reportSiteId, text: reportText });
    toast.success("感谢反馈，我们会尽快处理！");
    setReportSiteId(null);
    setReportText("");
  }, [reportText, reportSiteId, toast]);

  return (
    <div className="min-h-[100dvh] bg-cyber-bg">
      {/* 顶部导航信息 */}
      <div className="border-b border-cyber-border bg-cyber-surface/40">
        <div className="container py-3 sm:py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (window.history.length > 2) {
                  window.history.back();
                } else {
                  window.location.hash = "#/home";
                }
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-cyber-border bg-cyber-surface/60 px-2.5 py-1 font-mono text-[11px] text-cyber-muted transition-colors hover:border-cyber-cyan/40 hover:text-cyber-cyan"
            >
              <ArrowLeft className="h-3 w-3" />
              {t("bl.back")}
            </button>
            <span className="h-3 w-px bg-cyber-border/60" />
            <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: meta.color, boxShadow: `0 0 6px ${meta.color}` }} />
            <h1 className="font-display text-lg font-bold text-cyber-text sm:text-xl truncate">
              {translate(lang, `cat.${category}`)}
            </h1>
            <span className="font-mono text-[11px] text-cyber-muted/60 shrink-0">
              {stats.total}
            </span>
            {/* 桌面端统计信息 */}
            <div className="ml-auto hidden items-center gap-3 md:flex">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-cyber-green">
                <Wifi className="h-3 w-3" />
                <span>{stats.online} 在线</span>
              </div>
              {stats.offline > 0 && (
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-cyber-dead">
                  <WifiOff className="h-3 w-3" />
                  <span>{stats.offline} 离线</span>
                </div>
              )}
              {/* 类型分布 */}
              {Object.entries(stats.typeDist).map(([k, v]) => (
                <span
                  key={k}
                  className="rounded px-1.5 py-0.5 font-mono text-[10px]"
                  style={{ color: TYPE_META[k as SiteType]?.color ?? "#8b95a8", background: `${TYPE_META[k as SiteType]?.color ?? "#8b95a8"}15` }}
                >
                  {translate(lang, `type.${k}`)} {v}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 分类快速切换栏 */}
      <div className="overflow-x-auto border-b border-cyber-border/50 bg-cyber-surface/30 scrollbar-none">
        <div className="flex gap-1.5 px-4 py-2.5 md:px-6">
          {CAT_ORDER.map((catKey) => {
            const isActive = catKey === category;
            const meta = CATEGORY_META[catKey];
            return (
              <a
                key={catKey}
                href={`#/category/${catKey}${initialType && initialType !== "all" ? `/${initialType}` : ""}`}
                className={`relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-xs transition-all whitespace-nowrap ${
                  isActive
                    ? "text-cyber-bg font-semibold shadow-sm"
                    : "text-cyber-muted hover:text-cyber-text border border-cyber-border/60 hover:border-cyber-cyan/30"
                }`}
                style={isActive ? { background: meta.color, borderColor: meta.color } : {}}
              >
                {isActive && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                {translate(lang, `cat.${catKey}`)}
              </a>
            );
          })}
        </div>
      </div>

      {/* 主内容区：左右分栏 */}
      <div className="container flex gap-0 py-4 sm:py-6">
        {/* 左侧筛选面板（桌面端） */}
        <aside className="hidden w-56 shrink-0 flex-col gap-4 transition-all duration-300 md:flex">
          <div className="sticky top-24 space-y-4 pr-4">
            {/* 搜索 */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyber-muted" />
              <input
                value={kwInput}
                onChange={(e) => handleKwChange(e.target.value)}
                placeholder="搜索站点..."
                className="h-10 w-full rounded-lg border border-cyber-border bg-cyber-surface/70 pl-9 pr-3 font-mono text-sm text-cyber-text placeholder:text-cyber-muted focus:border-cyber-cyan/60 focus:outline-none focus:ring-1 focus:ring-cyber-cyan/40"
              />
              {kwInput && (
                <button
                  onClick={() => { setKwInput(""); setKeyword(""); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-cyber-muted hover:text-cyber-text"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* 筛选组：类型 */}
            <div>
              <h4 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-cyber-muted">
                类型
              </h4>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setType("all")}
                  className={`rounded-lg px-3 py-1.5 text-left font-mono text-xs transition-all ${
                    type === "all" ? "bg-cyber-cyan/15 text-cyber-cyan font-semibold" : "text-cyber-muted hover:bg-cyber-surface/60 hover:text-cyber-text"
                  }`}
                >
                  全部
                </button>
                {(Object.keys(TYPE_META) as SiteType[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setType(k)}
                    className={`rounded-lg px-3 py-1.5 text-left font-mono text-xs transition-all ${
                      type === k ? "font-semibold" : "text-cyber-muted hover:bg-cyber-surface/60 hover:text-cyber-text"
                    }`}
                    style={type === k ? { color: TYPE_META[k].color, background: `${TYPE_META[k].color}15` } : {}}
                  >
                    {translate(lang, `type.${k}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* 筛选组：状态 */}
            <div>
              <h4 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-cyber-muted">
                状态
              </h4>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setStatus("all")}
                  className={`rounded-lg px-3 py-1.5 text-left font-mono text-xs transition-all ${
                    status === "all" ? "bg-cyber-cyan/15 text-cyber-cyan font-semibold" : "text-cyber-muted hover:bg-cyber-surface/60 hover:text-cyber-text"
                  }`}
                >
                  全部
                </button>
                {(Object.keys(STATUS_META) as Status[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setStatus(k)}
                    className={`rounded-lg px-3 py-1.5 text-left font-mono text-xs transition-all ${
                      status === k ? "font-semibold" : "text-cyber-muted hover:bg-cyber-surface/60 hover:text-cyber-text"
                    }`}
                    style={status === k ? { color: STATUS_META[k].color, background: `${STATUS_META[k].color}15` } : {}}
                  >
                    {translate(lang, `status.${k}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* 筛选组：模型 */}
            <div>
              <h4 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-cyber-muted">
                模型
              </h4>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="h-9 w-full appearance-none rounded-lg border border-cyber-border bg-cyber-surface/70 px-3 font-mono text-xs text-cyber-text focus:border-cyber-magenta/60 focus:outline-none"
              >
                <option value="" className="bg-cyber-surface text-cyber-muted">全部模型</option>
                {availableModels.map((m) => (
                  <option key={m} value={m} className="bg-cyber-surface text-cyber-text">{m}</option>
                ))}
              </select>
            </div>

            {/* 筛选组：排序 */}
            <div>
              <h4 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-cyber-muted">
                排序
              </h4>
              <div className="flex flex-col gap-1">
                {SORT_KEYS.map((k) => (
                  <button
                    key={k}
                    onClick={() => setSort(k)}
                    className={`rounded-lg px-3 py-1.5 text-left font-mono text-xs transition-all ${
                      sort === k ? "bg-cyber-cyan/15 text-cyber-cyan font-semibold" : "text-cyber-muted hover:bg-cyber-surface/60 hover:text-cyber-text"
                    }`}
                  >
                    {t(`tb.sort.${k}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* 重置 */}
            {hasFilter && (
              <button
                onClick={reset}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-cyber-magenta/40 bg-cyber-magenta/10 py-2 font-mono text-xs text-cyber-magenta transition-colors hover:bg-cyber-magenta/20"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                清除筛选
              </button>
            )}
          </div>
        </aside>

        {/* 右侧内容区 */}
        <div className="min-w-0 flex-1">
          {/* 移动端：搜索栏 + 筛选按钮 */}
          <div className="mb-4 flex items-center gap-2 md:hidden">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyber-muted" />
              <input
                value={kwInput}
                onChange={(e) => handleKwChange(e.target.value)}
                placeholder="搜索站点..."
                className="h-10 w-full rounded-lg border border-cyber-border bg-cyber-surface/70 pl-9 pr-3 font-mono text-sm text-cyber-text placeholder:text-cyber-muted focus:border-cyber-cyan/60 focus:outline-none"
              />
              {kwInput && (
                <button
                  onClick={() => { setKwInput(""); setKeyword(""); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-cyber-muted hover:text-cyber-text"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => setSheetOpen(true)}
              className="relative flex items-center justify-center rounded-lg border border-cyber-border bg-cyber-surface/70 p-2.5 transition-colors hover:border-cyber-cyan/40"
            >
              <SlidersHorizontal className="h-4 w-4 text-cyber-muted" />
              {activeCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyber-cyan px-1 font-mono text-[10px] font-semibold text-cyber-bg">
                  {activeCount}
                </span>
              )}
            </button>
          </div>

          {/* 移动端统计条 */}
          <div className="mb-4 flex items-center gap-3 md:hidden">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-cyber-green">
              <Wifi className="h-3 w-3" />
              <span>{stats.online}</span>
            </div>
            {stats.offline > 0 && (
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-cyber-dead">
                <WifiOff className="h-3 w-3" />
                <span>{stats.offline}</span>
              </div>
            )}
            <span className="font-mono text-[11px] text-cyber-muted/60">
              共 {filtered.length} 个站点
            </span>
          </div>

          {/* 站点网格 */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <PackageX className="h-14 w-14 text-cyber-muted" strokeWidth={1.2} />
              <div>
                <h3 className="font-display text-xl font-semibold text-cyber-text">
                  {t("grid.empty.title")}
                </h3>
                <p className="mt-2 text-sm text-cyber-muted">{t("grid.empty.desc")}</p>
              </div>
              <button
                onClick={reset}
                className="flex items-center gap-1.5 rounded-lg border border-cyber-cyan/40 bg-cyber-cyan/10 px-4 py-2 font-mono text-sm text-cyber-cyan transition-colors hover:bg-cyber-cyan/20"
              >
                <RotateCcw className="h-4 w-4" />
                {t("grid.empty.action")}
              </button>
            </div>
          ) : (
            <>
              {/* 结果计数 */}
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[11px] text-cyber-muted/60">
                  找到 {filtered.length} 个站点
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.slice(0, visibleCount).map((site, i) => (
                  <SiteCard key={site.id} site={site} index={i} onReport={handleReport} />
                ))}
              </div>

              {/* 分页控制 */}
              {filtered.length > PAGE_SIZE && (
                <div className="mt-8 flex items-center justify-center gap-4">
                  {visibleCount < filtered.length ? (
                    <button
                      onClick={() => {
                        const beforeHeight = document.body.scrollHeight;
                        setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length));
                        requestAnimationFrame(() => {
                          const afterHeight = document.body.scrollHeight;
                          const diff = afterHeight - beforeHeight;
                          if (diff > 0) window.scrollBy(0, diff);
                        });
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-cyber-border bg-cyber-surface/60 px-6 py-3 font-mono text-sm text-cyber-cyan transition-all hover:border-cyber-cyan/40 hover:bg-cyber-cyan/5 hover:shadow-glow-cyan"
                    >
                      <ChevronsUpDown className="h-4 w-4" />
                      加载更多（{visibleCount}/{filtered.length}）
                    </button>
                  ) : (
                    <button
                      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                      className="inline-flex items-center gap-2 rounded-xl border border-cyber-border bg-cyber-surface/60 px-6 py-3 font-mono text-xs text-cyber-muted transition-all hover:border-cyber-cyan/40 hover:text-cyber-cyan"
                    >
                      <ArrowUp className="h-4 w-4" />
                      回到顶部
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 移动端筛选弹层 */}
      {sheetOpen && (
        <div className="fixed inset-0 z-[55] flex flex-col justify-end md:hidden">
          <button onClick={() => setSheetOpen(false)} className="absolute inset-0 bg-cyber-bg/70 backdrop-blur-sm animate-fade-in" />
          <div className="relative max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-cyber-border bg-cyber-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] animate-sheet-up">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-base font-semibold text-cyber-text">筛选</span>
              <button
                onClick={() => setSheetOpen(false)}
                className="rounded-lg border border-cyber-border bg-cyber-elevated p-2 text-cyber-muted transition-colors hover:text-cyber-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[11px] uppercase tracking-wider text-cyber-muted">类型</span>
                <div className="flex flex-wrap gap-1.5">
                  <button className="chip" data-active={type === "all"} onClick={() => setType("all")}>全部</button>
                  {(Object.keys(TYPE_META) as SiteType[]).map((k) => (
                    <button key={k} className="chip" data-active={type === k} onClick={() => setType(k)}>
                      {translate(lang, `type.${k}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px w-full bg-cyber-border/60" />

              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[11px] uppercase tracking-wider text-cyber-muted">状态</span>
                <div className="flex flex-wrap gap-1.5">
                  <button className="chip" data-active={status === "all"} onClick={() => setStatus("all")}>全部</button>
                  {(Object.keys(STATUS_META) as Status[]).map((k) => (
                    <button key={k} className="chip" data-active={status === k} onClick={() => setStatus(k)}>
                      {translate(lang, `status.${k}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px w-full bg-cyber-border/60" />

              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[11px] uppercase tracking-wider text-cyber-muted">模型</span>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="h-10 w-full appearance-none rounded-lg border border-cyber-border bg-cyber-surface/70 px-3 font-mono text-sm text-cyber-text focus:border-cyber-magenta/60 focus:outline-none"
                >
                  <option value="" className="bg-cyber-surface text-cyber-muted">全部模型</option>
                  {availableModels.map((m) => (
                    <option key={m} value={m} className="bg-cyber-surface text-cyber-text">{m}</option>
                  ))}
                </select>
              </div>

              <div className="h-px w-full bg-cyber-border/60" />

              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[11px] uppercase tracking-wider text-cyber-muted">排序</span>
                <div className="flex flex-wrap gap-1.5">
                  {SORT_KEYS.map((k) => (
                    <button key={k} className="chip" data-active={sort === k} onClick={() => setSort(k)}>
                      {t(`tb.sort.${k}`)}
                    </button>
                  ))}
                </div>
              </div>

              {hasFilter && (
                <button
                  onClick={() => { reset(); setSheetOpen(false); }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-cyber-magenta/40 bg-cyber-magenta/10 py-2.5 font-mono text-sm text-cyber-magenta"
                >
                  <RotateCcw className="h-4 w-4" />
                  清除筛选
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 详情抽屉 */}
      <DetailDrawer />
      <CompareModal />

      {/* Report Modal */}
      {reportSiteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-cyber-bg/70 backdrop-blur-sm" onClick={() => setReportSiteId(null)} />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-cyber-border bg-cyber-surface p-6 shadow-2xl">
            <h3 className="font-display text-lg font-semibold text-cyber-text">反馈问题</h3>
            <p className="mt-2 font-mono text-xs text-cyber-muted">
              站点: {reportSite?.name}
            </p>
            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              className="mt-4 h-32 w-full rounded-lg border border-cyber-border bg-cyber-elevated p-3 font-mono text-sm text-cyber-text placeholder:text-cyber-muted focus:border-cyber-cyan/60 focus:outline-none"
              placeholder="请描述问题..."
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setReportSiteId(null)}
                className="rounded-lg border border-cyber-border px-4 py-2 font-mono text-sm text-cyber-muted transition-colors hover:text-cyber-text"
              >
                取消
              </button>
              <button
                onClick={handleSubmitReport}
                className="inline-flex items-center gap-2 rounded-lg bg-cyber-cyan px-4 py-2 font-mono text-sm font-semibold text-cyber-bg transition-all hover:shadow-glow-cyan disabled:opacity-50"
                disabled={!reportText.trim()}
              >
                <Send className="h-3.5 w-3.5" />
                提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}