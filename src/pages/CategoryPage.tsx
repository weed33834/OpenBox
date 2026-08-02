import { useMemo, useState } from "react";
import {
  MessageSquare,
  MessageCircle,
  Gift,
  CreditCard,
  Globe,
  Building2,
  Wrench,
  Search,
  type LucideIcon,
} from "lucide-react";
import { CATEGORY_META, sites } from "@/data/sites";
import { CAT_ORDER } from "@/lib/constants";
import { ENABLED_SUB_CATEGORIES } from "@/data/subCategories";
import { useI18n, translate } from "@/i18n/useI18n";

const CATEGORY_ICON: Record<string, LucideIcon> = {
  linuxdo: MessageSquare,
  freechat: MessageCircle,
  freerelay: Gift,
  paidrelay: CreditCard,
  overseas: Globe,
  domestic: Building2,
  tool: Wrench,
};

// 统计各分类站点数（不含黑名单）
const CATEGORY_COUNTS = CAT_ORDER.reduce(
  (acc, key) => {
    acc[key] = sites.filter((s) => s.category === key).length;
    return acc;
  },
  {} as Record<string, number>,
);

export default function CategoryPage() {
  const lang = useI18n((s) => s.lang);
  const [searchQuery, setSearchQuery] = useState("");

  // 全局搜索：导航到搜索结果页
  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    sessionStorage.setItem("global_search", q);
    window.location.hash = "#/search";
  };

  const categories = useMemo(
    () =>
      CAT_ORDER.map((key) => {
        const meta = CATEGORY_META[key];
        const Icon = CATEGORY_ICON[key] ?? Globe;
        return {
          key,
          label: translate(lang, `cat.${key}`),
          color: meta.color,
          desc: meta.desc,
          count: CATEGORY_COUNTS[key] ?? 0,
          icon: Icon,
        };
      }),
    [lang],
  );

  return (
    <div className="min-h-[100dvh] bg-cyber-bg">
      {/* 顶部装饰 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyber-cyan/60 to-transparent" />

      <div className="container py-10 sm:py-14">
        {/* 标题区 — 更紧凑 */}
        <div className="mb-8 text-center sm:mb-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyber-cyan/30 bg-cyber-cyan/10 px-3.5 py-1 font-mono text-[11px] text-cyber-cyan backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-cyber-green" />
            系统在线 · 持续校验
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-cyber-text sm:text-3xl md:text-4xl">
            <span className="bg-gradient-to-r from-cyber-cyan to-cyber-magenta bg-clip-text text-transparent">
              选择分类
            </span>
          </h1>
          <p className="mt-2 font-mono text-sm text-cyber-muted">
            聚合 {sites.length}+ AI API 站点，按分类快速筛选
          </p>
        </div>

        {/* 全局搜索栏 */}
        <form onSubmit={handleGlobalSearch} className="mx-auto mb-8 max-w-lg sm:mb-10">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyber-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索所有站点（名称、描述、模型）..."
              className="h-12 w-full rounded-xl border border-cyber-border bg-cyber-surface/70 pl-12 pr-4 font-mono text-sm text-cyber-text placeholder:text-cyber-muted/60 focus:border-cyber-cyan/60 focus:outline-none focus:ring-2 focus:ring-cyber-cyan/20 transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-cyber-cyan/10 px-3 py-1.5 font-mono text-[11px] text-cyber-cyan transition-colors hover:bg-cyber-cyan/20"
            >
              搜索
            </button>
          </div>
        </form>

        {/* 九宫格磁贴布局：3x3 大卡片 */}
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            const subCats = ENABLED_SUB_CATEGORIES[cat.key];
            return (
              <a
                key={cat.key}
                href={`#/category/${cat.key}${subCats ? "" : "/all"}`}
                className="group relative overflow-hidden rounded-2xl border border-cyber-border bg-cyber-surface/70 p-6 transition-all duration-300 hover:-translate-y-1.5"
                style={
                  {
                    "--cat-color": cat.color,
                    "--i": idx,
                  } as React.CSSProperties
                }
              >
                {/* 顶部装饰光条 */}
                <span
                  className="absolute inset-x-0 top-0 h-0.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${cat.color}, transparent)`,
                  }}
                />

                {/* 背景光晕 */}
                <div
                  className="pointer-events-none absolute -inset-1 opacity-0 blur-2xl transition-all duration-500 group-hover:opacity-15"
                  style={{ background: cat.color }}
                />

                {/* 内容 */}
                <div className="relative flex flex-col items-center gap-4 text-center">
                  {/* 大图标 */}
                  <div
                    className="flex h-20 w-20 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl"
                    style={{
                      background: `linear-gradient(135deg, ${cat.color}25, ${cat.color}08)`,
                      color: cat.color,
                    }}
                  >
                    <Icon className="h-9 w-9" />
                  </div>

                  {/* 名称 + 计数 */}
                  <div>
                    <div className="flex items-center justify-center gap-2">
                      <h2 className="font-display text-xl font-bold text-cyber-text transition-colors group-hover:text-[var(--cat-color)]">
                        {cat.label}
                      </h2>
                      <span
                        className="rounded-full px-2.5 py-0.5 font-mono text-xs font-bold"
                        style={{
                          color: cat.color,
                          background: `${cat.color}20`,
                        }}
                      >
                        {cat.count}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-cyber-muted/80 line-clamp-2">
                      {cat.desc}
                    </p>
                  </div>

                  {/* 子分类快速入口（如果有） */}
                  {subCats && (
                    <div className="mt-1 flex w-full flex-wrap justify-center gap-1.5">
                      {subCats.slice(0, 3).map((sub) => (
                        <span
                          key={sub.key}
                          className="inline-flex items-center gap-1 rounded-full border border-cyber-border/50 bg-cyber-surface/40 px-2.5 py-1 font-mono text-[10px] text-cyber-muted"
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.hash = `#/category/${cat.key}/${sub.key}`;
                          }}
                        >
                          {sub.icon}
                          {sub.label.split(" ")[0]}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 进入指示 */}
                  <div className="mt-1 flex items-center gap-1 font-mono text-[11px] text-cyber-muted/50 transition-all duration-300 group-hover:text-[var(--cat-color)]">
                    <span>进入</span>
                    <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}