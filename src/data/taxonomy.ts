import type { Resource, Scenario, SubType } from '@/lib/types';

// ============================================================================
// 全站分类「单一数据源」。新增场景/子类型只需在此追加一条，
// 路由、导航、首页场景树、投稿表单会自动适配 —— 纯配置驱动，不写业务代码。
// ============================================================================

// ---- 子类型（分类树叶子，对应 #/category/:slug） ----
export const subTypes: SubType[] = [
  {
    slug: 'free-api',
    name: { zh: '免费 API', en: 'Free APIs', ja: '無料API' },
    icon: 'Server',
    color: '#4f46e5',
    description: {
      zh: '各厂商与社区提供的免费大模型 API：官方免费层、公益站、开源兼容端点。',
      en: 'Free model APIs from vendors and communities: free tiers, public-good relays, open endpoints.',
      ja: '各ベンダー・コミュニティ提供の無料モデルAPI：無料枠・公益中継・OSS互換エンドポイント。',
    },
    sort: 1,
  },
  {
    slug: 'relays',
    name: { zh: '中转站', en: 'Relays', ja: '中継局' },
    icon: 'Network',
    color: '#0ea5e9',
    description: {
      zh: 'API 转发与聚合服务，提供 OpenAI / Claude 等兼容接口与额度。',
      en: 'API forwarding & aggregation with OpenAI/Claude-compatible endpoints and quotas.',
      ja: 'OpenAI/Claude 互換の転送・集約サービス。エンドポイントとクオータを提供。',
    },
    sort: 2,
  },
  {
    slug: 'proxy-nodes',
    name: { zh: '代理节点', en: 'Proxy Nodes', ja: 'プロキシ' },
    icon: 'Globe',
    color: '#10b981',
    description: {
      zh: '免费代理 / 节点客户端与聚合项目，附协议与地区说明。',
      en: 'Free proxy clients & aggregation projects, with protocol and region notes.',
      ja: '無料プロキシクライアント・集約プロジェクト。プロトコルと地域の説明付き。',
    },
    sort: 3,
  },
  {
    slug: 'ai-apps',
    name: { zh: 'AI 应用', en: 'AI Apps', ja: 'AIアプリ' },
    icon: 'Sparkles',
    color: '#ec4899',
    description: {
      zh: '开箱即用的 AI 产品：对话、绘画、编程、音乐、搜索等。',
      en: 'Ready-to-use AI products: chat, image, coding, music, search and more.',
      ja: 'すぐ使えるAI製品：チャット・画像・コーディング・音楽・検索など。',
    },
    sort: 4,
  },
  {
    slug: 'tools',
    name: { zh: '实用工具', en: 'Tools', ja: 'ツール' },
    icon: 'Wrench',
    color: '#f59e0b',
    description: {
      zh: '开发框架、部署平台、可视化编排与本地推理等效率工具。',
      en: 'Dev frameworks, deploy platforms, visual orchestration, local inference and more.',
      ja: '開発フレームワーク・デプロイ基盤・可視化オーケストレーション・ローカル推論など。',
    },
    sort: 5,
  },
  {
    slug: 'learn',
    name: { zh: '学习资源', en: 'Learning', ja: '学習リソース' },
    icon: 'BookOpen',
    color: '#8b5cf6',
    description: {
      zh: '提示词库、官方文档、入门课程与实战教程，助你快速上手。',
      en: 'Prompt libraries, official docs, intro courses and hands-on tutorials.',
      ja: 'プロンプト集・公式ドキュメント・入門講座・実践チュートリアル。',
    },
    sort: 6,
  },
  {
    slug: 'free-server',
    name: { zh: '免费服务器/VPS', en: 'Free Servers/VPS', ja: '無料サーバー/VPS' },
    icon: 'Server',
    color: '#06b6d4',
    description: {
      zh: '云厂商免费额度与永久免费小鸡：AWS / Oracle / GCP / 免费托管等。',
      en: 'Free cloud tiers & always-free VPS: AWS, Oracle, GCP, free hosting and more.',
      ja: 'クラウド無料枠・永久無料VPS：AWS/Oracle/GCP/無料ホスティングなど。',
    },
    sort: 7,
  },
  {
    slug: 'free-domain',
    name: { zh: '免费域名', en: 'Free Domains', ja: '無料ドメイン' },
    icon: 'Globe',
    color: '#8b5cf6',
    description: {
      zh: 'eu.org 等老牌免费二级域名，可指 NS / 托管到 Cloudflare 解析。',
      en: 'Long-standing free subdomains like eu.org — custom NS, Cloudflare-friendly.',
      ja: 'eu.org 等の老舗無料サブドメイン。NS 指定・Cloudflare 連携可。',
    },
    sort: 8,
  },
  {
    slug: 'charity',
    name: { zh: '公益站', en: 'Charity', ja: '公益' },
    icon: 'Heart',
    color: '#ec4899',
    description: {
      zh: '个人/社区运营的免费 AI 网关与公益站：每日签到领额度，只认 CLI 客户端。',
      en: 'Community-run free AI gateways & charity relays: daily check-in quotas, CLI-friendly.',
      ja: '個人・コミュニティ運営の無料AIゲートウェイ：毎日ログインで枠取得、CLI推奨。',
    },
    sort: 9,
  },
  // ---- 邀请码/激活码（2026-08-06 新增） ----
  {
    slug: 'invite-system',
    name: { zh: '系统软件', en: 'System Software', ja: 'システムソフト' },
    icon: 'Monitor',
    color: '#6366f1',
    description: {
      zh: 'Windows/macOS/Linux 系统工具、开发环境、实用软件的激活码与序列号。',
      en: 'Activation keys for Windows/macOS/Linux system tools, dev environments and utilities.',
      ja: 'Windows/macOS/Linux 向けシステムツール・開発環境・ユーティリティのアクティベーションキー。',
    },
    sort: 10,
  },
  {
    slug: 'invite-professional',
    name: { zh: '专业应用', en: 'Professional Apps', ja: 'プロフェッショナルアプリ' },
    icon: 'Briefcase',
    color: '#8b5cf6',
    description: {
      zh: '设计、办公、开发、视频剪辑等专业软件激活码与优惠码。',
      en: 'Activation codes for design, office, development, video editing and other professional software.',
      ja: 'デザイン・オフィス・開発・動画編集などのプロフェッショナルソフトのアクティベーションコード。',
    },
    sort: 11,
  },
  {
    slug: 'invite-mobile',
    name: { zh: '手机软件', en: 'Mobile Apps', ja: 'モバイルアプリ' },
    icon: 'Smartphone',
    color: '#ec4899',
    description: {
      zh: 'iOS/Android 应用的内测资格、邀请码与兑换码。',
      en: 'Beta invites, invite codes and redemption codes for iOS/Android apps.',
      ja: 'iOS/Android アプリのクローズドベータ招待コードと引き換えコード。',
    },
    sort: 12,
  },
  {
    slug: 'invite-games',
    name: { zh: '游戏', en: 'Games', ja: 'ゲーム' },
    icon: 'Gamepad2',
    color: '#10b981',
    description: {
      zh: '各类游戏激活码、内测资格、礼品码与福利码。',
      en: 'Game activation keys, beta invites, gift codes and reward codes.',
      ja: 'ゲームのアクティベーションキー・クローズドベータ招待・ギフトコード。',
    },
    sort: 13,
  },
  {
    slug: 'invite-platform',
    name: { zh: '平台邀请', en: 'Platform Invites', ja: 'プラットフォーム招待' },
    icon: 'Globe',
    color: '#0ea5e9',
    description: {
      zh: 'AI 平台、云服务、社区论坛、会员制平台的邀请码与注册码。',
      en: 'Invite codes for AI platforms, cloud services, forums and membership sites.',
      ja: 'AIプラットフォーム・クラウドサービス・コミュニティフォーラムの招待コード。',
    },
    sort: 14,
  },
];

// ---- 场景（分类树一级，例如 小白白嫖 / 开发者 / 研究者 / 创作者） ----
export const scenarios: Scenario[] = [
  {
    slug: 'newbie',
    name: { zh: '小白白嫖', en: 'For Beginners', ja: '初心者向け' },
    icon: 'Sparkles',
    color: '#22c55e',
    description: {
      zh: '不想折腾、拿来就用的免费资源合集。',
      en: 'Free resources you can use right away, no setup required.',
      ja: '設定不要ですぐ使える無料リソースまとめ。',
    },
    sort: 1,
  },
  {
    slug: 'developer',
    name: { zh: '开发者', en: 'Developers', ja: '開発者' },
    icon: 'Code',
    color: '#4f46e5',
    description: {
      zh: '接 API、搭环境、写 Agent 需要的工具与端点。',
      en: 'APIs, environments and tooling for building agents and apps.',
      ja: 'API・環境構築・Agent開発に必要なツールとエンドポイント。',
    },
    sort: 2,
  },
  {
    slug: 'researcher',
    name: { zh: '研究者', en: 'Researchers', ja: '研究者' },
    icon: 'Microscope',
    color: '#8b5cf6',
    description: {
      zh: '论文、长文档、RAG 与多模型对比的趁手资源。',
      en: 'Papers, long-context, RAG and multi-model comparison tooling.',
      ja: '論文・長文文脈・RAG・マルチモデル比較のためのツール。',
    },
    sort: 3,
  },
  {
    slug: 'creator',
    name: { zh: '创作者', en: 'Creators', ja: 'クリエイター' },
    icon: 'Palette',
    color: '#ec4899',
    description: {
      zh: '写文案、画图、做音乐、剪视频的 AI 好帮手。',
      en: 'AI sidekicks for writing, art, music and video.',
      ja: '文章・イラスト・音楽・動画制作のAI助手。',
    },
    sort: 4,
  },
  // ---- 邀请码/激活码场景（2026-08-06 新增） ----
  {
    slug: 'invite-codes',
    name: { zh: '邀请码/激活码', en: 'Invite Codes', ja: '招待コード' },
    icon: 'Key',
    color: '#f59e0b',
    description: {
      zh: '各类软件、游戏、平台的邀请码与激活码，每日更新。',
      en: 'Invite codes & activation keys for software, games, and platforms, updated daily.',
      ja: 'ソフトウェア・ゲーム・プラットフォームの招待コードとアクティベーションキー。',
    },
    sort: 5,
  },
];

// ---- 子类型 → 默认归属场景（资源未显式声明 scenarios 时的回退） ----
// 注意：场景与子类型是交叉关系，资源可在 scenarios 字段里覆盖此默认值。
export const SUBTYPE_SCENARIOS: Record<string, string[]> = {
  'free-api': ['newbie', 'developer', 'researcher', 'creator'],
  relays: ['developer', 'researcher'],
  'proxy-nodes': ['newbie', 'developer'],
  'ai-apps': ['newbie', 'creator', 'researcher'],
  tools: ['developer', 'researcher', 'creator'],
  learn: ['newbie', 'developer', 'researcher', 'creator'],
  'free-server': ['newbie', 'developer'],
  'free-domain': ['newbie', 'developer'],
  charity: ['newbie', 'developer'],
  // ---- 邀请码/激活码 ----
  'invite-system': ['invite-codes'],
  'invite-professional': ['invite-codes'],
  'invite-mobile': ['invite-codes'],
  'invite-games': ['invite-codes'],
  'invite-platform': ['invite-codes'],
};

// ---- 快捷映射 ----
export const subTypeMap: Record<string, SubType> = Object.fromEntries(subTypes.map((s) => [s.slug, s]));
export const scenarioMap: Record<string, Scenario> = Object.fromEntries(scenarios.map((s) => [s.slug, s]));

export function getSubType(slug: string): SubType | undefined {
  return subTypeMap[slug];
}
export function getScenario(slug: string): Scenario | undefined {
  return scenarioMap[slug];
}

export function getAllSubTypes(): SubType[] {
  return [...subTypes].sort((a, b) => a.sort - b.sort);
}
export function getAllScenarios(): Scenario[] {
  return [...scenarios].sort((a, b) => a.sort - b.sort);
}

/** 解析资源实际归属的场景（优先用资源自带 scenarios，否则回退到子类型默认映射） */
export function resolveScenarios(r: Resource): string[] {
  if (r.scenarios && r.scenarios.length) return r.scenarios;
  return SUBTYPE_SCENARIOS[r.subType] ?? [];
}

export interface ScenarioTreeNode {
  scenario: Scenario;
  /** 该场景下的子类型（由数据动态推导，仅含确有资源的子类型） */
  subTypes: SubType[];
  /** 该场景下的资源总数 */
  count: number;
}

/**
 * 由资源数据构建「场景 → 子类型」树（首页「全部分类」使用）。
 * 完全数据驱动：某子类型若在当前数据中无资源，则不会出现在任何场景下。
 */
export function buildScenarioTree(resources: Resource[]): ScenarioTreeNode[] {
  const byScenario = new Map<string, Set<string>>();
  const countByScenario = new Map<string, number>();
  for (const r of resources) {
    const scs = resolveScenarios(r);
    for (const sc of scs) {
      if (!byScenario.has(sc)) byScenario.set(sc, new Set());
      byScenario.get(sc)!.add(r.subType);
      countByScenario.set(sc, (countByScenario.get(sc) ?? 0) + 1);
    }
  }
  return scenarios
    .filter((s) => byScenario.has(s.slug))
    .map((s) => ({
      scenario: s,
      subTypes: [...byScenario.get(s.slug)!]
        .map((slug) => subTypeMap[slug])
        .filter(Boolean)
        .sort((a, b) => a.sort - b.sort),
      count: countByScenario.get(s.slug) ?? 0,
    }));
}
