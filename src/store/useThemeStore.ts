import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
}

function initial(): Theme {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem('ob_theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: initial(),
      setTheme: (t) => {
        apply(t);
        set({ theme: t });
      },
      toggle: () => {
        const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
        apply(next);
        set({ theme: next });
      },
    }),
    {
      name: 'ob_theme',
      onRehydrateStorage: () => (state) => {
        if (state) apply(state.theme);
      },
    },
  ),
);
