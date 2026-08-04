// 数据访问层（Data Access Layer）
// 设计：
//   - 资源主数据始终来自本地种子 src/data/seed.ts（可靠、离线可渲染、无需先建库）。
//   - 当配置了 Supabase 时，额外合并「已审核通过的社区投稿」(submissions.status='approved')，
//     使 Supabase 成为一个可读写的投稿审核库，而无需把整个资源库搬到云端（避免空表导致首页空白）。
//   - 投稿提交（submitResource）在配置 Supabase 时写入云端审核库，否则落本地草稿。
// 上层页面只依赖本文件的异步接口，无需关心数据来自哪里 —— 单一入口、可替换、易测试。
import { supabase, hasSupabase } from './supabase';
import { subTypes, scenarios } from '@/data/taxonomy';
import { seedResources } from '@/data/seed';
import type { Resource, ResourceStatus, ResourceType, Scenario, SubType, Submission } from './types';

export interface ResourceQuery {
  subType?: string;
  scenario?: string;
  q?: string;
  type?: ResourceType | 'all';
  status?: ResourceStatus | 'all';
  sort?: 'default' | 'name' | 'updated';
}

/** 社区投稿在合并进列表时使用的 id 前缀（与本地种子 id 区分，避免冲突） */
const COMMUNITY_PREFIX = 'community-';

/**
 * DB 行形状（snake_case，与 Supabase PostgREST 返回格式一致）。
 * 注意与 TS 类型 Submission 的区别：后者用 camelCase（createdAt）。
 * 修正了此前直接用 Submission 类型强制转换导致 created_at→createdAt 字段丢失的 bug。
 */
interface SubmissionRow {
  id: string;
  subType: string;
  name: string;
  url: string;
  type: string;
  summary: string;
  description: string | null;
  submitter: string | null;
  status: string;
  created_at: string;
}

/** 对给定资源列表执行统一筛选 + 排序（本地种子与社区投稿共用） */
function filterResources(list: Resource[], query: ResourceQuery): Resource[] {
  let out = [...list];

  if (query.subType) out = out.filter((r) => r.subType === query.subType);
  if (query.scenario) out = out.filter((r) => (r.scenarios ?? []).includes(query.scenario!));
  if (query.q) {
    const q = query.q.trim().toLowerCase();
    if (q) {
      out = out.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.summary.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          (r.tags ?? []).some((t) => t.toLowerCase().includes(q)) ||
          (r.models ?? []).some((m) => m.toLowerCase().includes(q)),
      );
    }
  }
  if (query.type && query.type !== 'all') out = out.filter((r) => r.type === query.type);
  if (query.status && query.status !== 'all') out = out.filter((r) => r.status === query.status);

  switch (query.sort) {
    case 'name':
      out.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'updated':
      out.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
      break;
    default:
      // 精选优先，其余按名称
      out.sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false) || a.name.localeCompare(b.name));
  }
  return out;
}

/** 将一条已通过的投稿（DB 行）映射为资源实体（合并进列表展示） */
function submissionToResource(row: SubmissionRow): Resource {
  return {
    id: `${COMMUNITY_PREFIX}${row.id}`,
    subType: row.subType,
    scenarios: [],
    name: row.name,
    url: row.url,
    type: row.type as ResourceType,
    status: 'ok',
    summary: row.summary,
    description: row.description ?? '',
    tags: ['社区投稿'],
    models: [],
    protocols: [],
    pros: [],
    cons: [],
    featured: false,
    official: false,
    community: true,
    // DB 列 created_at（snake_case）→ Resource 字段 updatedAt（camelCase）
    updatedAt: row.created_at,
  };
}

/** 拉取已审核通过的社区投稿（仅配置 Supabase 时调用） */
export async function getCommunityResources(): Promise<Resource[]> {
  if (!(hasSupabase && supabase)) return [];
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return (data as SubmissionRow[]).map(submissionToResource);
  } catch {
    return [];
  }
}

export async function getSubTypes(): Promise<SubType[]> {
  return subTypes;
}

export async function getScenarios(): Promise<Scenario[]> {
  return scenarios;
}

export async function getResources(query: ResourceQuery = {}): Promise<Resource[]> {
  // 本地种子始终作为基础来源，保证离线/未配置时也能渲染
  const local = filterResources(seedResources, query);
  if (!(hasSupabase && supabase)) return local;
  // 已配置 Supabase：额外合并已通过审核的社区投稿
  try {
    const community = await getCommunityResources();
    return [...local, ...filterResources(community, query)];
  } catch {
    return local;
  }
}

export async function getResource(id: string): Promise<Resource | null> {
  // 社区投稿走云端
  if (id.startsWith(COMMUNITY_PREFIX) && hasSupabase && supabase) {
    const subId = id.slice(COMMUNITY_PREFIX.length);
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', subId)
      .eq('status', 'approved')
      .maybeSingle();
    if (!error && data) return submissionToResource(data as SubmissionRow);
    return null;
  }
  return seedResources.find((r) => r.id === id) ?? null;
}

export type SubmitResult = {
  ok: boolean;
  mode: 'supabase' | 'local';
  id?: string;
  message?: string;
};

export async function submitResource(
  payload: Omit<Submission, 'id' | 'status' | 'createdAt'>,
): Promise<SubmitResult> {
  if (hasSupabase && supabase) {
    const { data, error } = await supabase
      .from('submissions')
      .insert({ ...payload, status: 'pending', created_at: new Date().toISOString() })
      .select()
      .single();
    if (!error && data) return { ok: true, mode: 'supabase', id: (data as SubmissionRow).id, message: '投稿已提交，等待审核通过后展示。' };
    return { ok: false, mode: 'supabase', message: error?.message ?? '提交失败' };
  }
  // 本地兜底：存入 localStorage（仅本机可见，不进入审核库）
  try {
    const key = 'ob_submissions';
    const list = JSON.parse(localStorage.getItem(key) ?? '[]') as Submission[];
    const item: Submission = {
      ...payload,
      id: `local-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    list.push(item);
    localStorage.setItem(key, JSON.stringify(list));
    return { ok: true, mode: 'local', id: item.id, message: '已保存到本地草稿（未配置 Supabase，不会进入审核库）。' };
  } catch {
    return { ok: false, mode: 'local', message: '本地保存失败（浏览器存储不可用）。' };
  }
}

/** 匿名反馈报告：写入 reports 表（无需登录） */
export async function submitReport(
  resourceId: string,
  reason: string,
  note?: string,
): Promise<{ ok: boolean; message?: string }> {
  if (!(hasSupabase && supabase)) {
    return { ok: false, message: '反馈功能需要配置 Supabase' };
  }
  try {
    const { error } = await supabase.from('reports').insert({
      resource_id: resourceId,
      reason: note ? `${reason} | ${note}` : reason,
      created_at: new Date().toISOString(),
    });
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: '感谢反馈！' };
  } catch {
    return { ok: false, message: '提交失败，请稍后再试。' };
  }
}

/** 当前数据模式（用于页脚提示「本地演示 / 已连接 Supabase」） */
export function dataSourceMode(): 'supabase' | 'local' {
  return hasSupabase && supabase ? 'supabase' : 'local';
}
