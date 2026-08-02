// 全局搜索结果页：跨所有分类搜索站点，实时展示结果
// 解决"首页搜索框是假的"问题——搜索框现在真正搜索

import { useMemo, useState, useCallback, useRef } from "react";
import { Search, X, ArrowLeft, PackageX, RotateCcw } from "lucide-react";
import { sites as ALL_SITES, CATEGORY_META, type SiteType, type Status, type Category } from "@/data/sites";
import { CAT_ORDER } from "@/lib/constants";
import SiteCard from "@/components/SiteCard";
import DetailDrawer from "@/components/DetailDrawer";
import CompareModal from "@/components/CompareModal";
import ReportModal from "@/components/ReportModal";
import { useI18n, translate } from "@/i18n/useI18n";

const PAGE_SIZE = 20;

export default function SearchResultsPage() {
  const lang = useI18n((s) => s.lang);

  // 从 sessionStorage 读取搜索词（跨页面传递）
  const [query, setQuery] = useState(() => sessionStorage.getItem("global_search") || "");
  const [kwInput, setKwInput] = useState(() => sessionStorage.getItem("global_search") || "");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 筛选条件
  const [category, setCategory] = useState<string>("all");
  const [type, setType] = useState<SiteType | "all">("all");
  const [status, setStatus] = useState<Status | "all">("all");

  // 搜索输入处理
  const handleInputChange = useCallback((val: string) => {
    setKwInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQuery(val);
      setVisibleCount(PAGE_SIZE);
      sessionStorage.setItem("global_search", val);
    }, 200);
  }, []);

  // 搜索所有站点
  const results = useMemo(() => {
    let q = query.trim().toLowerCase();
    let list = ALL_SITES;

    // 如果在首页搜索时带有搜索词，已经存到 sessionStorage
    if (!q) return [];

    list = list.filter((s) => {
      const searchable = [
        s.name,
        s.desc,
        s.url,
        s.tagline || "",
        ...s.models,
        ...(s.features || []),
      ].join(" ").toLowerCase();
      return searchable.includes(q);
    });

    if (category !== "all") {
      list = list.filter((s) => s.category === category);
    }
    if (type !== "all") {
      list = list.filter((s) => s.type === type);
    }
    if (status !== "all") {
      list = list.filter((s) => s.status === status);
    }

    return list;
  }, [query, category, type, status]);

  // 结果按分类分组展示
  const grouped = useMemo(() => {
    const groups: Record<string, typeof results> = {};
    for (const s of results) {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    }
    // 按 CAT_ORDER 排序
    const sorted: { cat: string; sites: typeof results }[] = [];
    for (const cat of CAT_ORDER) {
      if (groups[cat]) {
        sorted.push({ cat, sites: groups[cat] });
      }
    }
    // 其他不在 CAT_ORDER 的分类
    for (const cat of Object.keys(groups)) {
      if (!CAT_ORDER.includes(cat as any)) {
        sorted.push({ cat, sites: groups[cat] });
      }
    }
    return sorted;
  }, [results]);

  const reset = useCallback(() => {
    setCategory("all");
    setType("all");
    setStatus("all");
  }, []);

  const hasFilter = category !== "all" || type !== "all" || status !== "all";

  // 清除搜索
  const clearSearch = useCallback(() => {
    setQuery("");
    setKwInput("");
    setVisibleCount(PAGE_SIZE);
    sessionStorage.removeItem("global_search");
  }, []);

  // Report modal state
  const [reportSiteId, setReportSiteId] = useState<string | null>(null);
  const handleReport = useCallback((siteId: string) => setReportSiteId(siteId), []);
  const reportSite = reportSiteId ? results.find((s) => s.id === reportSiteId) ?? null : null;

  return (
    <div className="min-h-[100dvh] bg-cyber-bg">
      {/* 顶部 */}
      <div className="border-b border-cyber-border bg-cyber-surface/40">
        <div className="container py-4 sm:py-6">
          <div className="mb-4 flex items-center gap-3">
            <a
              href="#/home"
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyber-border bg-cyber-surface/60 px-3 py-1.5 font-mono text-xs text-cyber-muted transition-colors hover:border-cyber-cyan/40 hover:text-cyber-cyan"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              返回首页
            </a>
            <h1 className="font-display text-xl font-bold text-cyber-text sm:text-2xl">
              搜索站点
            </h1>
          </div>

          {/* 搜索输入框 */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyber-muted" />
            <input
              type="text"
              value={kwInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="搜索所有站点（名称、描述、URL、模型、特点）..."
              className="h-12 w-full rounded-xl border border-cyber-border bg-cyber-surface/70 pl-12 pr-12 font-mono text-sm text-cyber-text placeholder:text-cyber-muted/60 focus:border-cyber-cyan/60 focus:outline-none focus:ring-2 focus:ring-cyber-cyan/20 transition-all"
              autoFocus
            />
            {kwInput && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-cyber-muted transition-colors hover:bg-cyber-elevated hover:text-cyber-text"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* 搜索统计 */}
          <div className="mt-3 flex items-center gap-3 font-mono text-xs text-cyber-muted">
            {query ? (
              <span>
                搜索 "<span className="text-cyber-cyan">{query}</span>" 共找到 <span className="text-cyber-text">{results.length}</span> 个结果
              </span>
            ) : (
              <span>输入关键词开始搜索</span>
            )}

            {/* 分类筛选快捷入口 */}
            {results.length > 0 && (
              <div className="ml-auto flex items-center gap-2">
                {grouped.map((g) => (
                  <button
                    key={g.cat}
                    onClick={() => setCategory(category === g.cat ? "all" : g.cat)}
                    className={`rounded-full px-2 py-0.5 font-mono text-[10px] transition-colors ${
                      category === g.cat
                        ? "bg-cyber-cyan/20 text-cyber-cyan"
                        : "text-cyber-muted/60 hover:text-cyber-muted"
                    }`}
                  >
                    {translate(lang, `cat.${g.cat}`)} ({g.sites.length})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 筛选条件快捷切换 */}
          {query && results.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select
                value={type}
                onChange={(e) => { setType(e.target.value as SiteType | "all"); setVisibleCount(PAGE_SIZE); }}
                className="h-8 appearance-none rounded-lg border border-cyber-border bg-cyber-surface/70 px-2.5 font-mono text-[11px] text-cyber-text focus:outline-none"
              >
                <option value="all">全部类型</option>
                <option value="free">免费</option>
                <option value="freemium">免费增值</option>
                <option value="paid">付费</option>
              </select>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value as Status | "all"); setVisibleCount(PAGE_SIZE); }}
                className="h-8 appearance-none rounded-lg border border-cyber-border bg-cyber-surface/70 px-2.5 font-mono text-[11px] text-cyber-text focus:outline-none"
              >
                <option value="all">全部状态</option>
                <option value="ok">可用</option>
                <option value="unstable">不稳定</option>
                <option value="unknown">未验证</option>
                <option value="dead">已失效</option>
              </select>
              {hasFilter && (
                <button
                  onClick={reset}
                  className="flex items-center gap-1 rounded-full border border-cyber-magenta/40 bg-cyber-magenta/10 px-2 py-1 font-mono text-[10px] text-cyber-magenta transition-colors hover:bg-cyber-magenta/20"
                >
                  <RotateCcw className="h-3 w-3" />
                  清空
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 结果列表 */}
      <div className="container py-6 sm:py-8">
        {!query ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <Search className="h-16 w-16 text-cyber-muted/30" strokeWidth={1} />
            <h3 className="font-display text-lg font-semibold text-cyber-muted">
              输入关键词开始搜索
            </h3>
            <p className="text-sm text-cyber-muted/60">
              搜索所有站点的名称、描述、URL、支持的模型和特点标签
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <PackageX className="h-14 w-14 text-cyber-muted" strokeWidth={1.2} />
            <h3 className="font-display text-xl font-semibold text-cyber-text">
              未找到匹配的站点
            </h3>
            <p className="text-sm text-cyber-muted">
              尝试换个关键词，或减少筛选条件
            </p>
            <button
              onClick={clearSearch}
              className="flex items-center gap-1.5 rounded-lg border border-cyber-cyan/40 bg-cyber-cyan/10 px-4 py-2 font-mono text-sm text-cyber-cyan transition-colors hover:bg-cyber-cyan/20"
            >
              <RotateCcw className="h-4 w-4" />
              重新搜索
            </button>
          </div>
        ) : (
          <>
            {/* 按分类分组展示 */}
            {grouped.map((group) => {
              const visible = group.sites.slice(0, visibleCount);
              const meta = CATEGORY_META[group.cat as Category];
              return (
                <div key={group.cat} className="mb-8">
                  <div className="mb-4 flex items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ background: meta?.color || "#8b95a8" }}
                    />
                    <h2 className="font-display text-lg font-semibold text-cyber-text">
                      {translate(lang, `cat.${group.cat}`)}
                    </h2>
                    <span className="font-mono text-xs text-cyber-muted">
                      {group.sites.length} 个站点
                    </span>
                    <a
                      href={`#/category/${group.cat}/all`}
                      className="ml-auto font-mono text-[11px] text-cyber-cyan/60 transition-colors hover:text-cyber-cyan"
                    >
                      查看全部 →
                    </a>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {visible.map((site, i) => (
                      <SiteCard key={site.id} site={site} index={i} onReport={handleReport} />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* 加载更多 */}
            {results.length > PAGE_SIZE && visibleCount < results.length && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyber-border bg-cyber-surface/60 px-6 py-3 font-mono text-sm text-cyber-cyan transition-all hover:border-cyber-cyan/40 hover:bg-cyber-cyan/5"
                >
                  显示更多（{visibleCount}/{results.length}）
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <DetailDrawer />
      <CompareModal />
      <ReportModal
        siteId={reportSite?.id ?? ""}
        siteName={reportSite?.name ?? ""}
        isOpen={!!reportSiteId}
        onClose={() => setReportSiteId(null)}
      />
    </div>
  );
}