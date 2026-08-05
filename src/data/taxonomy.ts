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
