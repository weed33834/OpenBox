// 顶部导航栏：桌面端横向链接 + 移动端汉堡底部弹层
// 承载 语言切换 / 主题切换 / 登录(或用户菜单)，让 Hero 保持简洁
import { memo, useEffect, useState } from "react";
import {
  Menu,
  X,
  Sun,
  Moon,
  Home as HomeIcon,
  BookOpen,
  ShieldOff,
  Star,
  LogIn,
} from "lucide-react";
import LangSwitcher from "@/components/LangSwitcher";
import UserMenu from "@/components/UserMenu";
import Logo from "@/components/Logo";
import { useAuthStore } from "@/store/useAuthStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useThemeStore } from "@/hooks/useTheme";
import { useT, useI18n, translate } from "@/i18n/useI18n";
import { AUTH_ENABLED } from "@/lib/supabase";
import { cn } from "@/lib/utils";

// 稳定的空数组引用，避免 Zustand selector 每次返回新 [] 导致无限重渲染
const EMPTY_FAVORITES: string[] = [];

/** 监听 hash 变化，返回当前路由（用于高亮当前导航项） */
function useHashRoute(): string {
  const [hash, setHash] = useState(() =>
    typeof window === "undefined" ? "#/" : window.location.hash || "#/",
  );
  useEffect(() => {
    const onHash = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return hash;
}

interface NavLinkDef {
  href: string;
  labelKey: string;
  icon: typeof HomeIcon;
  match: (hash: string) => boolean;
  show: boolean;
  /** 是否在该项上显示收藏数量徽标（仅"我的收藏"用） */
  showFavCount?: boolean;
}

const NAV_LINKS: NavLinkDef[] = [
  {
    href: "#/",
    labelKey: "nav.home",
    icon: HomeIcon,
    match: (h) => h === "" || h === "#/" || h.startsWith("#/?"),
    show: true,
  },
  {
    href: "#/guide",
    labelKey: "guide.title",
    icon: BookOpen,
    match: (h) => h.startsWith("#/guide"),
    show: true,
  },
  {
    href: "#/blacklist",
    labelKey: "cat.blacklist",
    icon: ShieldOff,
    match: (h) => h.startsWith("#/blacklist"),
    show: true,
  },
  {
    href: "#/me",
    labelKey: "nav.favorites",
    icon: Star,
    match: (h) => h.startsWith("#/me"),
    show: AUTH_ENABLED,
    showFavCount: true,
  },
];

function Brand() {
  return (
    <a href="#/" className="flex shrink-0 items-center gap-2 group">
      <Logo size={32} className="rounded-lg" />
      <span className="font-display text-base font-bold tracking-tight text-cyber-text">
        AI <span className="text-cyber-cyan">导航</span>
      </span>
    </a>
  );
}

function ThemeToggle({ className }: { className?: string }) {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const t = useT();
  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-cyber-border bg-cyber-surface/60 p-1.5 text-cyber-muted transition-all hover:border-cyber-cyan/40 hover:text-cyber-cyan",
        className,
      )}
      aria-label={t("theme.toggle")}
      title={theme === "dark" ? t("theme.light") : t("theme.dark")}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function LoginButton({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const t = useT();
  return (
    <button
      onClick={() => {
        openAuthModal();
        onClick?.();
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-cyber-border bg-cyber-surface/60 px-3 py-1.5 font-mono text-[11px] text-cyber-cyan transition-all hover:border-cyber-cyan/40 hover:bg-cyber-cyan/5",
        className,
      )}
    >
      <LogIn className="h-3.5 w-3.5" />
      {t("gate.loginBtn")}
    </button>
  );
}

function NavBar() {
  const hash = useHashRoute();
  const lang = useI18n((s) => s.lang);
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const favorites = useFavoritesStore((s) => {
    const uid = user?.id ?? "__anon__";
    return s.userFavorites[uid] ?? EMPTY_FAVORITES;
  });
  const [open, setOpen] = useState(false);

  // 移动端弹层：锁定滚动 + ESC 关闭
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const visibleLinks = NAV_LINKS.filter((l) => l.show);

  return (
    <header className="sticky top-[env(safe-area-inset-top)] z-40 border-b border-cyber-border bg-cyber-bg/90 backdrop-blur-xl">
      <div className="container flex h-14 items-center gap-4">
        <Brand />

        {/* 桌面端：横向导航链接 */}
        <nav className="hidden items-center gap-1 md:flex">
          {visibleLinks.map((l) => {
            const active = l.match(hash);
            const Icon = l.icon;
            return (
              <a
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-lg px-3 py-2 font-mono text-sm transition-colors",
                  active ? "text-cyber-cyan" : "text-cyber-muted hover:text-cyber-text",
                )}
              >
                <Icon className="h-4 w-4" />
                {translate(lang, l.labelKey)}
                {active && (
                  <span className="absolute inset-x-2 -bottom-[1px] h-0.5 rounded-full bg-cyber-cyan" />
                )}
              </a>
            );
          })}
        </nav>

        {/* 右侧操作区 */}
        <div className="ml-auto flex items-center gap-2">
          {/* 桌面端：语言 / 主题 / 登录(或用户菜单) */}
          <div className="hidden items-center gap-2 md:flex">
            <LangSwitcher />
            <ThemeToggle />
            {AUTH_ENABLED && (user ? <UserMenu /> : <LoginButton />)}
          </div>

          {/* 移动端：汉堡按钮 */}
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center justify-center rounded-lg border border-cyber-border bg-cyber-surface/60 p-2 text-cyber-text transition-colors hover:border-cyber-cyan/40 md:hidden"
            aria-label={t("nav.menu")}
            aria-expanded={open}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 移动端底部弹层 */}
      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end md:hidden">
          <button
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-cyber-bg/70 backdrop-blur-sm animate-fade-in"
            aria-label={t("drawer.close")}
          />
          <div className="relative max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-cyber-border bg-cyber-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] animate-sheet-up">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-base font-semibold text-cyber-text">
                {t("nav.menu")}
              </span>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-cyber-border bg-cyber-elevated p-2 text-cyber-muted transition-colors hover:text-cyber-text"
                aria-label={t("drawer.close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              {visibleLinks.map((l) => {
                const active = l.match(hash);
                const Icon = l.icon;
                const favCount = l.showFavCount ? favorites.length : 0;
                return (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 font-medium transition-colors",
                      active
                        ? "bg-cyber-cyan/10 text-cyber-cyan"
                        : "text-cyber-text hover:bg-cyber-elevated",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="flex-1">{translate(lang, l.labelKey)}</span>
                    {favCount > 0 && (
                      <span className="rounded-full bg-cyber-cyan/20 px-2 py-0.5 font-mono text-[11px] font-semibold text-cyber-cyan">
                        {favCount}
                      </span>
                    )}
                  </a>
                );
              })}
            </nav>

            <div className="my-4 h-px w-full bg-cyber-border/60" />

            <div className="flex items-center justify-between gap-3">
              <LangSwitcher />
              <div className="flex items-center gap-2">
                <ThemeToggle />
                {AUTH_ENABLED && (user ? <UserMenu /> : <LoginButton onClick={() => setOpen(false)} />)}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default memo(NavBar);
