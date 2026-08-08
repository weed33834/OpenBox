// 数据访问层（Data Access Layer）
// 设计：
//   - 资源主数据始终来自本地种子 src/data/seed.ts（可靠、离线可渲染、无需先建库）。
//   - 当配置了 Supabase 时，额外合并「已审核通过的社区投稿」(submissions.status='approved')，
//     使 Supabase 成为一个可读写的投稿审核库，而无需把整个资源库搬到云端（避免空表导致首页空白）。
//   - 投稿提交（submitResource）在配置 Supabase 时写入云端审核库，否则落本地草稿。
// 上层页面只依赖本文件的异步接口，无需关心数据来自哪里 —— 单一入口、可替换、易测试。
import { supabase, hasSupabase } from './supabase';
import { subTypes, scenarios, resolveScenarios } from '@/data/taxonomy';
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
  // 场景过滤必须与首页场景树（buildScenarioTree 用 resolveScenarios）保持同一套判定：
  // 资源未显式声明 scenarios（如 curated.ts 中 scenarios:[]）时回退到子类型默认映射，
  // 否则这部分资源在场景页会全部丢失，造成首页计数与场景页内容严重不符。
  if (query.scenario) out = out.filter((r) => resolveScenarios(r).includes(query.scenario!));
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

/** 投稿数据校验（前端 + 数据层双重防线，防垃圾/畸形提交） */
function validateSubmission(p: Omit<Submission, 'id' | 'status' | 'createdAt'>): string | null {
  const name = p.name?.trim() ?? '';
  const url = p.url?.trim() ?? '';
  const summary = p.summary?.trim() ?? '';
  if (!name || name.length > 80) return '名称需 1–80 个字符';
  if (!/^https?:\/\/[^\s]+\.[^\s]{2,}$/i.test(url) || url.length > 500) return '请输入有效的 http(s) 链接';
  if (!summary || summary.length > 200) return '简介需 1–200 个字符';
  if (p.description && p.description.length > 1000) return '详细描述最多 1000 个字符';
  return null;
}

export async function submitResource(
  payload: Omit<Submission, 'id' | 'status' | 'createdAt'>,
): Promise<SubmitResult> {
  const err = validateSubmission(payload);
  if (err) return { ok: false, mode: 'local', message: err };
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

// ============================================================
// 社区验证投票（「还能不能薅」社区验证机制）
// - Supabase 可用：投票写入 verifications 表，统计来自云端（跨用户共享）。
// - 本地模式：投票记 localStorage，仅本设备可见（降级可用）。
// - 本设备投票记录始终存 localStorage，用于防重复 + 乐观计数。
// ============================================================
export interface VerificationStats {
  ok: number;
  dead: number;
  total: number;
  lastAt: string | null;
}

const VKEY = 'ob_verifications';

/** 读取本设备的投票记录（未投返回 null） */
function localVote(resourceId: string): { result: 'ok' | 'dead'; at: string; synced?: boolean } | null {
  try {
    const m = JSON.parse(localStorage.getItem(VKEY) ?? '{}') as Record<string, { result: 'ok' | 'dead'; at: string; synced?: boolean }>;
    return m[resourceId] ?? null;
  } catch {
    return null;
  }
}

/** 记录本设备投票；synced=true 表示该票已成功写入云端（统计时不再与云端重复计数） */
function saveLocalVote(resourceId: string, result: 'ok' | 'dead', synced = false) {
  try {
    const m = JSON.parse(localStorage.getItem(VKEY) ?? '{}') as Record<string, { result: 'ok' | 'dead'; at: string; synced?: boolean }>;
    m[resourceId] = { result, at: new Date().toISOString(), synced };
    localStorage.setItem(VKEY, JSON.stringify(m));
  } catch {
    /* localStorage 不可用时静默降级 */
  }
}

/** 提交一次验证投票：'ok'=还能用，'dead'=已失效 */
export async function submitVerification(
  resourceId: string,
  result: 'ok' | 'dead',
): Promise<{ ok: boolean; message?: string }> {
  // 先落本地（无论云端成败都保留本设备记录，用于防重复 + 未上云时的兜底统计）
  saveLocalVote(resourceId, result, false);
  if (hasSupabase && supabase) {
    try {
      const { error } = await supabase
        .from('verifications')
        .insert({ resource_id: resourceId, result, created_at: new Date().toISOString() });
      if (error) return { ok: false, message: error.message };
      // 云端写入成功：标记本地票已上云，统计时以云端为准，避免同票被计两次
      saveLocalVote(resourceId, result, true);
    } catch {
      /* 云端失败不阻塞：本地已记录（未上云），统计时作兜底计入 */
    }
  }
  return { ok: true };
}

/** 读取某资源的验证统计（总票数 / 可用票 / 失效票 / 最近验证时间） */
export async function getVerificationStats(resourceId: string): Promise<VerificationStats> {
  const local = localVote(resourceId);
  // 本地模式（未配置 Supabase）：本设备票并入统计
  if (!(hasSupabase && supabase)) {
    const base = { ok: 0, dead: 0, total: 0, lastAt: null as string | null };
    if (local) {
      if (local.result === 'ok') base.ok += 1;
      else base.dead += 1;
      base.lastAt = local.at;
    }
    return { ...base, total: base.ok + base.dead };
  }
  // Supabase 模式：以云端统计为准
  let ok = 0;
  let dead = 0;
  let lastAt: string | null = null;
  try {
    const { data, error } = await supabase
      .from('verifications')
      .select('result, created_at')
      .eq('resource_id', resourceId);
    if (!error && data) {
      for (const r of data as { result: string; created_at: string }[]) {
        if (r.result === 'ok') ok += 1;
        else if (r.result === 'dead') dead += 1;
        if (!lastAt || r.created_at > lastAt) lastAt = r.created_at;
      }
    }
  } catch {
    /* 云端读取失败：继续用下面的本地兜底 */
  }
  // 本设备「未成功上云」的票兜底计入（如云端 insert 失败但本地已记录），已上云的不重复计
  if (local && local.synced !== true) {
    if (local.result === 'ok') ok += 1;
    else dead += 1;
    if (!lastAt || local.at > lastAt) lastAt = local.at;
  }
  return { ok, dead, total: ok + dead, lastAt };
}

// ============================================================
// 资源留言（社区式：每个资源一个轻量评论区）
// - Supabase 可用：写入 comments 表（匿名可留、带昵称），跨用户共享。
// - 本地模式：存 localStorage（ob_comments_{id}），仅本设备可见（降级可用）。
// ============================================================
export interface CommentItem {
  id: string;
  resourceId: string;
  content: string;
  nickname: string;
  createdAt: string;
}

function localComments(resourceId: string): CommentItem[] {
  try {
    return JSON.parse(localStorage.getItem(`ob_comments_${resourceId}`) ?? '[]') as CommentItem[];
  } catch {
    return [];
  }
}

function saveLocalComment(resourceId: string, item: CommentItem) {
  try {
    const list = localComments(resourceId);
    list.unshift(item);
    localStorage.setItem(`ob_comments_${resourceId}`, JSON.stringify(list.slice(0, 100)));
  } catch {
    /* ignore */
  }
}

/** 读取某资源的留言列表（云端在前，本地兜底并集去重） */
export async function getComments(resourceId: string): Promise<CommentItem[]> {
  const local = localComments(resourceId);
  if (!(hasSupabase && supabase)) return local;
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('id, resource_id, content, nickname, created_at')
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error || !data) return local;
    const cloud = (data as { id: string; resource_id: string; content: string; nickname: string | null; created_at: string }[]).map(
      (r) => ({
        id: r.id,
        resourceId: r.resource_id,
        content: r.content,
        nickname: r.nickname ?? '匿名',
        createdAt: r.created_at,
      }),
    );
    const cloudIds = new Set(cloud.map((c) => c.id));
    return [...cloud, ...local.filter((l) => !cloudIds.has(l.id))];
  } catch {
    return local;
  }
}

/** 发表一条留言（昵称可选，默认匿名） */
export async function addComment(
  resourceId: string,
  content: string,
  nickname?: string,
): Promise<{ ok: boolean; message?: string }> {
  const nick = nickname?.trim() || '匿名';
  const item: CommentItem = {
    id: `local-${Date.now()}`,
    resourceId,
    content,
    nickname: nick,
    createdAt: new Date().toISOString(),
  };
  if (hasSupabase && supabase) {
    try {
      const { error } = await supabase
        .from('comments')
        .insert({ resource_id: resourceId, content, nickname: nick, created_at: item.createdAt });
      if (error) {
        saveLocalComment(resourceId, item);
        return { ok: false, message: error.message };
      }
      return { ok: true };
    } catch {
      saveLocalComment(resourceId, item);
      return { ok: true };
    }
  }
  saveLocalComment(resourceId, item);
  return { ok: true };
}
