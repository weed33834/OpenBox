import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Filter, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { CATEGORY_META, sites as ALL_SITES, TYPE_META, type Category } from "@/data/sites";
import { ENABLED_SUB_CATEGORIES } from "@/data/subCategories";
import { useI18n, translate } from "@/i18n/useI18n";

const CATEGORY_EMOJI: Record<string, string> = {
  linuxdo: "🤝",
  freechat: "💬",
  freerelay: "🎁",
  paidrelay: "🏪",
  overseas: "🌍",
  domestic: "🏠",
  tool: "🧰",
};

interface Props {
  category: Category;
}

export default function SubCategoryPage({ category }: Props) {
  const lang = useI18n((s) => s.lang);
  const meta = CATEGORY_META[category];
  const subCategories = ENABLED_SUB_CATEGORIES[category] ?? [];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // 统计每个子分类的站点数
  const categorySites = useMemo(
    () => ALL_SITES.filter((s) => s.category === category),
    [category],
  );

  const subCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sub of subCategories) {
      counts[sub.key] = categorySites.filter((s) => s.type === sub.key).length;
    }
    return counts;
  }, [categorySites, subCategories]);

  const maxCount = Math.max(...Object.values(subCounts), 1);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.6;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className="min-h-[100dvh] bg-cyber-bg">
      {/* 顶部装饰 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyber-cyan/60 to-transparent" />

      <div className="container py-10 sm:py-14">
        {/* 返回按钮 */}
        <button
          onClick={() => {
            if (window.history.length > 2) {
              window.history.back();
            } else {
              window.location.hash = "#/home";
            }
          }}
          className="mb-6 inline-flex items-center gap-1.5 rounded-lg border border-cyber-border bg-cyber-surface/60 px-3 py-1.5 font-mono text-xs text-cyber-muted transition-colors hover:border-cyber-cyan/40 hover:text-cyber-cyan"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {translate(lang, "bl.back")}
        </button>

        {/* 分类标题区 */}
        <div className="relative mb-10 overflow-hidden rounded-2xl border border-cyber-border bg-gradient-to-br from-cyber-surface/90 via-cyber-elevated/60 to-cyber-surface/40 p-6 sm:p-8">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-10 blur-3xl"
            style={{ background: meta.color }}
          />
          <div
            className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full opacity-10 blur-3xl"
            style={{ background: meta.color }}
          />

          <div className="relative flex items-start gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl shadow-lg"
              style={{ background: `${meta.color}20` }}
            >
              {CATEGORY_EMOJI[category] ?? "📁"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h1 className="font-display text-2xl font-bold text-cyber-text sm:text-3xl">
                  {translate(lang, `cat.${category}`)}
                </h1>
                <span
                  className="rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold"
                  style={{ color: meta.color, background: `${meta.color}20` }}
                >
                  {categorySites.length}
                </span>
              </div>
              <p className="mt-1.5 font-mono text-sm leading-relaxed text-cyber-muted/80">
                {meta.desc}
              </p>
            </div>
          </div>
        </div>

        {/* 横向滑动卡片区域 */}
        <div className="relative">
          {/* 左右滚动按钮（桌面端） */}
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-cyber-border bg-cyber-surface/90 p-2 text-cyber-muted shadow-lg backdrop-blur-sm transition-all hover:border-cyber-cyan/40 hover:text-cyber-cyan md:flex"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-cyber-border bg-cyber-surface/90 p-2 text-cyber-muted shadow-lg backdrop-blur-sm transition-all hover:border-cyber-cyan/40 hover:text-cyber-cyan md:flex"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          {/* 横向滚动容器 */}
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory"
          >
            {subCategories.map((sub, idx) => {
              const count = subCounts[sub.key] ?? 0;
              const typeMeta = TYPE_META[sub.key];
              const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
              return (
                <a
                  key={sub.key}
                  href={`#/category/${category}/${sub.key}`}
                  className="group relative flex w-[280px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-cyber-border bg-cyber-surface/70 p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-transparent sm:w-[320px]"
                  style={
                    {
                      "--sub-color": sub.color,
                      "--i": idx,
                    } as React.CSSProperties
                  }
                >
                  {/* 顶部色条 */}
                  <span
                    className="absolute inset-x-0 top-0 h-0.5 opacity-60 transition-opacity group-hover:opacity-100"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${sub.color}, transparent)`,
                    }}
                  />

                  {/* 背景光晕 */}
                  <div
                    className="pointer-events-none absolute -inset-1 opacity-0 blur-2xl transition-all duration-500 group-hover:opacity-15"
                    style={{ background: sub.color }}
                  />

                  <div className="relative flex flex-col gap-4">
                    {/* 图标行 */}
                    <div className="flex items-center gap-4">
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-2xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                        style={{ background: `${sub.color}15` }}
                      >
                        {sub.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h2 className="font-display text-lg font-semibold text-cyber-text transition-colors group-hover:text-[var(--sub-color)]">
                            {sub.label}
                          </h2>
                          <span
                            className="rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold"
                            style={{ color: sub.color, background: `${sub.color}20` }}
                          >
                            {count}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 描述 */}
                    <p className="text-sm leading-relaxed text-cyber-muted line-clamp-2">
                      {sub.desc}
                    </p>

                    {/* 进度条 + 类型 */}
                    <div className="mt-auto flex items-center gap-3">
                      <div className="flex-1">
                        <div className="h-2 overflow-hidden rounded-full bg-cyber-border/30">
                          <div
                            className="h-full rounded-full transition-all duration-500 group-hover:opacity-90"
                            style={{
                              width: `${Math.max(pct, 5)}%`,
                              background: sub.color,
                              opacity: 0.6,
                            }}
                          />
                        </div>
                      </div>
                      <span
                        className="shrink-0 rounded px-2 py-0.5 font-mono text-[10px]"
                        style={{ color: typeMeta.color, background: `${typeMeta.color}20` }}
                      >
                        {typeMeta.label}
                      </span>
                    </div>

                    {/* 进入指示 */}
                    <div className="flex items-center gap-1 font-mono text-[11px] text-cyber-muted/50 transition-all group-hover:text-[var(--sub-color)]">
                      <span>浏览此分类</span>
                      <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        {/* 查看全部 */}
        <div className="mt-10 text-center">
          <a
            href={`#/category/${category}/all`}
            className="group inline-flex items-center gap-2 rounded-xl border border-cyber-border bg-cyber-surface/60 px-8 py-3.5 font-mono text-sm text-cyber-muted transition-all hover:border-cyber-cyan/40 hover:text-cyber-cyan hover:shadow-glow-cyan"
          >
            <Filter className="h-4 w-4 transition-transform group-hover:rotate-12" />
            <span>浏览全部 {categorySites.length} 个站点</span>
            <ArrowLeft className="h-4 w-4 rotate-180 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </div>
  );
}