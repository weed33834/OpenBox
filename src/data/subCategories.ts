// 子分类定义：为站点数量较多的分类提供额外导航层级
// 每个子分类对应一个 type 筛选（free / freemium / paid）
// 子分类页面在 CategoryPage 和 CategorySitePage 之间插入，增加页面转场导航

import { type SiteType } from "./sites";

export interface SubCategoryDef {
  key: SiteType;
  label: string;
  desc: string;
  color: string;
  icon: string; // emoji 图标，避免引入额外 icon 依赖
}

// 需要启用子分类的父分类（站点数量 >= 15 的分类）
export const ENABLED_SUB_CATEGORIES: Record<string, SubCategoryDef[]> = {
  paidrelay: [
    {
      key: "free",
      label: "免费 / 免费增值",
      desc: "注册即送免费额度，适合试用与轻量使用",
      color: "#34d399",
      icon: "🎁",
    },
    {
      key: "freemium",
      label: "免费增值",
      desc: "免费额度 + 付费升级，灵活选择",
      color: "#00e5ff",
      icon: "⚡",
    },
    {
      key: "paid",
      label: "付费中转",
      desc: "纯付费商业中转，稳定性与速度更有保障",
      color: "#ffb020",
      icon: "💎",
    },
  ],
  overseas: [
    {
      key: "free",
      label: "完全免费",
      desc: "无需付费即可调用，适合个人开发与学习",
      color: "#34d399",
      icon: "🆓",
    },
    {
      key: "freemium",
      label: "免费额度",
      desc: "注册送免费额度，超出后按量计费",
      color: "#00e5ff",
      icon: "✨",
    },
    {
      key: "paid",
      label: "付费层",
      desc: "纯付费 API，企业级 SLA 保障",
      color: "#ffb020",
      icon: "🏢",
    },
  ],
  freechat: [
    {
      key: "free",
      label: "免费对话站",
      desc: "完全免费，无需登录即可使用",
      color: "#34d399",
      icon: "💬",
    },
    {
      key: "freemium",
      label: "免费增值",
      desc: "有免费额度，高级功能需付费",
      color: "#00e5ff",
      icon: "🔋",
    },
  ],
  linuxdo: [
    {
      key: "free",
      label: "纯公益免费",
      desc: "LinuxDo 社区完全免费公益站",
      color: "#34d399",
      icon: "❤️",
    },
    {
      key: "freemium",
      label: "免费额度",
      desc: "注册送额度，可签到续费",
      color: "#00e5ff",
      icon: "🎯",
    },
  ],
};