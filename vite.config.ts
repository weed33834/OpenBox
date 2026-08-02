import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/OpenBox/',
  build: {
    sourcemap: 'hidden',
    rollupOptions: {
      output: {
        manualChunks(id) {
          // node_modules 中的依赖按用途拆分，独立缓存、并行加载
          if (id.includes('node_modules')) {
            if (id.includes('@supabase/supabase-js')) return 'supabase';
            if (id.includes('lucide-react')) return 'icons';
            if (
              id.includes('/react-dom/') ||
              id.includes('/react/') ||
              id.includes('/scheduler/')
            ) {
              return 'react-vendor';
            }
            return 'vendor';
          }
          // 站点数据集与多语言文案是大体积静态资源，单独成块
          if (id.includes('src/data/sites')) return 'sites-data';
          if (id.includes('src/i18n/translations')) return 'i18n';
          return undefined;
        },
      },
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
  ],
})
