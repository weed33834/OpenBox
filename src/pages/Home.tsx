import { MessageSquare, BookOpen, Skull, Code2, Star } from "lucide-react";
import Hero from "@/components/Hero";
import Toolbar from "@/components/Toolbar";
import SiteGrid from "@/components/SiteGrid";
import DetailDrawer from "@/components/DetailDrawer";
import CompareModal from "@/components/CompareModal";
import SupportCTA from "@/components/SupportCTA";
import { useFilterStore, CATEGORY_COUNTS } from "@/store/useFilterStore";
import { sites as ALL_SITES, CATEGORY_META, type Category } from "@/data/sites";
import { useSiteHealth } from "@/hooks/useSiteHealth";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useTheme } from "@/hooks/useTheme";
import { useT, useI18n, translate } from "@/i18n/useI18n";

function Footer() {
  const setCategory = useFilterStore((s) => s.setCategory);
  const t = useT();
  const lang = useI18n((s) => s.lang);

  // 黑名单有独立页面（#/blacklist），不在首页底部分类计数中展示，避免点击后落入空网格
  const counts = (Object.keys(CATEGORY_META) as Category[])
    .filter((k) => k !== "blacklist")
    .map((k) => ({
      key: k,
      label: translate(lang, `cat.${k}`),
      count: CATEGORY_COUNTS[k],
      color: CATEGORY_META[k].color,
    }));

  return (
    <footer className="border-t border-cyber-border bg-cyber-surface/40">
      <div className="container py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse-dot rounded-full bg-cyber-green text-cyber-green" />
              <span className="font-display text-lg font-bold text-cyber-text">{t("footer.brand")}</span>
            </div>
            <p className="text-sm text-cyber-muted">
              {t("footer.desc", { total: ALL_SITES.length })}
            </p>
          </div>

          {/* 修复 P0 bug：点击分类跳转而非 reset */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 sm:grid-cols-4">
            {counts.map((c) => (
              <button
                key={c.key}
                onClick={() => {
                  setCategory(c.key);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="flex items-center justify-between gap-2 text-left text-xs text-cyber-muted transition-colors hover:text-cyber-text"
              >
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
                  {c.label}
                </span>
                <span className="font-mono">{c.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-cyber-border/60 pt-4 font-mono text-[11px] text-cyber-muted md:flex-row">
          <span>{t("footer.copyright")}</span>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="#/guide"
              className="flex items-center gap-1 transition-colors hover:text-cyber-cyan"
            >
              <BookOpen className="h-3 w-3" />
              {t("footer.guide")}
            </a>
            <a
              href="#/blacklist"
              className="flex items-center gap-1 transition-colors hover:text-cyber-dead"
            >
              <Skull className="h-3 w-3" />
              {t("footer.blacklist")}
            </a>
            <a
              href="https://github.com/weed33834/FreeAPI/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 transition-colors hover:text-cyber-cyan"
            >
              <MessageSquare className="h-3 w-3" />
              {t("footer.feedback")}
            </a>
            <a
              href="https://github.com/weed33834/FreeAPI"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-full border border-cyber-cyan/40 bg-cyber-cyan/10 px-2.5 py-1 font-semibold text-cyber-cyan transition-all hover:bg-cyber-cyan/20"
            >
              <Star className="h-3 w-3 fill-cyber-cyan" />
              Star
              <Code2 className="h-3 w-3" />
            </a>
          </div>
          <span className="flex items-center gap-1.5">
            {t("footer.builtWith")}
            <span className="text-cyber-cyan">REACT</span>·
            <span className="text-cyber-magenta">VITE</span>·
            <span className="text-cyber-amber">TAILWIND</span>
          </span>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  // 启动站点实时检测
  useSiteHealth();
  // 筛选状态与 URL hash 双向同步
  useUrlFilters();
  // 键盘快捷键：/ 聚焦搜索，Esc 清空筛选
  useKeyboard();
  // 主题切换（初始化时从 localStorage 读取并应用到 DOM）
  useTheme();

  return (
    <div className="relative z-10 flex min-h-[100dvh] flex-col">
      <Hero />
      <Toolbar />
      <main className="flex-1">
        <SiteGrid />
      </main>
      <SupportCTA />
      <Footer />
      <DetailDrawer />
      <CompareModal />
    </div>
  );
}
