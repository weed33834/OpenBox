import { useState, useEffect, useRef, useCallback, Suspense, lazy } from "react";
import PosterPage from "@/pages/PosterPage";
import CategoryPage from "@/pages/CategoryPage";
import CategorySitePage from "@/pages/CategorySitePage";
import ToastContainer from "@/components/ToastContainer";
import ScrollToTop from "@/components/ScrollToTop";
import NavBar from "@/components/NavBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { type Category } from "@/data/sites";
import { ENABLED_SUB_CATEGORIES } from "@/data/subCategories";
import { useSwipeNav } from "@/hooks/useSwipeNav";

// 次级路由按需加载
const Blacklist = lazy(() => import("@/pages/Blacklist"));
const Profile = lazy(() => import("@/pages/Profile"));
const Guide = lazy(() => import("@/pages/Guide"));
const SubCategoryPage = lazy(() => import("@/pages/SubCategoryPage"));
const SearchResults = lazy(() => import("@/pages/SearchResultsPage"));

type Route =
  | { name: "poster" }
  | { name: "home" }
  | { name: "category"; category: Category }
  | { name: "subcategory"; category: Category }
  | { name: "category-sites"; category: Category; subType?: string }
  | { name: "search" }
  | { name: "blacklist" }
  | { name: "me" }
  | { name: "guide" }
  | { name: "notfound" };

// 路由层级深度，用于判断前进/后退方向
const ROUTE_DEPTH: Record<string, number> = {
  poster: 0,
  home: 1,
  search: 1,
  subcategory: 2,
  "category-sites": 3,
  category: 2,
  guide: 1,
  blacklist: 1,
  me: 2,
  notfound: 0,
};

function getRoute(): Route {
  const hash = window.location.hash;
  if (!hash || hash === "#/" || hash === "#") return { name: "poster" };
  if (hash === "#/home" || hash === "#/home/") return { name: "home" };
  if (hash.startsWith("#/category/")) {
    const parts = hash.replace("#/category/", "").split("/");
    const cat = parts[0] as Category;
    const validCategories: Category[] = [
      "linuxdo", "freechat", "freerelay", "paidrelay",
      "overseas", "domestic", "tool", "blacklist",
    ];
    if (!validCategories.includes(cat)) {
      if (hash.startsWith("#/") && hash.length > 2) return { name: "notfound" };
      return { name: "poster" };
    }
    // 有子分类路径 → 进入站点列表页
    if (parts.length >= 2) {
      const subType = parts[1] === "all" ? undefined : parts[1];
      return { name: "category-sites", category: cat, subType };
    }
    // 有子分类配置 → 显示子分类选择页
    if (ENABLED_SUB_CATEGORIES[cat]) {
      return { name: "subcategory", category: cat };
    }
    // 无子分类 → 直接进入站点列表页
    return { name: "category-sites", category: cat };
  }
  if (hash.startsWith("#/blacklist")) return { name: "blacklist" };
  if (hash.startsWith("#/search")) return { name: "search" };
  if (hash.startsWith("#/me")) return { name: "me" };
  if (hash.startsWith("#/guide")) return { name: "guide" };
  if (hash.startsWith("#/") && hash.length > 2) return { name: "notfound" };
  return { name: "poster" };
}

function routeDepth(r: Route): number {
  if (r.name === "category") return 2;
  if (r.name === "subcategory") return 2;
  if (r.name === "category-sites") return 3;
  return ROUTE_DEPTH[r.name] ?? 0;
}

function routeKey(r: Route): string {
  const base = r.name + ("category" in r ? r.category : "");
  if (r.name === "category-sites" && "subType" in r && r.subType) {
    return base + r.subType;
  }
  return base;
}

/** 404 兜底页 */
function NotFound() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-display text-6xl font-bold text-cyber-dead">404</p>
      <p className="text-sm text-cyber-muted">页面未找到</p>
      <a
        href="#/home"
        className="rounded-lg bg-cyber-cyan px-4 py-2 text-sm font-semibold text-cyber-bg transition-all hover:shadow-glow-cyan"
      >
        返回首页
      </a>
    </main>
  );
}

/** 路由切换时的骨架占位 */
function RouteFallback() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8" aria-hidden>
      <div className="h-8 w-40 animate-pulse rounded-lg bg-cyber-surface/70" />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-cyber-surface/70" />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => getRoute());
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [exitingRoute, setExitingRoute] = useState<Route | null>(null);
  const [exitDir, setExitDir] = useState<"forward" | "back">("forward");
  const prevRouteRef = useRef<Route>(route);
  const routeRef = useRef<Route>(route);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(false);

  // 移动端首次访问提示滑动手势
  useEffect(() => {
    const hinted = localStorage.getItem("openbox_swipe_hinted");
    if (!hinted && window.innerWidth < 768) {
      const timer = setTimeout(() => setShowSwipeHint(true), 2000);
      const dismiss = () => {
        setShowSwipeHint(false);
        localStorage.setItem("openbox_swipe_hinted", "true");
      };
      window.addEventListener("touchstart", dismiss, { once: true });
      window.addEventListener("scroll", dismiss, { once: true });
      setTimeout(dismiss, 5000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("touchstart", dismiss);
        window.removeEventListener("scroll", dismiss);
      };
    }
  }, []);

  // 保持 routeRef 同步
  useEffect(() => {
    routeRef.current = route;
  }, [route]);

  // 移动端右滑返回上一页（使用 ref 避免 stale closure）
  const handleGoBack = useCallback(() => {
    const cur = routeRef.current;
    if (cur.name === "poster") return;
    // 统一使用 history.back() 回到真正的上一页，不硬编码路由
    if (window.history.length > 2) {
      window.history.back();
    } else {
      window.location.hash = "#/home";
    }
  }, []);

  const { swipeProgress, swipeDir } = useSwipeNav({
    ref: contentRef,
    threshold: 60,
    maxVertical: 30,
    onSwipeRight: handleGoBack,
  });

  useEffect(() => {
    const onHash = () => {
      const next = getRoute();
      const prev = prevRouteRef.current;
      const prevDepth = routeDepth(prev);
      const nextDepth = routeDepth(next);
      const dir = nextDepth > prevDepth ? "forward" : "back";

      // 先设置退出动画
      setExitDir(dir);
      setExitingRoute(prev);
      setDirection(dir);

      // 动画结束后切换路由
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = setTimeout(() => {
        setRoute(next);
        setExitingRoute(null);
      }, 380);

      // 立即更新引用，避免快速点击时深度比较出错
      prevRouteRef.current = next;
    };
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener("hashchange", onHash);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  // 海报页不显示 NavBar
  const showNavBar = route.name !== "poster";
  const enterAnimClass = direction === "forward" ? "route-slide-forward" : "route-slide-back";
  const exitAnimClass = exitDir === "forward" ? "slide-out-left" : "slide-out-right";

  /** 渲染当前路由内容 */
  function renderRoute(r: Route) {
    switch (r.name) {
      case "poster": return <PosterPage />;
      case "home": return <CategoryPage />;
      case "search": return <SearchResults />;
      case "subcategory": return <SubCategoryPage category={r.category} />;
      case "category-sites": return <CategorySitePage category={r.category} initialType={r.subType} />;
      case "blacklist": return <Blacklist />;
      case "me": return <Profile />;
      case "guide": return <Guide />;
      case "notfound": return <NotFound />;
      default: return null;
    }
  }

  return (
    <>
      {showNavBar && <NavBar />}
      {/* 首次访问滑动手势提示 */}
      {showSwipeHint && (
        <div className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-xs animate-fade-in md:hidden">
          <div className="rounded-xl border border-cyber-cyan/30 bg-cyber-surface/95 px-4 py-3 text-center shadow-lg backdrop-blur-sm">
            <p className="font-mono text-xs text-cyber-cyan">
              ← 右滑返回上一页
            </p>
            <div className="mt-1.5 flex justify-center gap-1">
              <span className="h-1 w-4 rounded-full bg-cyber-cyan/40" />
              <span className="h-1 w-2 rounded-full bg-cyber-cyan/20" />
              <span className="h-1 w-2 rounded-full bg-cyber-cyan/20" />
            </div>
          </div>
        </div>
      )}
      {/* 滑动视觉反馈指示器 */}
      {swipeProgress > 0 && (
        <div
          className="fixed inset-y-0 left-0 z-50 pointer-events-none transition-opacity duration-100 md:hidden"
          style={{
            width: `${Math.min(swipeProgress * 80, 80)}px`,
            background: `linear-gradient(90deg, rgba(0,229,255,${swipeProgress * 0.15}) 0%, transparent 100%)`,
            opacity: swipeProgress,
          }}
        />
      )}
      {swipeDir === "right" && swipeProgress >= 1 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none md:hidden">
          <span className="rounded-full bg-cyber-cyan/20 px-4 py-2 font-mono text-xs text-cyber-cyan backdrop-blur-sm animate-fade-in">
            返回上一页
          </span>
        </div>
      )}
      <div ref={contentRef} className="relative min-h-[100dvh] pb-16 md:pb-0">
        {/* 退出页面 */}
        {exitingRoute && (
          <div
            key={"exit-" + routeKey(exitingRoute)}
            className="absolute inset-0 z-10"
            style={{ animation: `${exitAnimClass} 0.38s cubic-bezier(0.16, 1, 0.3, 1) both`, willChange: 'transform, opacity' }}
          >
            <Suspense fallback={<RouteFallback />}>
              {renderRoute(exitingRoute)}
            </Suspense>
          </div>
        )}
        {/* 进入页面：转场期间与退出页面重叠 */}
        <div
          key={routeKey(route)}
          className={exitingRoute ? `${enterAnimClass} absolute inset-0` : ""}
          style={exitingRoute ? { willChange: 'transform, opacity' } : undefined}
        >
          <Suspense fallback={<RouteFallback />}>
            {renderRoute(route)}
          </Suspense>
        </div>
      </div>
      {showNavBar && <MobileBottomNav />}
      <ToastContainer />
      <ScrollToTop />
    </>
  );
}