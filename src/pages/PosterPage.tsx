import { useEffect, useState } from "react";
import { ChevronRight, Sparkles, Globe } from "lucide-react";
import { sites } from "@/data/sites";

export default function PosterPage() {
  const [loaded, setLoaded] = useState(false);

  // 回访用户直接跳过海报页
  useEffect(() => {
    if (localStorage.getItem("openbox_visited") === "true") {
      window.location.hash = "#/home";
      return;
    }
  }, []);

  const handleEnter = () => {
    localStorage.setItem("openbox_visited", "true");
    window.location.hash = "#/home";
  };

  useEffect(() => {
    // 入场动画触发
    const id = setTimeout(() => setLoaded(true), 100);
    // 键盘快捷进入（Enter/Space）
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleEnter();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(id);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-cyber-bg">
      {/* 背景装饰：网格线 */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,229,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.03)_1px,transparent_1px)] bg-[length:60px_60px]" />

      {/* 背景光晕 */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2">
        <div className="h-[600px] w-[600px] animate-pulse rounded-full bg-cyber-cyan/5 blur-[120px]" />
      </div>
      <div className="pointer-events-none absolute bottom-1/4 right-1/4">
        <div className="h-[400px] w-[400px] animate-pulse rounded-full bg-cyber-magenta/5 blur-[100px]" style={{ animationDelay: "1s" }} />
      </div>

      {/* 顶部装饰条 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyber-cyan/60 to-transparent" />

      {/* 主体内容 */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
        {/* 徽章 */}
        <div
          className={`inline-flex items-center gap-2 rounded-full border border-cyber-cyan/30 bg-cyber-cyan/10 px-4 py-1.5 font-mono text-[11px] text-cyber-cyan backdrop-blur-sm transition-all duration-700 ${
            loaded ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI API Navigation
        </div>

        {/* 主标题 */}
        <h1
          className={`font-display text-5xl font-bold leading-tight tracking-tight sm:text-7xl md:text-8xl transition-all duration-700 ${
            loaded ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-95"
          }`}
          style={{ transitionDelay: "120ms", transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
        >
          <span className="bg-gradient-to-r from-cyber-cyan via-cyber-text to-cyber-magenta bg-clip-text text-transparent">
            OpenBox
          </span>
        </h1>

        {/* 副标题 */}
        <p
          className={`max-w-lg font-mono text-sm leading-relaxed text-cyber-muted sm:text-base transition-all duration-700 ${
            loaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
          style={{ transitionDelay: "240ms" }}
        >
          收录 {sites.length}+ AI API 站点，聚合全网公益中转站、免费中继、付费代理与官方平台
        </p>

        {/* 三语言提示 */}
        <div
          className={`flex items-center gap-3 font-mono text-[11px] text-cyber-muted/60 transition-all duration-700 ${
            loaded ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
          style={{ transitionDelay: "360ms" }}
        >
          <span>中文</span>
          <span className="h-3 w-px bg-cyber-border" />
          <span>English</span>
          <span className="h-3 w-px bg-cyber-border" />
          <span>日本語</span>
        </div>

        {/* 进入按钮 */}
        <button
          onClick={handleEnter}
          className={`group relative mt-4 inline-flex items-center gap-3 rounded-full border border-cyber-cyan/40 bg-cyber-cyan/10 px-8 py-4 font-display text-lg font-semibold text-cyber-cyan transition-all duration-500 hover:border-cyber-cyan/60 hover:bg-cyber-cyan/20 hover:shadow-glow-cyan ${
            loaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
          style={{ transitionDelay: "480ms" }}
        >
          <Globe className="h-5 w-5" />
          探索站点
          <ChevronRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
          {/* 按钮扫描光效 */}
          <span className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-cyber-cyan/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </button>
      </div>

      {/* 底部信息 */}
      <div
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[11px] text-cyber-muted/40 transition-all duration-1000 delay-500 ${
          loaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        React + TypeScript + Vite
      </div>
    </div>
  );
}