import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  hasError: boolean;
}

/** 全局错误边界：捕获子树渲染异常，防止整页白屏。 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (import.meta.env.DEV) console.error('[ErrorBoundary]', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="text-xl font-bold text-[var(--color-fg)]">页面出错了</p>
            <p className="max-w-md text-sm text-[var(--color-muted)]">发生了一个未知错误，请刷新重试。</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              刷新
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
