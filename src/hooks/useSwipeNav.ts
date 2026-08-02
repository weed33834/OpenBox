// 移动端滑动手势导航：左右滑动切换页面
// 用于替代部分上下滑动操作，增加页面转场感

import { useEffect, useRef, useState, type RefObject } from "react";

interface SwipeConfig {
  /** 触发滑动手势的最小水平距离（px） */
  threshold?: number;
  /** 滑动手势的最大垂直距离（超过则视为垂直滑动） */
  maxVertical?: number;
  /** 目标元素 ref */
  ref: RefObject<HTMLElement | null>;
  /** 右滑回调（返回上一页） */
  onSwipeRight?: () => void;
  /** 左滑回调（前进） */
  onSwipeLeft?: () => void;
}

export function useSwipeNav({
  ref,
  threshold = 60,
  maxVertical = 30,
  onSwipeRight,
  onSwipeLeft,
}: SwipeConfig) {
  const startX = useRef(0);
  const startY = useRef(0);
  const isTracking = useRef(false);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [swipeDir, setSwipeDir] = useState<"left" | "right" | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if ((e.target as HTMLElement)?.closest?.("[data-no-swipe]")) return;
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      isTracking.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isTracking.current) return;
      const dx = e.touches[0].clientX - startX.current;
      const dy = Math.abs(e.touches[0].clientY - startY.current);

      // 垂直滑动超过阈值，取消追踪
      if (dy > maxVertical && Math.abs(dx) < threshold) {
        isTracking.current = false;
        setSwipeProgress(0);
        setSwipeDir(null);
        return;
      }

      // 更新滑动进度（用于视觉反馈）
      const progress = Math.min(Math.abs(dx) / threshold, 1);
      setSwipeProgress(progress);
      setSwipeDir(dx > 0 ? "right" : "left");
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!isTracking.current) return;
      isTracking.current = false;

      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = Math.abs(e.changedTouches[0].clientY - startY.current);

      setSwipeProgress(0);
      setSwipeDir(null);

      if (dy > maxVertical) return;
      if (Math.abs(dx) < threshold) return;

      if (dx > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (dx < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [ref, threshold, maxVertical, onSwipeRight, onSwipeLeft]);

  return { swipeProgress, swipeDir };
}