import { useEffect, useState, useRef } from 'react';
import { useHashRoute } from '@/hooks/useHashRoute';
import { useT } from '@/i18n/useI18n';
import { NavBar } from '@/components/NavBar';
import { MobileTabBar } from '@/components/MobileTabBar';
import { PageLoader } from '@/components/PageLoader';
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
import { RankingPage } from '@/pages/RankingPage';

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
    case 'ranking':
      return <RankingPage />;
    default:
      return <HomePage />;
  }
}

export default function App() {
  const route = useHashRoute();
  const t = useT();
  const isLanding = route.name === 'landing';
  const [showOverlay, setShowOverlay] = useState(false);
  const prevKey = useRef('');
  const overlayMs = useRef(1500);

  // SEO：路由变化时同步 document.title（利于搜索引擎收录与分享预览）
  useEffect(() => {
    const nameMap: Record<string, string> = {
      home: t('nav.home'),
      search: t('nav.search'),
      submit: t('nav.submit'),
      favorites: t('nav.favorites'),
      about: t('nav.about'),
      category: t('nav.categories'),
      scenario: t('nav.categories'),
      resource: '资源详情',
    };
    if (!isLanding) {
      document.title = `${nameMap[route.name] ?? 'OpenBox'} · OpenBox 开源 AI 资源导航`;
    }
  }, [route.name, route.slug, route.q, route.id, t, isLanding]);

  // 路由切换时触发过渡加载层（引导页→主站长 2.8s 品牌露出，页面间 1.5s）并滚动到顶部
  useEffect(() => {
    const key = `${route.name}-${route.slug ?? ''}-${route.id ?? ''}`;
    if (prevKey.current && prevKey.current !== key) {
      overlayMs.current = prevKey.current.startsWith('landing') && route.name !== 'landing' ? 2800 : 1500;
      setShowOverlay(true);
      const t = setTimeout(() => setShowOverlay(false), overlayMs.current);
      return () => clearTimeout(t);
    }
    prevKey.current = key;
  }, [route.name, route.slug, route.id]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [route.name, route.slug, route.id, route.q]);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* 路由切换过渡加载层：圆形光环 + Logo + 语录（品牌露出） */}
      {showOverlay && <PageLoader />}

      {/* 导航栏：非引导页显示；首次进入时由上滑入 */}
      {!isLanding && (
        <div style={{ animation: 'slide-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both' }}>
          <NavBar />
        </div>
      )}

      {/* 内容区：引导页全屏无边距，内页标准容器；底部为移动端 Tab 预留空间 */}
      <main className={`flex-1 ${isLanding ? '' : 'container py-6 pb-24 sm:pb-6'}`}>
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

      {/* 移动端底部导航（仅 sm 以下显示） */}
      {!isLanding && <MobileTabBar />}

      <ToastContainer />
      <AuthModal />
    </div>
  );
}
