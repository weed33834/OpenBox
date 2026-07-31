import { Component, type ReactNode } from "react";
import { translate } from "@/i18n/useI18n";
import { useI18n } from "@/i18n/useI18n";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * 全局错误边界：捕获子树渲染异常，防止白屏。
 * 生产环境显示友好提示，开发环境保留错误信息。
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error);
    }
  }

  render() {
    if (this.state.hasError) {
      const lang = useI18n.getState().lang;
      return (
        this.props.fallback ?? (
          <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-cyber-bg p-8 text-center">
            <p className="font-display text-xl font-bold text-cyber-dead">
              {translate(lang, "error.title")}
            </p>
            <p className="max-w-md text-sm text-cyber-muted">
              {translate(lang, "error.desc")}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-cyber-cyan px-4 py-2 text-sm font-semibold text-cyber-bg transition-all hover:shadow-glow-cyan"
            >
              {translate(lang, "error.reload")}
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
