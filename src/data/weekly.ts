import type { LocalizedText } from '@/lib/types';

export interface WeeklyUpdate {
  /** 稳定唯一标识（用于 React key，避免 index 做 key 导致不必要的重渲染） */
  id: string;
  /** 展示用日期，如 '2026-08-01' */
  date: string;
  kind: 'update' | 'account' | 'notice';
  title: LocalizedText;
  desc?: LocalizedText;
}

// 配置文件驱动：后续在此追加「账号动态 / 每周更新」即可，组件无需改动。
export const weeklyUpdates: WeeklyUpdate[] = [
  {
    id: 'open',
    date: '2026-08-04',
    kind: 'notice',
    title: {
      zh: 'OpenBox 导航站上线',
      en: 'OpenBox directory is live',
      ja: 'OpenBox ナビ公開',
    },
    desc: {
      zh: '聚合免费 API、中转站、代理节点、AI 应用与实用工具，一处直达。',
      en: 'Free APIs, relays, proxy nodes, AI apps and tools — all in one place.',
      ja: '無料API・中継局・プロキシ・AIアプリ・ツールを一か所に。',
    },
  },
  {
    id: 'free-api',
    date: '2026-08-04',
    kind: 'update',
    title: {
      zh: '新增官方免费 API 合集',
      en: 'Official free APIs added',
      ja: '公式無料APIを追加',
    },
    desc: {
      zh: '已收录 Google AI Studio、Groq、Cerebras、OpenRouter 等稳定免费档。',
      en: 'Added stable free tiers: Google AI Studio, Groq, Cerebras, OpenRouter and more.',
      ja: 'Google AI Studio・Groq・Cerebras・OpenRouter など安定無料枠を収録。',
    },
  },
  {
    id: 'submissions',
    date: '2026-08-04',
    kind: 'account',
    title: {
      zh: '投稿通道已开放',
      en: 'Submissions are open',
      ja: '投稿受付中',
    },
    desc: {
      zh: '欢迎通过「投稿」补充你常用的免费资源，审核通过后上线。',
      en: 'Submit your favorite free resources via the form; they go live after review.',
      ja: '「投稿」からお気に入りの無料リソースを送信できます（確認後公開）。',
    },
  },
];
