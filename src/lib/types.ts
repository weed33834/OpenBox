// OpenBox 统一导航站 —— 核心数据模型
// 设计原则：
// 1) 单一 Resource 模型覆盖所有资源类型（免费API/中转站/代理节点/AI应用/工具/学习），
//    通过 subType(子类型) 与 scenarios(场景) 两个维度做归类与筛选。
// 2) 两级分类法（场景 + 子类型）完全由 src/data/taxonomy.ts 配置驱动，新增/调整分类
//    只改配置，不碰业务代码 —— 满足「可扩展」硬要求。
// 3) 多语言文案：分类/场景名用 LocalizedText（数据即多语），界面 chrome 走 i18n 字典。

/** 支持的语言。与 i18n 的 Lang 保持一致。 */
export type LocaleKey = 'zh' | 'en' | 'ja';

/** 多语言文本：同一字段的中/英/日三语。 */
export type LocalizedText = Record<LocaleKey, string>;

/** 资源计费类型 */
export type ResourceType = 'free' | 'freemium' | 'trial' | 'paid';

/** 资源可用状态（健康检查或社区标记） */
export type ResourceStatus = 'ok' | 'unstable' | 'unknown' | 'dead';

/**
 * 子类型（分类树的叶子，对应路由 #/category/:slug）。
 * 全站唯一，例如 免费API / 中转站 / 代理节点 / AI应用 / 工具 / 学习。
 */
export interface SubType {
  slug: string;
  /** 多语显示名 */
  name: LocalizedText;
  /** lucide-react 图标名（见 components/Icon.tsx 的白名单映射） */
  icon: string;
  /** 强调色（hex），用于卡片描边、图标底色等 */
  color: string;
  /** 一句话描述（多语） */
  description: LocalizedText;
  /** 排序权重，越小越靠前 */
  sort: number;
}

/**
 * 场景（分类树的一级，例如 小白白嫖 / 开发者 / 研究者 / 创作者）。
 * 一个资源可归属多个场景（scenarios: string[]），场景与子类型是「交叉」关系，
 * 因此场景下的子类型由数据动态推导，而非写死映射。
 */
export interface Scenario {
  slug: string;
  name: LocalizedText;
  icon: string;
  color: string;
  description: LocalizedText;
  sort: number;
}

/** 统一资源实体 */
export interface Resource {
  id: string;
  /** 所属子类型 slug（对应 SubType.slug，路由 #/category/:slug 过滤维度） */
  subType: string;
  /** 归属场景 slug 列表（对应 Scenario.slug，可多个） */
  scenarios: string[];
  name: string;
  /** 跳转外链 */
  url: string;
  type: ResourceType;
  status: ResourceStatus;
  /** 一句话简介，展示在卡片与列表 */
  summary: string;
  /** 详情描述，展示在详情页 */
  description: string;
  /** 特点标签，如 免费/签到/海外/国产/多模型 */
  tags: string[];
  /** 支持的模型（API/中转类） */
  models?: string[];
  /** 支持的协议（代理节点类：vmess/vless/ss/trojan） */
  protocols?: string[];
  /** 地区（代理节点类） */
  region?: string;
  /** 价格 / 额度说明 */
  pricing?: string;
  /** 注册 / 获取方式 */
  register?: string;
  /** 优点（详情页） */
  pros?: string[];
  /** 缺点 / 风险（详情页） */
  cons?: string[];
  /** 使用建议（详情页） */
  tips?: string;
  /** 是否官方出品 */
  official?: boolean;
  /** 是否首页精选 */
  featured?: boolean;
  /** 最近更新时间（ISO 日期字符串） */
  updatedAt?: string;
  /** 编辑人气分（0-100，静态全局信号，用于热门榜；接入后端后可被真实信号替换） */
  popularity?: number;
  /** 是否来自社区投稿（已审核通过、由后端合并进列表） */
  community?: boolean;
}

/** 社区投稿（落库到 submissions 表，待审核） */
export interface Submission {
  id?: string;
  /** 投稿归属的子类型 slug */
  subType: string;
  name: string;
  url: string;
  type: ResourceType;
  summary: string;
  description?: string;
  submitter?: string;
  status?: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
}
