// 移动端底部导航栏：固定在屏幕底部，替代汉堡菜单
import { memo } from "react";
import { Home, Search, BookOpen, User, type LucideIcon } from "lucide-react";
import { useHashRoute } from "@/hooks/useHashRoute";
import { useI18n, translate } from "@/i18n/useI18n";
import { cn } from "@/lib/utils";

interface TabDef {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  match: (hash: string) => boolean;
  show: boolean;
}

const TABS: TabDef[] = [
  {
    href: "#/home",
    labelKey: "nav.home",
    icon: Home,
    match: (h) => h.startsWith("#/home") || h.startsWith("#/category/"),
    show: true,
  },
  {
    href: "#/search",
    labelKey: "nav.search",
    icon: Search,
    match: (h) => h.startsWith("#/search"),
    show: true,
  },
  {
    href: "#/guide",
    labelKey: "nav.guide",
    icon: BookOpen,
    match: (h) => h.startsWith("#/guide"),
    show: true,
  },
  {
    href: "#/me",
    labelKey: "nav.favorites",
    icon: User,
    match: (h) => h.startsWith("#/me"),
    show: true,
  },
];

function MobileBottomNav() {
  const hash = useHashRoute();
  const lang = useI18n((s) => s.lang);

  const visible = TABS.filter((t) => t.show);

  return (
    <nav
      data-no-swipe
      className="fixed bottom-0 inset-x-0 z-50 border-t border-cyber-border/80 bg-cyber-bg/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="flex items-center justify-around h-16">
        {visible.map((tab) => {
          const active = tab.match(hash);
          const Icon = tab.icon;
          return (
            <a
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 h-full transition-all duration-200",
                active
                  ? "text-cyber-cyan"
                  : "text-cyber-muted/60 hover:text-cyber-text",
              )}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={cn("h-5 w-5 transition-transform duration-200", active && "scale-110")} />
              </div>
              <span className={cn("font-mono text-[10px] leading-tight transition-all duration-200", active && "font-semibold")}>
                {translate(lang, tab.labelKey)}
              </span>
              {active && (
                <span className="absolute -top-0.5 left-1/3 right-1/3 h-0.5 rounded-full bg-cyber-cyan shadow-[0_0_6px_rgba(0,229,255,0.5)]" />
              )}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

export default memo(MobileBottomNav);