import type { ResourceStatus, ResourceType } from '@/lib/types';

// 计费类型与状态的展示元信息（颜色 / 文案）。集中管理，避免组件内散落硬编码。
export const TYPE_META: Record<ResourceType, { label: string; color: string }> = {
  free: { label: '免费', color: '#10b981' },
  freemium: { label: '免费额度', color: '#0ea5e9' },
  trial: { label: '试用', color: '#8b5cf6' },
  paid: { label: '付费', color: '#f59e0b' },
};

export const STATUS_META: Record<ResourceStatus, { label: string; color: string }> = {
  ok: { label: '可用', color: '#10b981' },
  unstable: { label: '不稳定', color: '#f59e0b' },
  unknown: { label: '未验证', color: '#94a3b8' },
  dead: { label: '已失效', color: '#ef4444' },
};

export const ALL_TYPES: ResourceType[] = ['free', 'freemium', 'trial', 'paid'];
export const ALL_STATUSES: ResourceStatus[] = ['ok', 'unstable', 'unknown', 'dead'];
