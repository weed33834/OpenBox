import { memo, useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { useT } from "@/i18n/useI18n";

/**
 * 滚动到顶部按钮：当页面滚动超过 400px 时显示，点击平滑滚动回顶部。
 * 使用 requestAnimationFrame 防抖，避免 scroll 事件频繁触发 re-render。
 */
function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const t = useT();

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setVisible(window.scrollY > 400);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="scroll-top-btn fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-[calc(1.5rem+env(safe-area-inset-right))] z-40 flex h-11 w-11 items-center justify-center rounded-full border border-cyber-cyan/30 bg-cyber-surface/90 text-cyber-cyan shadow-lg backdrop-blur-sm transition-all hover:border-cyber-cyan/60 hover:bg-cyber-cyan/10 hover:shadow-[0_0_20px_rgba(0,229,255,0.2)] md:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]"
      aria-label={t("scrollToTop")}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}

export default memo(ScrollToTop);
