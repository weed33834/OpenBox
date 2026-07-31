import { useState, useEffect, Suspense, lazy } from "react";
import Home from "@/pages/Home";
import AuthModal from "@/components/AuthModal";
import ToastContainer from "@/components/ToastContainer";
import ScrollToTop from "@/components/ScrollToTop";
import NavBar from "@/components/NavBar";
import { useT } from "@/i18n/useI18n";

// 次级路由按需加载，减小首屏 JS 体积
const Blacklist = lazy(() => import("@/pages/Blacklist"));
const Profile = lazy(() => import("@/pages/Profile"));
const Guide = lazy(() => import("@/pages/Guide"));

function getRoute(): string {
  const hash = window.location.hash;
  if (hash.startsWith("#/blacklist")) return "blacklist";
  if (hash.startsWith("#/me")) return "me";
  if (hash.startsWith("#/guide")) return "guide";
  // #/?... 带筛选参数的首页（useUrlFilters 使用），视为 home
  if (hash.startsWith("#/?")) return "home";
  // 未知 hash 路由（形如 #/xxx）显示 404；空 hash 或 #/ 视为首页
  if (hash.startsWith("#/") && hash.length > 2) return "notfound";
  return "home";
}

/** 404 兜底页：未知路由时给出提示并提供返回首页入口 */
function NotFound() {
  const t = useT();
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-display text-6xl font-bold text-cyber-dead">404</p>
      <p className="text-sm text-cyber-muted">{t("error.notFound")}</p>
      <a
        href="#/"
        className="rounded-lg bg-cyber-cyan px-4 py-2 text-sm font-semibold text-cyber-bg transition-all hover:shadow-glow-cyan"
      >
        {t("error.backHome")}
      </a>
    </main>
  );
}

/** 路由切换时的骨架占位，避免 lazy 加载出现空白闪烁 */
function RouteFallback() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8" aria-hidden>
      <div className="h-8 w-40 animate-pulse rounded-lg bg-cyber-surface/70" />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-xl bg-cyber-surface/70"
          />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  // Vite SPA：window 始终存在，无需 SSR 守卫
  const [route, setRoute] = useState(() => getRoute());

  useEffect(() => {
    const onHash = () => setRoute(getRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <>
      <NavBar />
      <div key={route} className="route-fade">
        <Suspense fallback={<RouteFallback />}>
          {route === "blacklist" ? (
            <Blacklist />
          ) : route === "me" ? (
            <Profile />
          ) : route === "guide" ? (
            <Guide />
          ) : route === "notfound" ? (
            <NotFound />
          ) : (
            <Home />
          )}
        </Suspense>
      </div>
      <AuthModal />
      <ToastContainer />
      <ScrollToTop />
    </>
  );
}
