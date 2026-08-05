import { useEffect, useState } from 'react';

export type RouteName =
  | 'landing'
  | 'home'
  | 'category'
  | 'scenario'
  | 'resource'
  | 'search'
  | 'submit'
  | 'about'
  | 'favorites'
  | 'ranking'
  | 'notfound';

export interface Route {
  name: RouteName;
  slug?: string;
  id?: string;
  q?: string;
}

export function parseHash(): Route {
  const raw = window.location.hash.replace(/^#/, '');
  // 根路径（无 hash 或仅 "/"）默认进入「引导页」
  if (!raw || raw === '/' || raw === '') return { name: 'landing' };

  const [pathPart, queryPart] = raw.split('?');
  const segments = pathPart.split('/').filter(Boolean); // 去掉空段
  const query: Record<string, string> = {};
  if (queryPart) {
    for (const pair of queryPart.split('&')) {
      const [k, v] = pair.split('=');
      if (k) query[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
    }
  }

  switch (segments[0]) {
    case 'home':
      return { name: 'home' };
    case 'category':
      return segments[1] ? { name: 'category', slug: segments[1] } : { name: 'home' };
    case 'scenario':
      return segments[1] ? { name: 'scenario', slug: segments[1] } : { name: 'home' };
    case 'resource':
      return segments[1] ? { name: 'resource', id: segments[1] } : { name: 'home' };
    case 'search':
      return { name: 'search', q: query.q ?? '' };
    case 'submit':
      return { name: 'submit' };
    case 'about':
      return { name: 'about' };
    case 'favorites':
      return { name: 'favorites' };
    case 'ranking':
      return { name: 'ranking' };
    default:
      return { name: 'home' };
  }
}

export function navigate(path: string) {
  window.location.hash = path;
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash());
  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return route;
}
