import { useEffect, useState, useRef } from 'react';
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
      return <HomePage />;
  }
}

export default function App() {
  const route = useHashRoute();
  const isLanding = route.name === 'landing';
  const [showOverlay, setShowOverlay] = useState(false);
  const prevKey = useRef('');

  // 路由切换时触发过渡图案并滚动到顶部
  useEffect(() => {
    const key = `${route.name}-${route.slug ?? ''}-${route.id ?? ''}`;
    if (prevKey.current && prevKey.current !== key) {
      setShowOverlay(true);
      const t = setTimeout(() => setShowOverlay(false), 700);
      return () => clearTimeout(t);
    }
    prevKey.current = key;
  }, [route.name, route.slug, route.id]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [route.name, route.slug, route.id, route.q]);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* 路由切换过渡图案：OpenBox O 标志居中脉冲 */}
      {showOverlay && (
        <div
          className="transition-overlay fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'var(--color-bg)' }}
        >
          <div
            className="flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-black"
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-primary-fg)',
              animation: 'pulse-glow 1.2s ease-in-out infinite',
            }}
          >
            O
          </div>
        </div>
      )}

      {/* 导航栏：非引导页显示；首次进入时由上滑入 */}
      {!isLanding && (
        <div style={{ animation: 'slide-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both' }}>
          <NavBar />
        </div>
      )}

      {/* 内容区：引导页全屏无边距，内页标准容器；key 驱动淡入过渡 */}
      <main className={`flex-1 ${isLanding ? '' : 'container py-6'}`}>
        <div
          key={`${route.name}-${route.slug ?? ''}-${route.id ?? ''}`}
          style={{ animation: 'fade-in 0.5s ease-out both' }}
        >
          <Router />
        </div>
      </main>

      {!isLanding && (
        <footer style={{ animation: 'fade-in 0.5s ease-out both', animationDelay: '0.15s' }}>
          <Footer />
        </footer>
      )}

      <ToastContainer />
      <AuthModal />
    </div>
  );
}
