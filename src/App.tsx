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
      return <HomePage />;
  }
}

export default function App() {
  const route = useHashRoute();

  // 引导页独立全屏，不渲染导航与页脚
  if (route.name === 'landing') {
    return (
      <div className="flex min-h-[100dvh] flex-col">
        <Router />
        <ToastContainer />
        <AuthModal />
      </div>
    );
  }

  // 路由切换时滚动到顶部
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route.name, route.slug, route.id, route.q]);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <NavBar />
      <main className="container flex-1 py-6">
        <div key={`${route.name}-${route.slug ?? ''}-${route.id ?? ''}`} className="route-fade">
          <Router />
        </div>
      </main>
      <Footer />
      <ToastContainer />
      <AuthModal />
    </div>
  );
}
