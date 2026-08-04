import { useEffect } from 'react';
import { useHashRoute } from '@/hooks/useHashRoute';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { ToastContainer } from '@/components/ToastContainer';
import { AuthModal } from '@/components/AuthModal';
import { LandingPage } from '@/pages/LandingPage';
import { HomePage } from '@/pages/HomePage';
import { CategoryPage } from '@/pages/CategoryPage';
import { ScenarioPage } from '@/pages/ScenarioPage';
import { SearchPage } from '@/pages/SearchPage';
import { ResourcePage } from '@/pages/ResourcePage';
import { SubmitPage } from '@/pages/SubmitPage';
import { AboutPage } from '@/pages/AboutPage';
import { FavoritesPage } from '@/pages/FavoritesPage';

function Router() {
  const route = useHashRoute();
  switch (route.name) {
    case 'landing':
      return <LandingPage />;
    case 'category':
      return <CategoryPage />;
    case 'scenario':
      return <ScenarioPage />;
    case 'resource':
      return <ResourcePage />;
    case 'search':
      return <SearchPage />;
    case 'submit':
      return <SubmitPage />;
    case 'about':
      return <AboutPage />;
    case 'favorites':
      return <FavoritesPage />;
    default:
      // home / 未匹配 → 主页
      return <HomePage />;
  }
}

export default function App() {
  const route = useHashRoute();
  const isLanding = route.name === 'landing';

  // 路由切换时滚动到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [route.name, route.slug, route.id, route.q]);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* 导航栏：非引导页显示；首次进入时由上滑入 */}
      {!isLanding && (
        <div style={{ animation: 'slide-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) both' }}>
          <NavBar />
        </div>
      )}

      {/* 内容区：引导页全屏无边距，内页标准容器。route-fade + key 驱动所有页面过渡 */}
      <main className={`flex-1 ${isLanding ? '' : 'container py-6'}`}>
        <div
          key={`${route.name}-${route.slug ?? ''}-${route.id ?? ''}`}
          style={{ animation: 'fade-in 0.28s ease-out both' }}
        >
          <Router />
        </div>
      </main>

      {!isLanding && (
        <footer style={{ animation: 'fade-in 0.35s ease-out both', animationDelay: '0.1s' }}>
          <Footer />
        </footer>
      )}

      <ToastContainer />
      <AuthModal />
    </div>
  );
}
