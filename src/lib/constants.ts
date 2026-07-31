// 共享常量：特点标签颜色 / 分类排序 / 实时状态颜色
// 被 SiteCard / DetailDrawer / SiteGrid / useFilterStore 共享，避免重复定义

// 特点标签颜色映射（SiteCard 和 DetailDrawer 共享）
export const FEATURE_COLOR: Record<string, string> = {
  免费: "#34d399",
  签到: "#ffb020",
  免费额度: "#00e5ff",
  国产: "#60a5fa",
  海外: "#a78bfa",
  公益: "#ff2e88",
  低延迟: "#34d399",
  "Linux.do": "#00e5ff",
  付费: "#ffb020",
  无需注册: "#34d399",
  企业级: "#60a5fa",
  开源: "#94a3b8",
  多模型: "#a78bfa",
  邮箱注册: "#34d399",
  GitHub: "#94a3b8",
  导航: "#00e5ff",
  社区: "#ff2e88",
};

// 分类排序（useFilterStore 和 SiteGrid 共享）
export const CAT_ORDER = [
  "linuxdo",
  "freechat",
  "freerelay",
  "paidrelay",
  "overseas",
  "domestic",
  "tool",
] as const;

// 实时状态颜色
// 类型保持 Record<string, string>（宽松），避免与 useFilterStore 的 LiveStatus 产生循环导入
export const LIVE_COLOR: Record<string, string> = {
  checking: "#ffb020",
  up: "#34d399",
  down: "#ef4444",
  unknown: "#8b95a8",
};
