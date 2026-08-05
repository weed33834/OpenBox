// 免费 API 排行榜评分体系（自设计）
// 评分公式：综合 8 个维度加权求和（满分 100）
//   免费额度 25 + 官方/社区 15 + 稳定性 20 + 易访问性 10
//   + 模型丰富度 15 + 签到机制 5 + 人气 10 + 社区验证 ±5
import type { Resource } from '@/lib/types';

export interface RankPart {
  label: string;
  score: number;
  max: number;
}

export interface RankScore {
  resource: Resource;
  total: number;
  parts: RankPart[];
  votes: { ok: number; dead: number };
}

/** 对一条 free-api 资源打分（votes 来自社区验证统计，可缺省） */
export function scoreFreeApi(
  r: Resource,
  votes?: { ok: number; dead: number },
): RankScore {
  const tags = (r.tags ?? []).join(' ');

  // ① 免费额度（25）：纯免费最高，试用其次
  const freeScore =
    r.type === 'free' ? 25 : r.type === 'freemium' ? 18 : r.type === 'trial' ? 10 : 4;

  // ② 官方/社区（15）：官方背书更可靠
  const officialScore = r.official ? 15 : 8;

  // ③ 稳定性（20）：以实跳验证状态为准
  const statusScore =
    r.status === 'ok' ? 20 : r.status === 'unstable' ? 10 : r.status === 'unknown' ? 6 : 0;

  // ④ 易访问性（10）：国内直连加分，纯海外减分
  const accessScore = /国产|国内直连|CN节点/.test(tags) ? 10 : /海外/.test(tags) ? 5 : 7;

  // ⑤ 模型丰富度（15）：支持模型越多越值
  const n = r.models?.length ?? 0;
  const modelScore = n >= 5 ? 15 : n >= 3 ? 12 : n >= 1 ? 8 : 5;

  // ⑥ 签到/免费额度机制（5）：有签到白嫖机制加分
  const checkinScore = /签到/.test(tags) ? 5 : 0;

  // ⑦ 人气（10）：编辑人气分归一化
  const popScore = Math.round(((r.popularity ?? 0) / 100) * 10);

  // ⑧ 社区验证（±5）：ok 票占比高加分、dead 多扣分
  let voteScore = 0;
  const v = votes ?? { ok: 0, dead: 0 };
  if (v.ok + v.dead > 0) {
    const ratio = v.ok / (v.ok + v.dead);
    voteScore = Math.round((ratio * 2 - 1) * 5);
  }

  const total = Math.max(0, Math.min(100, freeScore + officialScore + statusScore + accessScore + modelScore + checkinScore + popScore + voteScore));

  return {
    resource: r,
    total,
    parts: [
      { label: '免费额度', score: freeScore, max: 25 },
      { label: '官方/社区', score: officialScore, max: 15 },
      { label: '稳定性', score: statusScore, max: 20 },
      { label: '易访问性', score: accessScore, max: 10 },
      { label: '模型丰富度', score: modelScore, max: 15 },
      { label: '签到机制', score: checkinScore, max: 5 },
      { label: '人气', score: popScore, max: 10 },
      { label: '社区验证', score: voteScore, max: 5 },
    ],
    votes: v,
  };
}

/** 对一批 free-api 资源打分并降序排序（同分按验证票数） */
export async function rankFreeApis(
  resources: Resource[],
  statsFor: (id: string) => Promise<{ ok: number; dead: number }>,
): Promise<RankScore[]> {
  const scored = await Promise.all(
    resources.map(async (r) => scoreFreeApi(r, await statsFor(r.id))),
  );
  return scored.sort((a, b) => b.total - a.total || (b.votes.ok + b.votes.dead) - (a.votes.ok + a.votes.dead));
}
