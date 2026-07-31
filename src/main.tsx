import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import ErrorBoundary from '@/components/ErrorBoundary'
import { supabase, hasSupabase } from './lib/supabase'
import { useAuthStore } from './store/useAuthStore'

if (hasSupabase && supabase) {
  // 恢复会话：页面加载时从 Supabase 拉取已有 session
  supabase.auth.getSession().then(({ data: { session } }) => {
    useAuthStore.getState().setSession(session)
  }).catch(() => {
    // 拉取失败时静默处理，用户可手动登录
  })

  // 监听认证状态变化（登录 / 登出 / 密码重置等）
  supabase.auth.onAuthStateChange((event, session) => {
    useAuthStore.getState().setSession(session)

    // 密码重置流程：用户从邮件链接返回后，弹出密码更新表单
    if (event === 'PASSWORD_RECOVERY') {
      useAuthStore.getState().setPasswordRecovery(true)
    }
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
