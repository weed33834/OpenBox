import { useEffect, useState } from "react";

/**
 * 响应式断点 hook：监听 media query 变化，SSR 安全（无 window 时返回 false）。
 * 用于把"桌面并排表格"与"移动端竖向卡片"这类需要专门设计的布局区分开。
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** 移动端判定（Tailwind md 断点 768px 以下）。与 Toolbar 的 md: 断点保持一致。 */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}
