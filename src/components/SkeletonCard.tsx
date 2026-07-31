import { memo } from "react";

/**
 * 骨架屏卡片：在站点数据加载或筛选时显示，提供视觉占位避免布局跳动。
 * 与 SiteCard 尺寸一致，使用 shimmer 动画填充。
 */
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-cyber-border bg-cyber-elevated/50 p-4">
      {/* 标题行 */}
      <div className="mb-2 flex items-center gap-2">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-4 w-12 rounded-full" />
      </div>
      {/* URL 行 */}
      <div className="skeleton mb-3 h-3 w-32" />
      {/* 描述行 */}
      <div className="skeleton mb-1.5 h-3 w-full" />
      <div className="skeleton mb-3 h-3 w-3/4" />
      {/* 标签行 */}
      <div className="flex gap-1.5">
        <div className="skeleton h-5 w-12 rounded-full" />
        <div className="skeleton h-5 w-10 rounded-full" />
        <div className="skeleton h-5 w-14 rounded-full" />
      </div>
    </div>
  );
}

/** 骨架屏网格：渲染指定数量的骨架卡片 */
function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export default memo(SkeletonGrid);
export { SkeletonCard };
