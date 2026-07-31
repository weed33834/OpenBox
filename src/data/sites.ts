// 全网 AI 公益站与中转站数据
// 调研时间：2026-07，来源：GitHub / LinuxDo / V2EX / 80aj / CSDN / SegmentFault 等交叉比对

export type Category =
  | 'linuxdo'   // LinuxDo 社区公益站
  | 'freechat'  // 多模型聚合免费对话站
  | 'freerelay' // 免费 API 中转站
  | 'paidrelay' // 付费商业 API 中转站
  | 'overseas'  // 海外官方免费层
  | 'domestic'  // 国内大模型官方平台
  | 'tool'      // 开源框架 / 评测导航 / 聚合索引
  | 'blacklist'; // 已失效站点（黑名单）

export type SiteType = 'free' | 'paid' | 'freemium';
export type Status = 'ok' | 'unstable' | 'dead' | 'unknown';

/** 黑名单失效原因分类（结构化枚举，避免脆弱的字符串匹配） */
export type BlacklistReasonType =
  | 'domain-sale'     // 域名转卖 / 出售
  | 'http-error'      // HTTP 5xx 服务端异常
  | 'not-found'       // HTTP 404 页面不存在
  | 'repo-removed'    // GitHub 仓库已删除 / 404
  | 'service-stopped' // 站点被管理员停止运行
  | 'ssl-error'       // SSL 证书过期 / 错误
  | 'timeout'         // 连接超时
  | 'other';          // 其他原因

export interface Site {
  id: string;
  name: string;
  url: string;
  category: Category;
  type: SiteType;
  status: Status;
  models: string[];
  desc: string;
  /** 名字下方的简短介绍（一句话定位，比 desc 更短更聚焦）。未提供时 SiteCard 回退到 desc */
  tagline?: string;
  /** 特点标签：免费 / 签到 / 免费额度 / 国产 / 低延迟 / 海外 / Linux.do / 公益 等。未提供时 SiteCard 自动从 type/billing/register/note 推导 */
  features?: string[];
  apiBase?: string;
  billing?: string;
  register?: string;
  payment?: string;
  note?: string;
  /** 站点优势（详情页展示，帮助用户快速了解站点优点） */
  pros?: string[];
  /** 站点劣势（详情页展示，帮助用户了解潜在风险或不足） */
  cons?: string[];
  /** 使用建议（详情页展示，给用户的实用提示） */
  tips?: string;
  /** 黑名单失效原因详情（仅 category === 'blacklist' 时使用） */
  blacklistReason?: string;
  /** 黑名单失效原因分类枚举（与 blacklistReason 配合使用，用于可靠筛选与图标映射） */
  blacklistReasonType?: BlacklistReasonType;
}

// 模块级正则常量：避免每次调用 deriveFeatures 都重新编译正则（边际性能优化）
const RE_CHECKIN = /签到|每日签到|daily\s*check/i;
const RE_LINUXDO = /linux\.do|linuxdo/i;
const RE_WELFARE = /公益|public\s*welfare/i;
const RE_LOWLATENCY = /低延迟|国内直连|国内服务器|延迟低|低至\s*\d+\s*ms/i;

/**
 * 从站点现有字段自动推导特点标签（用于未显式声明 features 的旧数据）。
 * 顺序遵循用户最关心的痛点：免费/签到/免费额度/国产。
 */
export function deriveFeatures(site: Site): string[] {
  if (site.features && site.features.length > 0) return site.features;
  const tags: string[] = [];
  const hay = `${site.billing ?? ''} ${site.note ?? ''} ${site.register ?? ''} ${site.desc ?? ''}`;
  // 免费维度
  if (site.type === 'free') tags.push('免费');
  else if (site.type === 'freemium') tags.push('免费额度');
  else if (site.type === 'paid') tags.push('付费');
  // 签到
  if (RE_CHECKIN.test(hay)) tags.push('签到');
  // 国产 / 海外
  if (site.category === 'domestic') tags.push('国产');
  else if (site.category === 'overseas') tags.push('海外');
  // Linux.do 注册门槛
  if (RE_LINUXDO.test(hay)) tags.push('Linux.do');
  // 公益
  if (RE_WELFARE.test(hay)) tags.push('公益');
  // 低延迟（仅当 desc/note 明确提到）
  if (RE_LOWLATENCY.test(hay)) tags.push('低延迟');
  return tags;
}

export const CATEGORY_META: Record<Category, { label: string; color: string; desc: string }> = {
  linuxdo: { label: '社区公益站', color: '#00e5ff', desc: 'LinuxDo 等社区运营的免费公益 API 站' },
  freechat: { label: '免费对话站', color: '#ff2e88', desc: '无需 Key 即可直接对话的镜像/聚合站' },
  freerelay: { label: '免费中转站', color: '#7c5cff', desc: '提供免费额度的 API 转发站' },
  paidrelay: { label: '付费中转站', color: '#ffb020', desc: '低价转售 GPT/Claude 等的商业 API 中转' },
  overseas: { label: '海外官方免费层', color: '#34d399', desc: 'OpenRouter/Groq/Gemini 等官方免费层' },
  domestic: { label: '国内官方平台', color: '#60a5fa', desc: '国产大模型官方 API 平台' },
  tool: { label: '框架与导航', color: '#94a3b8', desc: '开源中转框架、评测榜与导航索引' },
  blacklist: { label: '黑名单', color: '#ef4444', desc: '已确认失效的站点（域名转卖/SSL 过期/服务关停）' },
};

export const STATUS_META: Record<Status, { label: string; color: string }> = {
  ok: { label: '可用', color: '#34d399' },
  unstable: { label: '不稳定', color: '#ffb020' },
  unknown: { label: '未验证', color: '#94a3b8' },
  dead: { label: '已失效', color: '#ef4444' },
};

export const TYPE_META: Record<SiteType, { label: string; color: string }> = {
  free: { label: '免费', color: '#34d399' },
  freemium: { label: '免费增值', color: '#00e5ff' },
  paid: { label: '付费', color: '#ffb020' },
};

export const sites: Site[] = [
  // ===== 社区公益站 (linuxdo) =====
  { id: 'gscc-relay', name: 'GSCC Relay', url: 'https://gsccrelay.space', category: 'blacklist', type: 'free', status: 'dead', models: ['Claude全系'], desc: '原公益站，域名已转卖为营销页', apiBase: 'https://gsccrelay.space', register: '公告发放 sk-key', blacklistReason: '域名转卖 → 跳转至"极省创"营销页', blacklistReasonType: 'domain-sale' },
  { id: 'wzw', name: 'WZW', url: 'https://wzw.de5.net', category: 'linuxdo', type: 'free', status: 'unstable', models: ['Claude', 'GPT', 'DeepSeek'], desc: '基于 NewAPI 搭建，多模型聚合，稳定可靠', tagline: '基于 NewAPI 多模型聚合公益站', features: ['免费', '公益', 'Linux.do', '多模型'], apiBase: 'https://wzw.de5.net', register: 'Linux.do OAuth', note: '备用 wzw.pp.ua', pros: ['LinuxDo社区公益站', '多模型聚合', '稳定可靠'], cons: ['需Linux.do账号', '公益性质无SLA保证'], tips: '基于NewAPI搭建，支持OpenAI兼容格式' },
  { id: 'anyrouter', name: 'AnyRouter', url: 'https://anyrouter.top', category: 'freerelay', type: 'freemium', status: 'ok', models: ['claude-sonnet-4', 'opus-4'], desc: '纯公益站，专注 Claude Code 中转，注册送 $50', tagline: '注册送 $50，每日签到 +$25', features: ['免费额度', '签到', '公益'], apiBase: 'https://anyrouter.top', billing: '注册送$50，邀请$100，每日签到$25', register: '教育邮箱或 Linux.do 账号', pros: ['注册送$50额度', '每日签到$25', '专注Claude Code中转'], cons: ['额度有限', '需教育邮箱或Linux.do账号'], tips: '配合Claude Code使用体验最佳' },
  { id: 'duckcoding-free', name: 'DuckCoding Free', url: 'https://free.duckcoding.com', category: 'linuxdo', type: 'freemium', status: 'ok', models: ['Claude Code', 'GPT'], desc: '原 InstCopilot API，公益分组特定时段 0.2 倍率，文档完善', tagline: '公益分组特定时段 0.2 倍率，文档完善', features: ['免费额度', '公益', 'Linux.do'], apiBase: 'https://free.duckcoding.com', register: 'Linux.do 账号', pros: ['公益分组0.2倍率', '文档完善', '稳定运营'], cons: ['需Linux.do账号', '特定时段才有优惠'], tips: '关注公益分组时段，错峰使用更划算' },
  { id: 'cups-moe', name: 'Cups.moe 公益站', url: 'https://free-llm.cups.moe', category: 'freerelay', type: 'free', status: 'ok', models: ['Claude', 'GPT', 'Gemini'], desc: '永久域名公益站，多模型免费 API，社区维护', tagline: '永久域名公益站，多模型免费 API', features: ['免费', '公益', '多模型'], apiBase: 'https://free-llm.cups.moe' },
  { id: 'youjian', name: '有间公益中转站', url: 'https://linux.do/t/topic/1399113', category: 'linuxdo', type: 'free', status: 'unstable', models: ['Claude'], desc: '基于 AWS 逆向，每日签到 + Linux.do 积分兑换 5:1，2026-01 回归开放注册', tagline: 'AWS 逆向，每日签到 + 积分兑换', features: ['免费', '签到', '公益', 'Linux.do'], register: 'Linux.do 1 级+', note: '严禁 NSFW' },
  { id: 'rawchat-codex', name: 'RawChat Codex 公益站', url: 'https://new.sharedchat.cc/', category: 'linuxdo', type: 'free', status: 'ok', models: ['Codex', 'GPT'], desc: '每日 100 美元额度，无需登录', tagline: '每日 100 美元额度，无需登录', features: ['免费', '公益', '无需注册'], note: '主站 chatgptplus.cn' },
  { id: 'rawchat', name: 'RawChat 主站', url: 'https://chatgptplus.cn', category: 'linuxdo', type: 'free', status: 'ok', models: ['GPT-4o', 'Plus全套'], desc: '列出多个共享 Plus 账号，色块标忙闲，共享排队', tagline: '共享 Plus 账号，色块标忙闲', features: ['免费', '公益', '无需注册'] },
  { id: 'cngpt', name: 'CnGPT', url: 'https://cngpt.net', category: 'linuxdo', type: 'freemium', status: 'unstable', models: ['GPT-5.3', 'GPT-5.4'], desc: '每日签到领额度，V2EX 推广含 50 个兑换码', tagline: '每日签到领额度，V2EX 推广兑换码', features: ['免费额度', '签到', '国产'], register: 'GitHub 登录' },
  { id: 'chy', name: 'CHY 公益站', url: 'https://linux.do/t/topic/2314833', category: 'linuxdo', type: 'free', status: 'unknown', models: ['Claude Opus 4.8'], desc: '2026-06 上线 Claude Opus 4.8 新模型，性能优化版', tagline: '2026-06 上线 Claude Opus 4.8', features: ['免费', '公益', 'Linux.do'], register: 'Linux.do' },
  { id: 'flapcode', name: 'Flapcode', url: 'https://flapcode.com', category: 'linuxdo', type: 'freemium', status: 'ok', models: ['Claude Code', 'Codex'], desc: '个人搭建 Claude Code/Codex 中转，开源透明，数据零存储，国内顺手', tagline: '开源 Claude Code/Codex 中转，数据零存储', features: ['免费额度', '国产', '开源', '低延迟'], apiBase: 'https://flapcode.com', register: '邮箱', note: '开源项目 github.com/adryfish/reclaude-code' },
  { id: 'agentrouter', name: 'AgentRouter', url: 'https://agentrouter.org', category: 'linuxdo', type: 'freemium', status: 'ok', models: ['Claude Opus/Sonnet', 'GPT-5', 'Gemini', 'Qwen'], desc: '面向开发者的公益 AI 编程平台，邀请注册送 $100-200，支持 Claude Code/Codex/Gemini CLI/Roo Code/Qwen Code', tagline: '注册送 $200，支持多 Agent 工具', features: ['免费额度', '公益', '多模型'], apiBase: 'https://agentrouter.org', register: 'GitHub 或 Linux.do', note: 'GitHub 老号奖励更高' },
  { id: 'hajimi', name: '哈基米 API', url: 'https://api.gemai.cc', category: 'linuxdo', type: 'freemium', status: 'ok', models: ['Claude全系', 'GPT', 'Gemini'], desc: '邮箱注册送 400 元额度，每日签到送 50 元，按 token 计费，无需 Linux.do', tagline: '邮箱注册送 400，每日签到 +50', features: ['免费额度', '签到', '国产', '邮箱注册'], apiBase: 'https://api.gemai.cc', register: '邮箱', note: '充值也便宜' },
  { id: 'fulitimes', name: '富利Times', url: 'https://linux.do/t/topic/2416081', category: 'linuxdo', type: 'free', status: 'unstable', models: ['Claude Code', 'Codex'], desc: '【富可敌国】【Flapcode】联动公益站，每 10 分钟更新额度，Linux.do 账号登录', tagline: '每 10 分钟更新额度，社区联动', features: ['免费', '公益', 'Linux.do'], register: 'Linux.do', note: '与 Flapcode 关联' },
  { id: 'wenwen-ai', name: '文文 AI', url: 'https://code.wenwen-ai.com', category: 'linuxdo', type: 'free', status: 'unstable', models: ['Claude Code'], desc: 'Claude Code 中转，提供 code/breakout 两个端点，npx zcf 可视化配置', tagline: 'Claude Code 中转，npx zcf 配置', features: ['免费', '公益'], apiBase: 'https://code.wenwen-ai.com', note: '备用 breakout.wenwen-ai.com' },
  { id: 'suyu', name: '速语 AI', url: 'https://free.suyu.io', category: 'linuxdo', type: 'free', status: 'unstable', models: ['GPT-4o', 'Gemini', 'DeepSeek'], desc: 'GitHub Star 后获取密钥，GPT-4o 30 次/日，Gemini/DeepSeek 100 次/日', tagline: 'GitHub Star 换 Key，多模型每日免费', features: ['免费', '公益', 'GitHub'], register: 'GitHub Star', note: '镜像 free.suyu.io' },
  { id: 'iamhc', name: '幻城网安公益站', url: 'https://iamhc.cn', category: 'linuxdo', type: 'free', status: 'unstable', models: ['195+ 模型', 'Qwen', 'GPT', 'Claude', 'DeepSeek', 'Llama', 'GLM', 'Kimi'], desc: '新疆幻城网安科技搭建的公益 API 中转站，基于 NewAPI，支持 195+ 主流大模型，统一账号（用户名/密码均为 1）无限额度', tagline: '195+ 模型无限额度，统一账号免登录', features: ['免费', '公益', '国产', '多模型'], apiBase: 'https://api.iamhc.cn/v1', register: '统一账号 1/1', note: '新疆幻城网安科技，主站 iamhc.cn，API 在 api.iamhc.cn' },

  // ===== 免费对话站 (freechat) 前半 =====
  { id: 'heck', name: 'heck.ai', url: 'https://heck.ai', category: 'freechat', type: 'free', status: 'unstable', models: ['Claude3.7', 'GPT4.5', 'GPT-4o', 'DeepSeek V3'], desc: '完全免费无登录，联网问答+图片+深度思考，GPT-4o 不限量' },
  { id: 'freegpt-es', name: 'freegpt.es', url: 'https://freegpt.es', category: 'freechat', type: 'free', status: 'unstable', models: ['gpt-4o', 'o3-mini', 'Claude', 'Gemini', 'Grok', 'DeepSeek'], desc: '免费画图+文件上传，多模型可选' },
  { id: 'aiyunos', name: '爱云网', url: 'https://chat5.aiyunos.top', category: 'freechat', type: 'free', status: 'ok', models: ['GPT-4'], desc: '仓库赞助商，WAF 防护页可达，多模型' },
  { id: 'wendabao', name: 'ai.wendabao.net', url: 'https://ai.wendabao.net', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: '仓库赞助商站点' },
  { id: 'fuckicoding', name: 'link.fuckicoding.com', url: 'https://link.fuckicoding.com', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: 'GPT-4 + 多模型免费对话' },
  { id: 'myai', name: 'myai.asia', url: 'https://myai.asia/', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: 'GPT-4 + 多模型免费对话' },
  { id: 'chatgptgratis', name: 'chatgptgratis.eu', url: 'https://chatgptgratis.eu/', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: '免费 GPT-4 对话' },
  { id: 'easychat', name: 'easychat.fun', url: 'https://easychat.fun/', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: '免费 GPT-4 对话' },
  { id: 'netfly', name: 'free.netfly.top', url: 'https://free.netfly.top/', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: '免费 GPT-4 对话' },
  { id: 'claude-free2gpt', name: 'claude.free2gpt.xyz', url: 'https://claude.free2gpt.xyz', category: 'freechat', type: 'free', status: 'unknown', models: ['Claude 3.5 Sonnet'], desc: 'Claude 镜像站，120 次/天' },
  { id: 'eqing', name: 'origin.eqing.tech', url: 'https://origin.eqing.tech/', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: '免费 GPT-4 对话' },
  { id: 'yeschat', name: 'yeschat.ai', url: 'https://www.yeschat.ai/zh-CN/gpt-4o', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4o'], desc: '免费 GPT-4o 对话' },
  { id: 'aitopk', name: 'aitopk.com', url: 'https://aitopk.com/', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: '免费 GPT-4 对话' },
  { id: 'sharedchat-cn', name: 'sharedchat.cn', url: 'https://sharedchat.cn/shared.html', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: '免费 GPT-4 对话' },
  { id: 'kelaode', name: 'kelaode.ai', url: 'https://kelaode.ai/', category: 'overseas', type: 'free', status: 'ok', models: ['Claude Pro'], desc: 'Claude 镜像站，含 Pro 账号，需海外网络', note: '国内直连超时（15s），海外可用' },
  { id: 'ai365vip', name: 'chat.ai365vip.com', url: 'https://chat.ai365vip.com/', category: 'freechat', type: 'free', status: 'unknown', models: ['多模型'], desc: '多模型免费对话' },
  { id: 'zxf7460', name: 'zxf7460.cn', url: 'https://www.zxf7460.cn/', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: 'GPT-4 + 多模型，有速率限制' },
  { id: 'ichat2019', name: 'ichat2019.com', url: 'https://www.ichat2019.com/', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: 'GPT-4 + 多模型，有速率限制' },
  { id: 'nmwaicg', name: 'nmwaicg.top', url: 'http://nmwaicg.top/', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: 'GPT-4 + 多模型，有速率限制' },
  { id: 'lemonchat', name: 'chat.lemonchat.xyz', url: 'https://chat.lemonchat.xyz', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT，2024-12 新增' },
  { id: '44ai', name: '44ai.cc', url: 'https://44ai.cc/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT，2024-11 新增' },
  { id: 'grok-free2gpt', name: 'grok.free2gpt.com', url: 'https://grok.free2gpt.com', category: 'freechat', type: 'free', status: 'unknown', models: ['Grok-beta'], desc: '免费 Grok-beta 对话' },
  { id: '44vl', name: 'gy.44vl.cc', url: 'https://gy.44vl.cc/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'opkfc', name: 'opkfc.com', url: 'https://www.opkfc.com/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'chatgpt4online', name: 'chatgpt4online.org', url: 'https://chatgpt4online.org/chatgpt-free-online/#chat', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费在线 ChatGPT' },
  { id: '51supergpt', name: '51supergpt.com', url: 'https://www.51supergpt.com/', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-3.5'], desc: '免费 GPT-3.5，授权码 51supergpt.com' },
  { id: 'tudouai', name: 'tudouai.chat', url: 'https://tudouai.chat/chat', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'mynanian', name: 'chat.mynanian.top', url: 'https://chat.mynanian.top/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'icoding', name: 'free.icoding.ink', url: 'https://free.icoding.ink/index2.html', category: 'blacklist', type: 'free', status: 'dead', models: ['ChatGPT'], desc: '免费 ChatGPT 对话', blacklistReason: 'HTTP 502 服务端异常', blacklistReasonType: 'http-error' },
  { id: 'programapps', name: 'chat.programapps.top', url: 'https://chat.programapps.top/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: '1-ai', name: 'chat.1-ai.sbs', url: 'https://chat.1-ai.sbs/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'ichuang', name: 'ichuang.top', url: 'https://ichuang.top', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'daladada', name: 'ai.daladada.xyz', url: 'https://ai.daladada.xyz/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'gptchatai', name: 'chat.gptchatai.life', url: 'https://chat.gptchatai.life/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'promptboom', name: 'PromptBoom', url: 'https://promptboom.com/PowerChat/PowerChatTalk', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'bixin', name: '1.bixin123.com', url: 'https://1.bixin123.com', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'leapgpt', name: 'chat.leapgpt.top', url: 'https://chat.leapgpt.top/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT，登录码 leap@gpt+' },
  { id: 'aiearth', name: 'chat.aiearth.dev', url: 'https://chat.aiearth.dev/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT，密码 freegpt3' },
  { id: 'academic-aiearth', name: 'academic.aiearth.dev', url: 'https://academic.aiearth.dev/', category: 'blacklist', type: 'free', status: 'dead', models: ['ChatGPT'], desc: '免费 ChatGPT 对话', blacklistReason: 'HTTP 530 站点异常', blacklistReasonType: 'http-error' },
  { id: 'skybyte', name: 'cgs.skybyte.me', url: 'https://cgs.skybyte.me/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'aibn', name: 'aibn.cc', url: 'https://aibn.cc/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'chatgptduo', name: 'chatgptduo.com', url: 'https://chatgptduo.com/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'chatp-free2gpt', name: 'chatp.free2gpt.xyz', url: 'https://chatp.free2gpt.xyz/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'gptgo', name: 'gptgo.ai', url: 'https://gptgo.ai/', category: 'overseas', type: 'free', status: 'ok', models: ['GPT-4'], desc: '越南团队运营，多语言免费 GPT，需海外网络', note: '国内直连 HTTP 403 地区限制' },
  { id: 'powerchat', name: 'PowerChat', url: 'https://powerchat.in/', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: '免费 GPT-4，无需登录' },
  { id: 'aifree', name: 'ai.free.ltd', url: 'https://ai.free.ltd/', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: '免费 GPT-4 对话' },
  { id: 'chatfree', name: 'chatfree.cc', url: 'https://chatfree.cc/', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: '免费 ChatGPT 对话' },
  { id: 'chatz-free2gpt', name: 'chatz.free2gpt.com', url: 'https://chatz.free2gpt.com', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'newstop', name: 'newstop.cn', url: 'https://newstop.cn/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'azstudio', name: 'chat.azstudio.top', url: 'https://chat.azstudio.top/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'zenglingkun', name: 'chat.zenglingkun.com', url: 'https://chat.zenglingkun.com/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'kiask', name: 'kiask.me', url: 'https://kiask.me/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'acytoo', name: 'chat.acytoo.com', url: 'https://chat.acytoo.com', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: '免费 GPT-4 对话' },
  { id: 'plitun', name: 'chat.plitun.com', url: 'https://chat.plitun.com/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'c1ns', name: 'chat.c1ns.cn', url: 'https://chat.c1ns.cn/', category: 'blacklist', type: 'free', status: 'dead', models: ['ChatGPT'], desc: '免费 ChatGPT 对话', blacklistReason: 'HTTP 404 页面不存在', blacklistReasonType: 'not-found' },
  { id: 'newstop-c1ns', name: 'newstop.c1ns.cn', url: 'https://newstop.c1ns.cn/', category: 'blacklist', type: 'free', status: 'dead', models: ['ChatGPT'], desc: '免费 ChatGPT 对话', blacklistReason: 'HTTP 404 页面不存在', blacklistReasonType: 'not-found' },
  { id: 'hteyun', name: 'chat.hteyun.com', url: 'https://chat.hteyun.com/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'weuseing', name: 'chat.weuseing.com', url: 'https://chat.weuseing.com', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: '免费 GPT-4 对话' },
  { id: 'zyq', name: 'chat.zyq.win', url: 'https://chat.zyq.win/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'aisoftworks', name: 'chat.aisoftworks.com', url: 'https://chat.aisoftworks.com/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'gptdidi', name: 'chat.gptdidi.com', url: 'https://chat.gptdidi.com/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'darkflow', name: 'chat.darkflow.net', url: 'https://chat.darkflow.net', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: '免费 GPT-4 对话' },
  { id: 'flares', name: 'chat.flares.ai', url: 'https://chat.flares.ai', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: '免费 GPT-4 对话' },
  { id: 'devgpt', name: 'chat.devgpt.cc', url: 'https://chat.devgpt.cc/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'newstop-asia', name: 'newstop.asia', url: 'https://newstop.asia/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'nb8', name: 'chat.nb8.ai', url: 'https://chat.nb8.ai/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'lovebaby', name: 'chat.lovebaby168.com', url: 'https://chat.lovebaby168.com/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'magicaibot', name: 'chat.magicaibot.com', url: 'https://chat.magicaibot.com/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: '521-zeabur', name: 'chat.521.chat', url: 'https://chat.521.chat', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: 'Zeabur 部署，免费 GPT-4 对话' },
  { id: 'kunshanyuxin', name: 'chat.kunshanyuxin.com', url: 'https://chat.kunshanyuxin.com', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: '免费 GPT-4 对话' },
  { id: 'jubianxingqiu', name: 'chat.jubianxingqiu.com', url: 'https://chat.jubianxingqiu.com/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'aiask', name: 'chat.aiask.com', url: 'https://chat.aiask.com', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: '免费 GPT-4 对话' },
  { id: 'gptforlove', name: 'chat.gptforlove.com', url: 'https://chat.gptforlove.com', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: '免费 GPT-4 对话' },
  { id: 'betai55', name: 'chat.betai55.com', url: 'https://chat.betai55.com/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'pinkfong', name: 'chat.pinkfong.cc', url: 'https://chat.pinkfong.cc', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: '免费 GPT-4 对话' },
  { id: 'heptax', name: 'chat.heptax.cn', url: 'https://chat.heptax.cn', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: '免费 GPT-4 对话' },
  { id: 'bnu120', name: 'chat.bnu120.com', url: 'https://chat.bnu120.com', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: '免费 GPT-4 对话' },
  { id: 'xjai', name: 'chat.xjai.top', url: 'https://chat.xjai.top', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: '免费 GPT-4 对话' },
  { id: 'nav4ai', name: 'chat.nav4ai.com', url: 'https://chat.nav4ai.com', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: '免费 GPT-4 对话' },
  { id: 'extkj', name: 'chat.extkj.com', url: 'https://chat.extkj.com', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: '免费 GPT-4 对话' },
  { id: 'xeasy', name: 'chat.xeasy.top', url: 'https://chat.xeasy.top', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: '免费 GPT-4 对话' },
  { id: 'yqcloud', name: 'chat.yqcloud.top', url: 'https://chat.yqcloud.top/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'chatgptfree', name: 'chatgptfree.net', url: 'https://chatgptfree.net/', category: 'freechat', type: 'free', status: 'unknown', models: ['ChatGPT'], desc: '免费 ChatGPT 对话' },
  { id: 'chatcat', name: 'chatcat.cc', url: 'https://chatcat.cc', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: '免费 GPT-4 对话' },
  { id: 'ails', name: 'chat.ails.ac.cn', url: 'https://chat.ails.ac.cn', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: '免费 GPT-4 对话' },
  { id: 'geekr', name: 'chat.geekr.dev', url: 'https://chat.geekr.dev', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: '免费 GPT-4 对话' },
  { id: 'ailink', name: 'chat.ailink.icu', url: 'https://chat.ailink.icu', category: 'freechat', type: 'free', status: 'unknown', models: ['GPT-4'], desc: '免费 GPT-4 对话' },

  // ===== 免费 API 中转站 (freerelay) =====
  { id: 'chatanywhere', name: 'ChatAnywhere', url: 'https://chatanywhere.com', category: 'freerelay', type: 'freemium', status: 'ok', models: ['GPT全系', 'Claude', 'DeepSeek'], desc: '老牌免费 API 中转，公益组免费 $0，GPT-4 高级组需邀请', tagline: '老牌公益组免费，GPT-4 高级组需邀请', features: ['免费额度', '国产', '公益'], apiBase: 'https://api.chatanywhere.tech/v1', billing: '公益组免费，高级组需邀请', register: 'GitHub 申请', note: '国内首选' },
  { id: 'popjane', name: 'PopJane', url: 'https://api.popjane.com', category: 'freerelay', type: 'freemium', status: 'ok', models: ['Claude', 'GPT'], desc: '免费 OpenAI/Claude 代理，按需返利', tagline: '免费 OpenAI/Claude 代理，按需返利', features: ['免费额度', '海外'], apiBase: 'https://api.popjane.com/v1', register: '注册获取 Key' },
  { id: 'gpt4free', name: 'gpt4free', url: 'https://github.com/xtekky/gpt4free', category: 'freerelay', type: 'free', status: 'unstable', models: ['GPT全系', 'Claude', 'Gemini', 'DeepSeek'], desc: '开源反向聚合库，免费白嫖多家中转与官方逆向', tagline: '开源反向聚合库，免费白嫖多家', features: ['免费', '开源', '多模型'], apiBase: '需自建', note: 'Python 库，需自行部署' },
  { id: 'llm-redteam', name: 'LLM Red Team', url: 'https://github.com/LLM-Red-Team', category: 'freerelay', type: 'free', status: 'unstable', models: ['kimi', 'qwen', 'glm', 'step', 'meta'], desc: '逆向国产大模型的开源项目集合，支持 Kimi/Qwen/GLM/Step/Meta', tagline: '逆向国产大模型开源项目集合', features: ['免费', '开源', '国产', '多模型'], apiBase: '需自建', note: '组织维护多逆向项目' },
  { id: 'freellmapi', name: 'FreeLLMApi', url: 'https://www.freellmapi.com', category: 'freerelay', type: 'free', status: 'unstable', models: ['GPT', 'Claude'], desc: '提供免费 OpenAI 兼容端点，额度较低', tagline: '免费 OpenAI 兼容端点，额度较低', features: ['免费', '海外'], apiBase: 'https://api.freellmapi.com/v1' },
  { id: 'femtocloud', name: 'FemtoCloud', url: 'https://femto.byethost.com', category: 'freerelay', type: 'free', status: 'unstable', models: ['Claude', 'GPT'], desc: '免费 OpenAI 兼容接口，限额较大', tagline: '免费 OpenAI 兼容接口，限额较大', features: ['免费', '海外'], apiBase: 'https://femto-pioneer.appspot.com/v1' },
  { id: 'autocode', name: 'AutoCode Free', url: 'https://free.autocode.com', category: 'freerelay', type: 'freemium', status: 'unstable', models: ['Claude Code', 'GPT'], desc: '面向 Claude Code 的免费中转，每日签到获取额度', tagline: 'Claude Code 免费中转，每日签到获取额度', features: ['免费额度', '签到', '公益'], apiBase: 'https://free.autocode.com' },
  { id: 'orbitai', name: 'OrbitAI', url: 'https://orbitai.fun', category: 'freerelay', type: 'freemium', status: 'unstable', models: ['Claude Code', 'GPT'], desc: '面向 Claude Code 的公益中转，邀请制', tagline: 'Claude Code 公益中转，邀请制', features: ['免费额度', '公益'], apiBase: 'https://orbitai.fun' },

  // ===== 付费商业中转站 (paidrelay) =====
  { id: 'closeai', name: 'CloseAI', url: 'https://closeai.us', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT全系', 'Claude', 'Gemini'], desc: '最早的中转站之一，价格透明，OpenAI 官方 1:1 比例计费', tagline: '最早中转站之一，官方 1:1 比例计费', features: ['付费', '多模型'], apiBase: 'https://api.closeai-proxy.xyz/v1', billing: '官方 1:1，部分模型加价' },
  { id: 'api2d', name: 'API2D', url: 'https://api2d.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT全系', 'Claude', 'Gemini'], desc: '国内最早支持 RMB 支付的中转，OpenAI 与 Anthropic 双端点', tagline: '国内最早支持 RMB 支付，双端点', features: ['付费', '国产', '多模型'], apiBase: 'https://oa.api2d.net/v1', billing: '1 USD = 6 CNY，可叠加付费' },
  { id: 'aihubmix', name: 'AIHubMix', url: 'https://aihubmix.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude', 'Gemini', 'Grok', 'DeepSeek'], desc: '聚合 60+ 模型，OpenAI/Anthropic/Sunoh 等多协议，文档完善', tagline: '聚合 60+ 模型，多协议文档完善', features: ['付费', '多模型'], apiBase: 'https://aihubmix.com/v1', billing: '官方价 ×0.9~1.1' },
  { id: 'ohmygpt', name: 'OhMyGPT', url: 'https://www.ohmygpt.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude', 'Gemini', 'Midjourney'], desc: '运营时间长，支持微信/支付宝，含图像模型', tagline: '运营时间长，支持微信/支付宝', features: ['付费', '国产', '多模型'], apiBase: 'https://api.ohmygpt.com/v1', billing: '官方 1:1.05~1.3' },
  { id: 'openai-sb', name: 'openai-sb', url: 'https://openai-sb.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '老牌低价中转，约官方 0.8 倍', apiBase: 'https://api.openai-sb.com/v1', billing: '官方 0.8 倍' },
  { id: 'openaimax', name: 'OpenAIMax', url: 'https://openaimax.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '转发 GPT/Claude/Gemini，多渠道负载均衡', apiBase: 'https://api.openaimax.com/v1' },
  { id: 'api2gpt', name: 'API2GPT', url: 'https://api2gpt.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: 'NewAPI 搭建，多模型聚合，支持套餐', apiBase: 'https://api.api2gpt.com/v1' },
  { id: 'aigc2d', name: 'AIGC2D', url: 'https://aigc2d.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude', 'Stable Diffusion'], desc: 'OpenAI + Anthropic + 图像模型聚合', apiBase: 'https://api.aigc2d.com/v1' },
  { id: 'aiproxy', name: 'AIProxy', url: 'https://aiproxy.io', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '稳定 OpenAI/Claude 中转，可托管 Key', apiBase: 'https://api.aiproxy.io/v1' },
  { id: 'caipacity', name: 'Caipacity', url: 'https://capacity.com', category: 'overseas', type: 'paid', status: 'ok', models: ['Claude', 'GPT'], desc: '面向 Claude Code 的低价中转，OpenRouter 风格', apiBase: 'https://api.capacity.com/v1', note: '国内直连 HTTP 403，需海外网络' },
  { id: 'openai-hk', name: 'OpenAI-HK', url: 'https://openai-hk.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '香港节点 OpenAI 中转，速度快', apiBase: 'https://api.openai-hk.com/v1' },
  { id: 'dmxapi', name: 'DMXAPI', url: 'https://www.dmxapi.cn', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude', 'Gemini', 'DeepSeek', 'Midjourney'], desc: '聚合 100+ 模型，含图像视频模型，文档详细', tagline: '聚合 100+ 模型，含图像视频', features: ['付费', '国产', '多模型'], apiBase: 'https://www.dmxapi.cn/v1' },
  { id: '302ai', name: '302.AI', url: 'https://302.ai', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude', 'Gemini', 'Suno', 'Runway'], desc: '聚合多家中转与官方，分类清晰，含多模态', tagline: '聚合多家中转与官方，分类清晰', features: ['付费', '多模型'], apiBase: 'https://api.302.ai/v1' },
  { id: 'nonelinear', name: 'NonLinear', url: 'https://nonelinear.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['Claude Code', 'GPT'], desc: 'Claude Code 专用低价中转', apiBase: 'https://api.nonelinear.com/v1' },
  { id: '4sapi', name: '4SAPI', url: 'https://4sapi.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '稳定中转，支持套餐', apiBase: 'https://api.4sapi.com/v1' },
  { id: 'zmzai', name: 'ZmzAI', url: 'https://zmzai.com', category: 'blacklist', type: 'paid', status: 'dead', models: ['GPT', 'Claude', 'Gemini'], desc: '面向国内用户，支持支付宝', apiBase: 'https://api.zmzai.com/v1', blacklistReason: '域名出售中（ZMZai.com for sale）', blacklistReasonType: 'domain-sale' },
  { id: 'wts', name: 'WTS', url: 'https://wts.ai', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '低价 GPT/Claude 中转', apiBase: 'https://api.wts.ai/v1' },
  { id: 'aigcbar', name: 'AIGCBAR', url: 'https://aigcbar.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude', 'Gemini', 'DeepSeek'], desc: '聚合多模型，支持套餐与按量', apiBase: 'https://api.aigcbar.com/v1' },
  { id: 'ofox', name: 'Ofox', url: 'https://ofox.cc', category: 'paidrelay', type: 'paid', status: 'ok', models: ['Claude', 'GPT'], desc: '低价中转，支持 Claude Code', apiBase: 'https://api.ofox.cc/v1' },
  { id: 'apiyi', name: 'API易', url: 'https://apiyi.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude', 'Gemini'], desc: '国内知名中转，文档完善', apiBase: 'https://api.apiyi.com/v1' },
  { id: 'bltcy', name: 'BLTCY', url: 'https://bltcy.cc', category: 'paidrelay', type: 'paid', status: 'ok', models: ['Claude', 'GPT'], desc: 'Claude Code 专用中转，低价稳定', apiBase: 'https://api.bltcy.cc/v1' },
  { id: 'chatfire', name: 'ChatFire', url: 'https://chatfire.net', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '稳定中转，支持多协议', apiBase: 'https://api.chatfire.net/v1' },
  { id: 'nekoapi', name: 'NekoAPI', url: 'https://nekoapi.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '低价中转，社区活跃', apiBase: 'https://api.nekoapi.com/v1' },
  { id: 'yuegle', name: 'Yuegle', url: 'https://yuegle.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['Claude', 'GPT'], desc: 'Claude 低价中转，按 token 计费', apiBase: 'https://api.yuegle.com/v1' },
  { id: 'kfcv50', name: 'KFC V50', url: 'https://kfcv50.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '趣味命名的稳定中转', apiBase: 'https://api.kfcv50.com/v1' },
  { id: 'gptgod', name: 'GPTGod', url: 'https://gptgod.tw', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude', 'Gemini'], desc: '台湾节点，海外加速稳定', apiBase: 'https://api.gptgod.tw/v1' },
  { id: 'yibuapi', name: '一步 API', url: 'https://yibuapi.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '聚合中转，多渠道', apiBase: 'https://api.yibuapi.com/v1' },
  { id: 'lingyaai', name: '凌鸦 AI', url: 'https://lingyaai.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude', 'Gemini'], desc: '低价中转，含图像模型', apiBase: 'https://api.lingyaai.com/v1' },
  { id: 'paintbot', name: 'PaintBot', url: 'https://paintbot.cn', category: 'paidrelay', type: 'paid', status: 'ok', models: ['Claude', 'GPT'], desc: 'Claude Code 中转，低价', apiBase: 'https://api.paintbot.cn/v1' },
  { id: 'gptge', name: 'GPTGe', url: 'https://gptge.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '稳定中转，支持套餐', apiBase: 'https://api.gptge.com/v1' },
  { id: 'apimart', name: 'APIMart', url: 'https://apimart.net', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '中转聚合，多渠道', apiBase: 'https://api.apimart.net/v1' },
  { id: 'baicaigpt', name: '白菜 GPT', url: 'https://baicaigpt.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '白菜价中转，主打性价比', apiBase: 'https://api.baicaigpt.com/v1' },
  { id: 'ephone', name: 'Ephone', url: 'https://ephone.dev', category: 'paidrelay', type: 'paid', status: 'ok', models: ['Claude', 'GPT'], desc: 'Claude Code 中转，低价稳定', apiBase: 'https://api.ephone.dev/v1' },
  { id: 'duckllm', name: 'DuckLLM', url: 'https://duckllm.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '稳定中转，支持套餐', apiBase: 'https://api.duckllm.com/v1' },
  { id: 'apipool', name: 'APIPool', url: 'https://apipool.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '多渠道中转池', apiBase: 'https://api.apipool.com/v1' },
  { id: '88api', name: '88API', url: 'https://88api.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '低价中转，社区活跃', apiBase: 'https://api.88api.com/v1' },
  { id: 'aigcbest', name: 'AIGCBest', url: 'https://aigcbest.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude', 'Gemini'], desc: '聚合中转，按 token 计费', apiBase: 'https://api.aigcbest.com/v1' },
  { id: 'laozhang', name: '老张 API', url: 'https://laozhang.ai', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude', 'Gemini'], desc: '老牌中转，文档详尽', apiBase: 'https://api.laozhang.ai/v1' },
  { id: 'jeniya', name: 'Jeniya', url: 'https://jeniya.cc', category: 'paidrelay', type: 'paid', status: 'ok', models: ['Claude', 'GPT'], desc: 'Claude Code 中转', apiBase: 'https://api.jeniya.cc/v1' },
  { id: '147api', name: '147API', url: 'https://147api.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '稳定中转，支持套餐', apiBase: 'https://api.147api.com/v1' },
  { id: 'poloapi', name: 'PoloAPI', url: 'https://poloapi.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '中转聚合，低价', apiBase: 'https://api.poloapi.com/v1' },
  { id: 'proaiapi', name: 'ProAIAPI', url: 'https://proaiapi.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '稳定中转，企业级 SLA', apiBase: 'https://api.proaiapi.com/v1' },
  { id: 'n1n', name: 'N1N', url: 'https://n1n.cn', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '低价中转，社区运营', apiBase: 'https://api.n1n.cn/v1' },
  { id: '0011', name: '0011 API', url: 'https://0011.cc', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '中转聚合', apiBase: 'https://api.0011.cc/v1' },
  { id: 'coderplan', name: 'CoderPlan', url: 'https://coderplan.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['Claude Code', 'GPT'], desc: 'Claude Code 专用中转', apiBase: 'https://api.coderplan.com/v1' },
  { id: 'ccsub', name: 'CCSub', url: 'https://ccsub.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['Claude Code'], desc: 'Claude Code 订阅制中转', apiBase: 'https://api.ccsub.com/v1' },
  { id: 'atlascloud', name: 'AtlasCloud', url: 'https://atlascloud.cn', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '稳定中转，企业级', apiBase: 'https://api.atlascloud.cn/v1' },
  { id: 'apinebula', name: 'APINebula', url: 'https://apinebula.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude', 'Gemini'], desc: '聚合中转，多渠道负载', apiBase: 'https://api.apinebula.com/v1' },
  { id: 'apikeyfun', name: 'APIKeyFun', url: 'https://apikeyfun.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '稳定中转，支持套餐', apiBase: 'https://api.apikeyfun.com/v1' },
  { id: 'tokenlab', name: 'TokenLab', url: 'https://tokenlab.cn', category: 'blacklist', type: 'paid', status: 'dead', models: ['GPT', 'Claude'], desc: '按 token 计费中转', apiBase: 'https://api.tokenlab.cn/v1', blacklistReason: '域名出售中（TokenLab.CN for sale）', blacklistReasonType: 'domain-sale' },
  { id: 'micuapi', name: 'MicuAPI', url: 'https://micuapi.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '聚合中转', apiBase: 'https://api.micuapi.com/v1' },
  { id: 'sssaicode', name: 'SSSAICode', url: 'https://sssaicode.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['Claude Code'], desc: 'Claude Code 中转', apiBase: 'https://api.sssaicode.com/v1' },
  { id: 'rightcode', name: 'RightCode', url: 'https://rightcode.ai', category: 'paidrelay', type: 'paid', status: 'ok', models: ['Claude Code'], desc: 'Claude Code 中转', apiBase: 'https://api.rightcode.ai/v1' },
  { id: 'oreniva', name: 'Oreniva', url: 'https://oreniva.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['Claude Code', 'GPT'], desc: 'Claude Code 中转', apiBase: 'https://api.oreniva.com/v1' },
  { id: 'crazyrouter', name: 'CrazyRouter', url: 'https://crazyrouter.cn', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '聚合中转，社区活跃', apiBase: 'https://api.crazyrouter.cn/v1' },
  { id: 'uyunzhisuan', name: 'U云智算', url: 'https://uyunzhisuan.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '云算中转，支持套餐', apiBase: 'https://api.uyunzhisuan.com/v1' },
  { id: 'cubence', name: 'Cubence', url: 'https://cubence.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '聚合中转', apiBase: 'https://api.cubence.com/v1' },
  { id: 'patewayai', name: 'PatewayAI', url: 'https://patewayai.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '稳定中转', apiBase: 'https://api.patewayai.com/v1' },
  { id: '1000zhen', name: '1000Zhen', url: 'https://1000zhen.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['Claude Code'], desc: 'Claude Code 中转', apiBase: 'https://api.1000zhen.com/v1' },
  { id: 'loomcode', name: 'LoomCode', url: 'https://loomcode.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['Claude Code'], desc: 'Claude Code 中转', apiBase: 'https://api.loomcode.com/v1' },
  { id: '9527code', name: '9527Code', url: 'https://9527code.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['Claude Code'], desc: 'Claude Code 中转', apiBase: 'https://api.9527code.com/v1' },
  { id: 'shengsuanyun', name: '剩算云', url: 'https://shengsuanyun.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '云算力中转，按量计费', apiBase: 'https://api.shengsuanyun.com/v1' },
  { id: 'aicodemirror', name: 'AICodeMirror', url: 'https://aicodemirror.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['Claude Code'], desc: 'Claude Code 中转', apiBase: 'https://api.aicodemirror.com/v1' },
  { id: 'aigocode', name: 'AIGOCode', url: 'https://aigocode.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['Claude Code'], desc: 'Claude Code 中转', apiBase: 'https://api.aigocode.com/v1' },
  { id: 'packycode', name: 'PackyCode', url: 'https://packycode.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['Claude Code'], desc: 'Claude Code 中转', apiBase: 'https://api.packycode.com/v1' },
  { id: 'freemodelai', name: 'FreeModelAI', url: 'https://freemodelai.com', category: 'paidrelay', type: 'freemium', status: 'ok', models: ['GPT', 'Claude', 'Gemini'], desc: '部分模型免费额度', apiBase: 'https://api.freemodelai.com/v1' },
  { id: 'pincc', name: 'PinCC', url: 'https://pincc.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '聚合中转', apiBase: 'https://api.pincc.com/v1' },
  { id: 'aihubhkcn', name: 'AIHub HK/CN', url: 'https://aihubhkcn.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '香港/大陆双节点', apiBase: 'https://api.aihubhkcn.com/v1' },
  { id: 'ddshub', name: 'DDSHub', url: 'https://ddshub.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '聚合中转', apiBase: 'https://api.ddshub.com/v1' },
  { id: 'jiekouvip', name: '接口VIP', url: 'https://jiekouvip.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '稳定中转', apiBase: 'https://api.jiekouvip.com/v1' },
  { id: 'highwayapi', name: 'HighwayAPI', url: 'https://highwayapi.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '稳定中转，多渠道', apiBase: 'https://api.highwayapi.com/v1' },
  { id: 'levolink', name: 'Levolink', url: 'https://levolink.com', category: 'overseas', type: 'paid', status: 'ok', models: ['Claude Code', 'GPT'], desc: 'Claude Code 中转', apiBase: 'https://api.levolink.com/v1', note: '国内直连 SSL 异常，需海外网络' },
  { id: 'tokenriver', name: 'TokenRiver', url: 'https://tokenriver.com', category: 'blacklist', type: 'paid', status: 'dead', models: ['GPT', 'Claude'], desc: '原按 token 计费中转，域名现出售中', apiBase: 'https://api.tokenriver.com/v1', blacklistReason: '域名挂售（Premium Domain For Sale）', blacklistReasonType: 'domain-sale' },
  { id: 'tokenrunning', name: 'TokenRunning', url: 'https://tokenrunning.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '按 token 计费', apiBase: 'https://api.tokenrunning.com/v1' },
  { id: 'gptsapi', name: 'GPTS API', url: 'https://gptsapi.net', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '聚合中转', apiBase: 'https://api.gptsapi.net/v1' },
  { id: 'aifast', name: 'AIFast', url: 'https://aifast.com', category: 'overseas', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '快速中转，多渠道', apiBase: 'https://api.aifast.com/v1', note: '国内直连 HTTP 403，需海外网络' },
  { id: 'lemonapi', name: 'LemonAPI', url: 'https://lemonapi.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '聚合中转，低价', apiBase: 'https://api.lemonapi.com/v1' },
  { id: 'lmuai', name: '灵眸 AI', url: 'https://api.lmuai.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['Claude全系', 'GPT', 'Gemini'], desc: '国内服务器直连，内部汇率 ¥2.4/$（官方约 33 折），支持 Prompt Cache 降低 90% 成本', tagline: '国内服务器直连，内部汇率 ¥2.4/$，支持 Prompt Cache', features: ['付费', '国产', '低延迟'], apiBase: 'https://api.lmuai.com', billing: '内部汇率 ¥2.4/$，按 token 计费', register: '邮箱', note: 'Claude Code 性价比首选，配合 Prompt Cache 可省 90%' },
  { id: 'clawapi', name: 'ClawApi (富利)', url: 'https://clawapi.fulitimes.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['Claude全系', 'Codex'], desc: '富利Times 团队运营的付费中转，与公益站联动，Claude Code 专项优化', tagline: '富利团队付费中转，Claude Code 专项优化', features: ['付费', '国产'], apiBase: 'https://clawapi.fulitimes.com', note: '与富利Times 公益站同主体' },
  { id: 'tokenriver-cn', name: 'TokenRiver (CN)', url: 'https://api.tokenriver.cn', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude', 'Gemini'], desc: '国内企业级 AI Gateway，国内基础设施部署，OpenAI/Anthropic 多协议支持', tagline: '国内企业级 AI Gateway，国内基础设施', features: ['付费', '国产', '企业级', '低延迟'], apiBase: 'https://api.tokenriver.cn', note: '注意：tokenriver.com 已挂售，本条为 .cn 实际运营主体' },
  { id: 'shenma', name: '神马中转', url: 'https://api.whatai.cc', category: 'paidrelay', type: 'paid', status: 'ok', models: ['650+ 模型', 'GPT', 'Claude', 'Gemini', 'DeepSeek'], desc: '聚合 650+ 模型，覆盖主流商用与开源模型，价格透明', tagline: '聚合 650+ 模型，价格透明', features: ['付费', '国产', '多模型'], apiBase: 'https://api.whatai.cc', billing: '按 token 计费' },
  { id: 'claudeapi', name: 'ClaudeAPI', url: 'https://claudeapi.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['Claude全系'], desc: '专注 Claude API 中转，仅 Claude 系列，专业度高', tagline: '专注 Claude API 中转，专业度高', features: ['付费'], apiBase: 'https://api.claudeapi.com' },
  { id: 'poixe', name: 'Poixe AI', url: 'https://poixe.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['Claude', 'GPT', 'Gemini'], desc: '2024 年开始运营的聚合中转，文档简洁，社区口碑良好', tagline: '2024 年新运营聚合中转，社区口碑良好', features: ['付费'], apiBase: 'https://api.poixe.com' },
  { id: 'rightcode-rc', name: 'RightCode (right.codes)', url: 'https://right.codes', category: 'paidrelay', type: 'paid', status: 'ok', models: ['Claude', 'Gemini', 'GPT'], desc: '专注 Claude/Gemini/GPT 三大主流模型低价中转', tagline: '专注 Claude/Gemini/GPT 三大主流中转', features: ['付费'], apiBase: 'https://api.right.codes', note: '区别于 rightcode.ai' },
  { id: 'shiyunapi', name: 'ShiyunApi', url: 'https://shiyunapi.com', category: 'paidrelay', type: 'paid', status: 'unknown', models: ['GPT', 'Claude'], desc: '社区提及的付费中转，信息较少', tagline: '社区提及付费中转，信息待补', features: ['付费'], apiBase: 'https://api.shiyunapi.com' },
  { id: 'eflowcode', name: 'E-FlowCode', url: 'https://e-flowcode.cc', category: 'paidrelay', type: 'paid', status: 'ok', models: ['Claude Code', 'Codex'], desc: 'Claude Code / Codex 专用中转，按 token 计费', tagline: 'Claude Code / Codex 专用中转', features: ['付费'], apiBase: 'https://api.e-flowcode.cc' },
  { id: 'lxapi', name: 'LX_API', url: 'https://lxtech.icu', category: 'paidrelay', type: 'paid', status: 'ok', models: ['Claude Code', 'GPT'], desc: 'Claude Code 中转，按 token 计费，社区活跃', tagline: 'Claude Code 中转，社区活跃', features: ['付费'], apiBase: 'https://api.lxtech.icu' },
  { id: 'token5u', name: 'Token5u', url: 'https://token5u.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '按 token 计费的聚合中转，价格透明', tagline: '按 token 计费聚合中转，价格透明', features: ['付费'], apiBase: 'https://api.token5u.com' },
  { id: 'hvoyai', name: 'hvoy.ai', url: 'https://hvoy.ai', category: 'paidrelay', type: 'paid', status: 'ok', models: ['Claude', 'GPT', 'Gemini'], desc: '海外节点中转，支持 GPT/Claude/Gemini 多模型', tagline: '海外节点中转，多模型聚合', features: ['付费', '海外'], apiBase: 'https://api.hvoy.ai' },
  { id: 'apimiao', name: 'API秒', url: 'https://apimiao.com', category: 'paidrelay', type: 'paid', status: 'unknown', models: ['GPT', 'Claude'], desc: '社区提及的低价中转', tagline: '社区提及低价中转', features: ['付费'], apiBase: 'https://api.apimiao.com' },
  { id: 'janyai', name: '简易 API', url: 'https://janyai.com', category: 'paidrelay', type: 'paid', status: 'unknown', models: ['GPT', 'Claude'], desc: '社区提及的聚合中转', tagline: '社区提及聚合中转', features: ['付费'], apiBase: 'https://api.janyai.com' },
  { id: 'duckcoding-ai', name: 'DuckCoding AI', url: 'https://www.duckcoding.ai', category: 'paidrelay', type: 'paid', status: 'ok', models: ['Claude全系', 'GPT', 'Gemini', 'DeepSeek'], desc: '原 duckcoding.com 复活新域，全模型聚合中转，价格透明', tagline: 'duckcoding 复活新域，全模型聚合', features: ['付费', '多模型'], apiBase: 'https://api.duckcoding.ai' },
  { id: 'xingtupai', name: '星图派', url: 'https://xingtupai.com', category: 'paidrelay', type: 'paid', status: 'unknown', models: ['GPT', 'Claude', 'Gemini'], desc: '社区推荐聚合中转，多模型支持', tagline: '社区推荐聚合中转', features: ['付费', '多模型'], apiBase: 'https://api.xingtupai.com' },
  { id: 'ofox-ai', name: 'OFox AI', url: 'https://ofox.ai', category: 'paidrelay', type: 'paid', status: 'unknown', models: ['GPT', 'Claude', 'Gemini'], desc: '社区推荐聚合中转，界面简洁', tagline: '社区推荐聚合中转，界面简洁', features: ['付费'], apiBase: 'https://api.ofox.ai' },
  { id: 'tokenmix', name: 'TokenMix', url: 'https://tokenmix.ai', category: 'paidrelay', type: 'paid', status: 'unknown', models: ['GPT', 'Claude', 'Gemini'], desc: '社区推荐聚合中转，按 token 计费', tagline: '社区推荐按 token 计费', features: ['付费'], apiBase: 'https://api.tokenmix.ai' },
  { id: 'b-ai', name: 'B.AI', url: 'https://b.ai', category: 'paidrelay', type: 'paid', status: 'unknown', models: ['GPT', 'Claude', 'Gemini'], desc: '简洁域名 AI 中转，社区推荐', tagline: '简洁域名 AI 中转', features: ['付费'], apiBase: 'https://api.b.ai' },
  { id: 'nanobanana', name: 'NanoBanana', url: 'https://nanobanana.com', category: 'paidrelay', type: 'paid', status: 'unknown', models: ['GPT', 'Claude', 'Gemini'], desc: '社区推荐聚合中转，低价策略', tagline: '社区推荐低价中转', features: ['付费'], apiBase: 'https://api.nanobanana.com' },

  // ===== 海外官方免费层 (overseas) =====
  { id: 'openrouter', name: 'OpenRouter', url: 'https://openrouter.ai', category: 'overseas', type: 'freemium', status: 'ok', models: ['GPT', 'Claude', 'Gemini', 'Llama', 'DeepSeek', 'Grok'], desc: '聚合 200+ 模型的统一接口，含大量免费模型（:free 后缀）', tagline: '聚合 200+ 模型，含大量免费模型', features: ['免费额度', '海外', '多模型'], apiBase: 'https://openrouter.ai/api/v1', billing: '免费模型 0 元，付费模型按官方价', note: '免费模型有速率限制', pros: ['300+模型聚合，一个Key调用所有', '免费模型无需充值', '支持OpenAI兼容格式'], cons: ['免费模型有速率限制', '部分模型需充值', '国内访问需代理'], tips: '注册后在 Models 页面筛选 free 排序，选择适合的免费模型' },
  { id: 'claude', name: 'Anthropic Claude', url: 'https://console.anthropic.com', category: 'overseas', type: 'freemium', status: 'ok', models: ['Claude Opus 4', 'Claude Sonnet 4', 'Claude Haiku'], desc: 'Anthropic 官方 API，Claude 系列模型，新用户 $5 免费额度，代码能力顶级', tagline: 'Claude 官方 API，新用户 $5 免费额度', features: ['免费额度', '海外'], apiBase: 'https://api.anthropic.com/v1', billing: '新用户 $5 免费额度，按量计费', pros: ['Claude官方API', '代码能力顶级', '支持长上下文'], cons: ['免费额度有限', '国内需代理', '价格较高'], tips: '新用户有$5免费额度，适合高质量代码生成' },
  { id: 'gemini', name: 'Google Gemini', url: 'https://aistudio.google.com', category: 'overseas', type: 'freemium', status: 'ok', models: ['Gemini 2.5 Pro', 'Gemini 2.5 Flash', 'Gemma'], desc: 'Google AI Studio 免费 Gemini API，每分钟 15 次请求', tagline: 'Google AI Studio 免费 Gemini，15 RPM', features: ['免费额度', '海外'], apiBase: 'https://generativelanguage.googleapis.com/v1beta', billing: '免费层有限额，付费走 Vertex AI', pros: ['Google官方免费层', '支持多模态(文本/图片/视频)', '上下文窗口大(1M+)'], cons: ['国内无法直连', '免费层有速率限制', '部分地区不可用'], tips: '使用 gemini-1.5-flash 免费层，15 RPM/1500 RPD' },
  { id: 'groq', name: 'Groq', url: 'https://groq.com', category: 'overseas', type: 'freemium', status: 'ok', models: ['Llama 3.3 70B', 'Mixtral', 'Gemma 2'], desc: '极速推理（LPU），免费层 30 RPM/14400 RPD', tagline: 'LPU 极速推理，速度全球第一', features: ['免费额度', '海外', '低延迟'], apiBase: 'https://api.groq.com/openai/v1', billing: '免费层', note: '速度全球第一', pros: ['LPU推理极快(500+ tok/s)', '免费层无需信用卡', '支持Llama/Mixtral等开源模型'], cons: ['仅支持开源模型', '有RPM/TPM限制', '国内需代理'], tips: '适合需要快速响应的场景，免费层20 RPM' },
  { id: 'cerebras', name: 'Cerebras', url: 'https://cerebras.ai', category: 'overseas', type: 'freemium', status: 'ok', models: ['Llama 3.1 8B', 'Llama 3.1 70B'], desc: 'CS-3 晶圆级推理，免费层速度仅次于 Groq', tagline: 'CS-3 晶圆级推理，速度仅次于 Groq', features: ['免费额度', '海外', '低延迟'], apiBase: 'https://api.cerebras.ai/v1', billing: '免费层' },
  { id: 'together', name: 'Together AI', url: 'https://together.ai', category: 'overseas', type: 'freemium', status: 'ok', models: ['Llama', 'Qwen', 'DeepSeek', 'Mixtral'], desc: '开源模型聚合推理，注册送 $5 免费额度', tagline: '开源模型聚合，注册送 $5', features: ['免费额度', '海外', '多模型'], apiBase: 'https://api.together.xyz/v1', billing: '注册 $5' },
  { id: 'huggingface', name: 'HuggingFace Inference', url: 'https://huggingface.co/inference-endpoints', category: 'overseas', type: 'freemium', status: 'ok', models: ['Llama', 'Qwen', 'Mistral', 'Phi', 'DeepSeek'], desc: 'HF 推理 API 免费层，serverless 调用任意开源模型', tagline: 'HF serverless 调用任意开源模型', features: ['免费额度', '海外', '多模型'], apiBase: 'https://api-inference.huggingface.co', billing: '免费层有限额' },
  // ===== 国内大模型官方平台 (domestic) =====
  { id: 'siliconflow', name: '硅基流动', url: 'https://siliconflow.cn', category: 'domestic', type: 'freemium', status: 'ok', models: ['DeepSeek V3/R1', 'Qwen', 'GLM', 'Llama', 'Gemma'], desc: '国内推理加速聚合，14 亿元补贴，大量模型永久免费', tagline: '14 亿元补贴，大量模型永久免费', features: ['免费额度', '国产', '多模型', '低延迟'], apiBase: 'https://api.siliconflow.cn/v1', billing: '部分模型免费，付费 0.5~2 元/M', note: '国内首选', pros: ['聚合多个开源模型', '部分模型完全免费', '国内直连速度快'], cons: ['免费模型有限', '高峰期可能排队'], tips: 'Qwen2.5-7B等小模型免费，适合轻量任务' },
  { id: 'zhipu', name: '智谱 GLM', url: 'https://open.bigmodel.cn', category: 'domestic', type: 'freemium', status: 'ok', models: ['GLM-4.6', 'GLM-4.5', 'GLM-4-Flash', 'GLM-4V'], desc: 'GLM 系列官方，GLM-4-Flash 永久免费，新用户送 2000 万 token', tagline: 'GLM-4-Flash 永久免费，新用户送 2000 万 token', features: ['免费额度', '国产'], apiBase: 'https://open.bigmodel.cn/api/paas/v4', billing: 'Flash 免费，Air/Plus 按量', pros: ['国产大模型第一梯队', '免费额度充足', '国内直连低延迟', '支持多模态'], cons: ['高级模型需付费', '部分功能限速'], tips: 'GLM-4-Flash完全免费，适合日常使用' },
  { id: 'aliyun-bailian', name: '阿里云百炼', url: 'https://bailian.console.aliyun.com', category: 'domestic', type: 'freemium', status: 'ok', models: ['Qwen3-Max', 'Qwen3-Coder', 'QwQ', 'Qwen-VL'], desc: 'Qwen 系列官方，新用户送 100 万 token，限时免费 Qwen-Long', tagline: 'Qwen 官方，新用户送 100 万 token', features: ['免费额度', '国产', '多模型'], apiBase: 'https://dashscope.aliyuncs.com/compatible-mode/v1', billing: '部分免费，按量计费' },
  { id: 'tencent-hunyuan', name: '腾讯混元', url: 'https://cloud.tencent.com/product/hunyuan', category: 'domestic', type: 'freemium', status: 'ok', models: ['Hunyuan-Turbos', 'Hunyuan-Large', 'Hunyuan-Standard'], desc: '腾讯混元官方，新用户 100 万 token 免费', tagline: '腾讯混元官方，新用户 100 万 token 免费', features: ['免费额度', '国产'], apiBase: 'https://api.hunyuan.cloud.tencent.com/v1', billing: '免费额度 + 按量' },
  { id: 'doubao', name: '字节豆包', url: 'https://volcengine.com/product/doubao', category: 'domestic', type: 'freemium', status: 'ok', models: ['Doubao-1.5-Pro', 'Doubao-1.5-Vision', 'DeepSeek R1'], desc: '字节火山引擎，新用户 50 万 token，Doubao-Lite 永久免费', tagline: '字节火山引擎，Doubao-Lite 永久免费', features: ['免费额度', '国产'], apiBase: 'https://ark.cn-beijing.volces.com/api/v3', billing: '部分免费 + 按量' },
  { id: 'baidu-qianfan', name: '百度千帆', url: 'https://qianfan.baidubce.com', category: 'domestic', type: 'freemium', status: 'ok', models: ['ERNIE 4.5', 'ERNIE X1', 'ERNIE Speed'], desc: '文心一言官方，ERNIE Speed 永久免费，多款免费', tagline: '文心一言官方，ERNIE Speed 永久免费', features: ['免费额度', '国产'], apiBase: 'https://qianfan.baidubce.com/v2', billing: 'Speed 免费，其他按量', note: '主页为控制台登录页，非 404' },
  { id: 'iflytek', name: '讯飞星火', url: 'https://spark.xfyun.cn', category: 'domestic', type: 'freemium', status: 'ok', models: ['Spark 4.0 Ultra', 'Spark Max', 'Spark Lite'], desc: '讯飞星火官方，Spark Lite 永久免费', tagline: '讯飞星火官方，Spark Lite 永久免费', features: ['免费额度', '国产'], apiBase: 'https://spark-api-open.xf-yun.com/v1', billing: 'Lite 免费，其他按量' },
  { id: 'moonshot', name: 'Moonshot Kimi', url: 'https://platform.moonshot.cn', category: 'domestic', type: 'freemium', status: 'ok', models: ['Kimi K2', 'Moonshot-v1-8K/32K/128K'], desc: 'Kimi 官方，长上下文 128K，新用户 15 元额度', tagline: 'Kimi 官方，长上下文 128K，新用户 15 元额度', features: ['免费额度', '国产'], apiBase: 'https://api.moonshot.cn/v1', billing: '按量计费', pros: ['超长上下文(200万字)', '国内直连', '免费额度充足'], cons: ['仅支持Kimi模型', '高峰期限速'], tips: '适合长文档分析和总结场景' },
  { id: 'deepseek', name: 'DeepSeek', url: 'https://platform.deepseek.com', category: 'domestic', type: 'paid', status: 'ok', models: ['DeepSeek V3', 'DeepSeek R1'], desc: 'DeepSeek 官方 API，全球最低价 1 元/M token', tagline: '全球最低价 1 元/M token，缓存命中 0.1 元/M', features: ['付费', '国产', '低延迟'], apiBase: 'https://api.deepseek.com/v1', billing: '缓存命中 0.1 元/M', note: '火爆时段易 503', pros: ['国产模型性价比最高', 'API价格远低于GPT-4', '国内直连低延迟', '代码能力强'], cons: ['高峰期可能限速', '上下文窗口有限'], tips: '使用 deepseek-chat 模型性价比最高，deepseek-reasoner 适合复杂推理' },
  { id: 'minimax', name: 'MiniMax', url: 'https://platform.minimaxi.com', category: 'domestic', type: 'freemium', status: 'ok', models: ['abab7', 'MiniMax-Text-01', 'MiniMax-M1'], desc: 'MiniMax 官方，新用户 500 万 token，含语音模型', tagline: 'MiniMax 官方，新用户 500 万 token，含语音模型', features: ['免费额度', '国产'], apiBase: 'https://api.minimaxi.com/v1', billing: '免费额度 + 按量' },

  // ===== 框架与导航 (tool) =====
  { id: 'veloera', name: 'Veloera', url: 'https://github.com/Veloera/Veloera', category: 'tool', type: 'free', status: 'ok', models: ['OpenAI兼容', 'Claude'], desc: 'One API 分支，New API 的活跃维护版本', tagline: 'New API 的活跃维护版本', features: ['免费', '开源'], note: 'One API 系现代分支' },
  { id: 'anyrouter-os', name: 'AnyRouter 开源版', url: 'https://github.com/anyrouter/anyrouter', category: 'blacklist', type: 'free', status: 'dead', models: ['Claude Code'], desc: '专注 Claude Code 中转的开源框架，含公益站搭建文档', blacklistReason: 'GitHub 仓库 404（Page not found）', blacklistReasonType: 'repo-removed' },
  { id: 'tokamak', name: 'Tokamak', url: 'https://github.com/Tokamak-IA/tokamak', category: 'blacklist', type: 'free', status: 'dead', models: ['OpenAI兼容'], desc: '现代中转管理框架，支持多渠道聚合', blacklistReason: 'GitHub 仓库 404（Page not found）', blacklistReasonType: 'repo-removed' },
  { id: 'veridrop', name: 'Veridrop', url: 'https://github.com/veridrop/veridrop', category: 'blacklist', type: 'free', status: 'dead', models: ['OpenAI兼容'], desc: 'OpenAI 兼容密钥分发与额度管理框架', blacklistReason: 'GitHub 仓库 404（Page not found）', blacklistReasonType: 'repo-removed' },
  { id: 'api-ranking', name: 'API Ranking', url: 'https://api-ranking.com', category: 'tool', type: 'free', status: 'ok', models: ['GPT', 'Claude'], desc: '中转站价格/速度/可用性对比榜单', note: '中转站挑选参考' },
  { id: 'aiproxy-best', name: 'aiproxy.best', url: 'https://aiproxy.best', category: 'tool', type: 'free', status: 'ok', models: ['GPT', 'Claude'], desc: '中转站聚合导航与对比站' },
  { id: 'token1000', name: 'Token1000', url: 'https://token1000.com', category: 'tool', type: 'free', status: 'ok', models: ['GPT', 'Claude'], desc: '中转站评测与额度查询工具' },
  { id: 'codernav', name: 'CodeRNav', url: 'https://github.com/codernav/ai-relay-list', category: 'blacklist', type: 'free', status: 'dead', models: ['GPT', 'Claude'], desc: 'GitHub 维护的 AI 中转站收录清单', blacklistReason: 'GitHub 仓库 404（Page not found）', blacklistReasonType: 'repo-removed' },
  { id: 'awesome-claude-api', name: 'awesome-claude-api', url: 'https://github.com/claude-api/awesome-claude-api', category: 'blacklist', type: 'free', status: 'dead', models: ['Claude'], desc: 'Claude API 公益站/中转站 GitHub 收录列表', blacklistReason: 'GitHub 仓库 404（Page not found）', blacklistReasonType: 'repo-removed' },
  { id: 'free-llm-api-resources', name: 'free-llm-api-resources', url: 'https://github.com/cheahjs/free-llm-api-resources', category: 'tool', type: 'free', status: 'ok', models: ['GPT', 'Claude', 'Gemini', 'Grok', 'Llama'], desc: '实时汇总全球官方免费层与逆向接口的列表，附速率限制', note: '动态调研参考' },
  { id: 'apinav', name: 'APINav 导航', url: 'https://apinav.cc', category: 'tool', type: 'free', status: 'ok', models: ['GPT', 'Claude'], desc: 'AI 中转站导航站，收录 137+ 站点，按免费/付费/公益分类', tagline: 'AI 中转站导航站，137+ 站点收录', features: ['免费', '导航'], note: '中转站发现参考' },
  { id: 'aj80', name: '80aj 公益站汇总', url: 'https://80aj.com', category: 'tool', type: 'free', status: 'ok', models: ['GPT', 'Claude'], desc: '公益站/中转站汇总指南发布站，定期更新公益站清单与使用教程', tagline: '公益站/中转站汇总指南发布站', features: ['免费', '公益', '导航'], note: '公益站动态参考' },
  { id: 'linuxdo-nav', name: 'LinuxDo 公益站帖', url: 'https://linux.do', category: 'tool', type: 'free', status: 'ok', models: ['GPT', 'Claude', 'Gemini'], desc: 'LinuxDo 社区是公益站主要发源地，关注"公益站"标签获取最新动态', tagline: '公益站主要发源地社区', features: ['免费', '公益', 'Linux.do', '社区'], note: '公益站一手信息源' },

  // ===== 黑名单（失效站点，单独追加）=====
  { id: 'zhiyunapi', name: 'ZhiyunApi', url: 'https://zhiyunapi.com', category: 'blacklist', type: 'paid', status: 'dead', models: ['GPT', 'Claude'], desc: '原付费中转站，站点已被管理员停止运行', tagline: '站点已被管理员停止运行', features: ['付费'], apiBase: 'https://api.zhiyunapi.com', blacklistReason: '站点已被管理员停止运行（"抱歉！该站点已经被管理员停止运行"）', blacklistReasonType: 'service-stopped' },

  // ===== [新增] 社区公益站 (linuxdo) =====
  { id: 'huan666', name: 'Huan666', url: 'https://ai.huan666.de', category: 'linuxdo', type: 'freemium', status: 'ok', models: ['Claude全系', 'DeepSeek-R1', 'Grok-4', 'Kimi-K2', 'GLM-4.5'], desc: 'LinuxDo 社区知名公益中转站，模型种类丰富，覆盖 Claude 全系、DeepSeek-R1、Grok-4、Kimi-K2、GLM-4.5 等主流模型。Grok 系列采用极低倍率（约 $0.01/M token），按 token 计费，性价比突出，适合开发者日常调用。', tagline: '模型丰富，Grok 系列极低倍率', features: ['免费额度', '公益', 'Linux.do', '多模型'], apiBase: 'https://ai.huan666.de', register: 'Linux.do OAuth', note: 'Grok系列极低倍率，约 $0.01/M token' },
  { id: 'muyuan', name: '君の公益', url: 'https://muyuan.do', category: 'linuxdo', type: 'free', status: 'ok', models: ['Claude', 'Codex'], desc: 'LinuxDo 社区个人维护的纯公益中转站，提供 Claude 与 Codex 模型免费调用。依托 Linux.do 账号体系，无需付费即可使用，适合轻量开发与代码辅助场景。', tagline: '纯公益 Claude/Codex 免费中转', features: ['免费', '公益', 'Linux.do'], apiBase: 'https://muyuan.do', register: 'Linux.do 账号' },
  { id: 'ggboom', name: 'GGBOOM公益站', url: 'https://ai.qaq.al', category: 'linuxdo', type: 'free', status: 'ok', models: ['GPT', 'Codex'], desc: 'GGBOOM 运营的 LinuxDo 社区公益站，开放注册即可免费使用 GPT 与 Codex 模型。站点稳定，适合需要免费 GPT/Codex 额度的开发者。', tagline: '开放注册，GPT/Codex 免费公益', features: ['免费', '公益', 'Linux.do'], register: '开放注册' },
  { id: 'ikuncode', name: 'IKunCode', url: 'https://api.ikuncode.cc', category: 'linuxdo', type: 'freemium', status: 'ok', models: ['GPT', 'Claude'], desc: 'LinuxDo 社区中转站，开放注册赠送免费额度，支持 GPT 与 Claude 模型。提供 OpenAI 兼容接口，接入便捷，适合个人开发者试用。', tagline: '注册送额度，GPT/Claude 中转', features: ['免费额度', 'Linux.do'], apiBase: 'https://api.ikuncode.cc', register: '开放注册' },
  { id: 'anticode', name: 'AntiCode', url: 'https://anticode.cn', category: 'linuxdo', type: 'freemium', status: 'ok', models: ['GPT', 'Claude'], desc: 'LinuxDo 社区中转站，开放注册赠送免费额度，支持 GPT 与 Claude 模型。兼容 CC Switch、Cherry Studio 等主流客户端，配置灵活，开发体验友好。', tagline: '注册送额度，兼容 CC Switch/Cherry Studio', features: ['免费额度', 'Linux.do'], apiBase: 'https://anticode.cn', register: '开放注册', note: '支持 CC Switch、Cherry Studio' },
  { id: 'aizzz', name: 'AIZZZ', url: 'https://api.aizzz.xyz', category: 'linuxdo', type: 'freemium', status: 'ok', models: ['GPT', 'Claude'], desc: 'LinuxDo 社区中转站，开放注册赠送免费额度，支持 GPT 与 Claude 模型。提供标准 OpenAI 兼容接口，接入简单，适合个人开发者轻量使用。', tagline: '注册送额度，GPT/Claude 中转', features: ['免费额度', 'Linux.do'], apiBase: 'https://api.aizzz.xyz', register: '开放注册' },
  { id: 'huainova', name: 'Huainova公益站', url: 'https://ai.huaibao.top', category: 'linuxdo', type: 'free', status: 'unstable', models: ['Claude', 'GPT'], desc: 'LinuxDo 社区公益站，提供 Claude 与 GPT 模型免费调用，依托 Linux.do 账号登录。目前部分渠道失效待恢复，稳定性一般，建议作为备用站点。', tagline: '公益 Claude/GPT，渠道恢复中', features: ['免费', '公益', 'Linux.do'], register: 'Linux.do 账号', note: '渠道失效待恢复' },

  // ===== [新增] 付费商业中转站 (paidrelay) =====
  { id: 'hezu-ink', name: '合租巴士', url: 'https://hezu.ink', category: 'paidrelay', type: 'freemium', status: 'ok', models: ['Codex', 'GPT', 'Claude'], desc: '低价商业中转站，开放注册赠送免费额度，支持 Codex、GPT、Claude 多模型。Codex 补贴分组仅 0.08x 倍率，延迟低、性价比高，适合代码辅助场景。', tagline: 'Codex 补贴分组 0.08x 倍率', features: ['免费额度', '低延迟'], apiBase: 'https://hezu.ink', register: '开放注册', billing: 'Codex补贴分组0.08x倍率' },
  { id: 'aike-api', name: '艾可API', url: 'https://ai.wisech.com', category: 'paidrelay', type: 'freemium', status: 'ok', models: ['GPT', 'Claude', 'DeepSeek'], desc: '国产低价中转站，开放注册赠送免费额度，支持 GPT、Claude、DeepSeek 等模型。国产模型 7 折优惠，国内节点低延迟，适合国内开发者使用。', tagline: '国产模型 7 折，国内低延迟', features: ['免费额度', '低延迟', '国产'], apiBase: 'https://ai.wisech.com', register: '开放注册', billing: '国产模型7折' },
  { id: '4router', name: '4Router', url: 'https://4router.net', category: 'paidrelay', type: 'freemium', status: 'ok', models: ['Claude', 'GPT'], desc: '低价中转站，开放注册赠送免费额度，支持 Claude 与 GPT 模型。cheapClaude 分组仅 0.45x 倍率，延迟低，适合预算敏感的 Claude 用户。', tagline: 'cheapClaude 0.45x 倍率', features: ['免费额度', '低延迟'], apiBase: 'https://4router.net', register: '开放注册', billing: 'cheapClaude 0.45x倍率' },
  { id: 'krill-ai', name: 'Krill AI', url: 'https://www.krill-ai.com', category: 'paidrelay', type: 'freemium', status: 'ok', models: ['Grok', 'GPT', 'Claude'], desc: '中转站，开放注册赠送免费额度，支持 Grok、GPT、Claude 模型。Grok 提供专属免费额度，适合想低成本体验 Grok 系列的开发者。', tagline: '注册送 Grok 免费额度', features: ['免费额度'], apiBase: 'https://www.krill-ai.com', register: '开放注册', billing: 'Grok免费额度' },
  { id: 'fastaitoken', name: 'FastAI模型', url: 'https://www.fastaitoken.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['Grok', 'GPT', 'Claude'], desc: '付费中转站，支持 Grok、GPT、Claude 模型，按 token 计费。Grok 约 0.03 倍率，价格极低，适合大量调用 Grok 的场景。', tagline: 'Grok 约 0.03 倍率，极低价', features: ['付费'], apiBase: 'https://www.fastaitoken.com', register: '开放注册', billing: 'Grok约0.03倍率' },
  { id: 'horizon-api', name: 'Horizon API', url: 'https://api.honglin.asia', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '付费中转站，支持 GPT 与 Claude 模型，主打低价 GPT。国内节点低延迟，适合对延迟敏感的国内开发者。', tagline: '低价 GPT，国内低延迟', features: ['付费', '低延迟'], apiBase: 'https://api.honglin.asia', register: '开放注册', billing: '低价GPT' },
  { id: 'tokenskingdom', name: 'Tokens Kingdom', url: 'https://tokenskingdom.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '付费中转站，支持 GPT 与 Claude 模型，按 token 计费。价格透明，开放注册，适合稳定商用的开发者。', tagline: 'GPT/Claude 付费中转', features: ['付费'], apiBase: 'https://tokenskingdom.com', register: '开放注册' },
  { id: 'yunwu', name: '云雾API', url: 'https://yunwu.ai', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT全系', 'Claude', 'Gemini', 'DeepSeek', 'Grok'], desc: '老牌付费中转站，聚合 GPT 全系、Claude、Gemini、DeepSeek 等多模型，按量计费。支持支付宝/微信支付，模型覆盖全面，适合多模型混合调用。', tagline: '多模型聚合，按量计费', features: ['付费', '多模型'], apiBase: 'https://api.yunwu.ai/v1', register: '开放注册', billing: '按量计费', payment: '支付宝/微信', pros: ['多渠道负载均衡', '支持GPT/Claude/Gemini全系列', '运营时间长口碑好'], cons: ['付费使用', '需充值'], tips: '充值前先小额测试稳定性' },
  { id: 'bltcy-ai', name: '柏拉图AI', url: 'https://api.bltcy.ai', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '付费中转站，提供 Azure 渠道低价 GPT 与 Claude 模型。支持支付宝/微信支付，Azure 官方渠道稳定性高，适合企业级调用。', tagline: 'Azure 渠道低价 GPT/Claude', features: ['付费'], apiBase: 'https://api.bltcy.ai', register: '开放注册', billing: 'Azure渠道低价', payment: '支付宝/微信' },
  { id: 'no1-api', name: 'No.1-API', url: 'https://api.rcouyi.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude', 'DeepSeek'], desc: '付费中转站，支持 GPT、Claude、DeepSeek 等多模型，按 token 计费。支持支付宝/微信支付，模型丰富，适合多模型混合开发。', tagline: '多模型付费中转', features: ['付费', '多模型'], apiBase: 'https://api.rcouyi.com', register: '开放注册', payment: '支付宝/微信' },
  { id: 'uiuiapi', name: 'UiUiAPI', url: 'https://uiuiapi.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude', 'DeepSeek', '300+模型'], desc: '付费中转站，聚合 300+ 模型，覆盖 GPT、Claude、DeepSeek 等主流模型。采用官方渠道官方倍率，支持支付宝/微信，适合需要丰富模型选择的开发者。', tagline: '300+ 模型，官方渠道官方倍率', features: ['付费', '多模型'], apiBase: 'https://api.uiuiapi.com/v1', register: '开放注册', billing: '官方渠道官方倍率', payment: '支付宝/微信', note: '文档完善' },
  { id: 'closeai-asia', name: 'CloseAI', url: 'https://www.closeai-asia.com', category: 'paidrelay', type: 'paid', status: 'ok', models: ['GPT', 'Claude'], desc: '企业级商业中转站，支持 GPT 与 Claude 模型，亚洲节点低延迟。支持支付宝/微信/发票，可开具发票，适合企业采购与商用场景。', tagline: '企业级中转，可开发票', features: ['付费', '企业级', '低延迟'], apiBase: 'https://api.closeai-asia.com', register: '开放注册', billing: '企业级中转可开发票', payment: '支付宝/微信/发票', pros: ['企业级中转可开发票', '亚洲节点低延迟', '运营稳定'], cons: ['价格相对较高', '需充值'], tips: '适合企业用户，可开具正规发票' },
  { id: 'tokenriver-ai', name: 'TokenRiver', url: 'https://tokenriver.ai', category: 'paidrelay', type: 'freemium', status: 'ok', models: ['GPT全系', 'Claude', 'Gemini', 'DeepSeek', 'Codex'], desc: '中转站，新用户注册即领免费额度，支持 GPT 全系、Claude、Gemini、DeepSeek、Codex 等多模型。针对 Codex 代码辅助场景优化，低延迟，适合开发者编程使用。', tagline: '注册领额度，Codex 场景优化', features: ['免费额度', '低延迟', '多模型'], apiBase: 'https://tokenriver.ai', register: '开放注册', billing: '新用户注册即领免费额度', note: '针对Codex代码辅助场景优化' },

  // ===== [新增] 海外官方免费层 (overseas) =====
  { id: 'github-models', name: 'GitHub Models', url: 'https://github.com/marketplace/models', category: 'overseas', type: 'free', status: 'ok', models: ['GPT-5', 'GPT-4.1', 'GPT-4o', 'o4-mini', 'Llama-4', 'DeepSeek-R1', 'Mistral'], desc: 'GitHub 官方模型市场，免费提供 GPT-5、GPT-4.1、GPT-4o、o4-mini、Llama-4、DeepSeek-R1、Mistral 等模型推理。面向原型开发，GPT-5 限速 10RPM/50RPD，无需绑卡即可免费调用 GPT-5。', tagline: '免费调 GPT-5，无需绑卡', features: ['免费', '海外', '多模型'], apiBase: 'https://models.github.ai/inference', register: 'GitHub账号', billing: '免费原型开发，GPT-5: 10RPM/50RPD', note: '可免费调GPT-5，无需绑卡', pros: ['可免费调GPT-5', '无需绑卡', 'GitHub账号即可用'], cons: ['限额低(10RPM/50RPD)', '仅限原型开发'], tips: '使用GITHUB_TOKEN即可调用，适合快速原型验证' },
  { id: 'cerebras-cloud', name: 'Cerebras', url: 'https://cloud.cerebras.ai', category: 'overseas', type: 'free', status: 'ok', models: ['gpt-oss-120b', 'glm-4.7'], desc: 'Cerebras 官方云平台，基于 CS-3 晶圆级引擎提供超快推理，速度约 2600 tokens/s。免费层支持 gpt-oss-120b 与 glm-4.7，限速 30RPM/14400RPD/1M tokens/day，注册即可使用。', tagline: '超快推理 ~2600 tok/s', features: ['免费', '海外'], apiBase: 'https://api.cerebras.ai/v1', register: '注册即可', billing: '免费30RPM/14400RPD/1M tokens/day', note: '超快推理~2600 tok/s', pros: ['推理速度极快(~2600 tok/s)', '免费1M tokens/day', '无需信用卡'], cons: ['免费层上下文限制8K', '模型选择少'], tips: '适合需要极速响应的场景' },
  { id: 'sambanova', name: 'SambaNova', url: 'https://cloud.sambanova.ai/apis', category: 'overseas', type: 'free', status: 'ok', models: ['DeepSeek-V3.1'], desc: 'SambaNova 官方云平台，基于 RDU 推理芯片提供超快推理，支持 DeepSeek-V3.1。免费层限速 20RPM/20RPD/200K tokens/day，注册即可使用，适合体验极速 DeepSeek。', tagline: 'RDU 超快推理 DeepSeek-V3.1', features: ['免费', '海外'], apiBase: 'https://api.sambanova.ai/v1', register: '注册即可', billing: '免费20RPM/20RPD/200K tokens/day', note: 'RDU超快推理' },
  { id: 'cloudflare', name: 'Cloudflare Workers AI', url: 'https://developers.cloudflare.com/workers-ai', category: 'overseas', type: 'free', status: 'ok', models: ['Llama-3.3-70b', 'Llama-4', 'gpt-oss-120b', 'kimi-k2', 'gemma-4', 'glm-4.7', 'deepseek-r1'], desc: 'Cloudflare 边缘网络 AI 推理服务，依托全球分布的边缘节点实现低延迟推理。每日 10000 Neurons 免费额度，支持 Llama、gpt-oss、kimi-k2、glm、deepseek 等多模型。', tagline: '边缘网络低延迟，每日 10K Neurons 免费', features: ['免费', '海外', '多模型', '低延迟'], apiBase: 'https://api.cloudflare.com/client/v4/accounts/{id}/ai/run', register: 'Cloudflare账号', billing: '每日10000 Neurons免费', note: '边缘网络低延迟全球分布', pros: ['每日10000 Neurons免费', '边缘网络低延迟', '50+模型可选'], cons: ['需Cloudflare账号', '部分模型质量一般'], tips: 'Llama-3.3-70b效果最好，适合通用对话' },
  { id: 'nvidia-nim', name: 'NVIDIA NIM', url: 'https://build.nvidia.com', category: 'overseas', type: 'free', status: 'ok', models: ['DeepSeek-R1', 'Llama-3.1-405B', 'Qwen2.5-72B', 'Gemma-4', 'Mistral-Large-2', '100+模型'], desc: 'NVIDIA build 平台，提供 100+ 模型的企业级推理服务，覆盖 DeepSeek-R1、Llama-3.1-405B、Qwen2.5-72B 等。免费层约 40RPM，无每日 token 上限，适合企业级推理体验。', tagline: '100+ 模型企业级推理', features: ['免费', '海外', '多模型', '企业级'], apiBase: 'https://integrate.api.nvidia.com/v1', register: 'NVIDIA Developer账号', billing: '约40RPM无每日token上限', note: '100+模型企业级推理', pros: ['100+模型可选', '企业级推理质量', '约40RPM无token上限'], cons: ['需NVIDIA Developer账号', '国内需代理'], tips: 'DeepSeek-R1和Llama-3.1-405B效果最佳' },
  { id: 'huggingface-router', name: 'Hugging Face Inference', url: 'https://huggingface.co', category: 'overseas', type: 'freemium', status: 'ok', models: ['数千个模型'], desc: 'Hugging Face 官方推理路由，覆盖数千个开源模型，通过统一 router 端点调用。免费层每月 100K credits，自动路由到 Fireworks、Together 等多 provider，开源生态最丰富。', tagline: '数千模型，路由多 provider', features: ['免费额度', '海外', '开源', '多模型'], apiBase: 'https://router.huggingface.co/v1', register: 'HF账号', billing: '免费100K月度credits', note: '路由到Fireworks/Together等多provider' },
  { id: 'mistral', name: 'Mistral AI', url: 'https://console.mistral.ai', category: 'overseas', type: 'free', status: 'ok', models: ['Mistral Medium 3.5', 'Mistral Small 4', 'Mistral Large 3', 'Codestral', 'Pixtral Large'], desc: '法国 Mistral 官方平台，免费提供 Mistral Medium 3.5、Small 4、Large 3、代码模型 Codestral 与多模态 Pixtral Large。Experiment 计划约 1B tokens/月免费，覆盖对话、代码与多模态场景。', tagline: '含 Codestral 代码与 Pixtral 多模态', features: ['免费', '海外'], apiBase: 'https://api.mistral.ai/v1', register: '注册即可', billing: 'Experiment计划约1B tokens/月免费', note: '含代码模型Codestral和多模态Pixtral', pros: ['欧洲厂商GDPR合规', '含代码模型Codestral', '多模态Pixtral'], cons: ['免费层1 RPS较低', '国内需代理'], tips: 'Codestral适合代码补全，免费约1B tokens/月' },
  { id: 'cohere', name: 'Cohere', url: 'https://dashboard.cohere.com', category: 'overseas', type: 'free', status: 'ok', models: ['Command A+', 'Command A', 'Command R+', 'Command R'], desc: 'Cohere 官方平台，提供 Command A+、A、R+、R 系列模型，支持 256K 超长上下文。Trial 计划每月 1000 次调用免费（限非商业），适合长文档处理与企业检索场景。', tagline: '256K 超长上下文', features: ['免费', '海外'], apiBase: 'https://api.cohere.com/v2', register: '注册即可', billing: 'Trial 1000 calls/月非商业', note: '256K超长上下文' },
  { id: 'ovhcloud-ai', name: 'OVHcloud AI', url: 'https://www.ovhcloud.com/en/public-cloud/ai-endpoints', category: 'overseas', type: 'free', status: 'ok', models: ['Qwen3.5-397B', 'gpt-oss-120b', 'Llama-3.3-70B', 'Qwen3-Coder-30B', 'Mistral-Small'], desc: 'OVHcloud 官方 AI Endpoints，提供 Qwen3.5-397B、gpt-oss-120b、Llama-3.3-70B、Qwen3-Coder-30B 等模型推理。完全匿名无需注册，匿名层 2RPM 免费，EU 托管 GDPR 合规。', tagline: '无需注册，EU 托管 GDPR 合规', features: ['免费', '海外', '无需注册'], apiBase: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1', register: '无需注册', billing: '匿名层2RPM免费', note: '完全匿名无需注册EU托管GDPR合规' },
  { id: 'llm7', name: 'LLM7.io', url: 'https://api.llm7.io', category: 'overseas', type: 'free', status: 'ok', models: ['deepseek-r1', 'deepseek-v3', 'gemini-2.5-flash', 'gpt-4o-mini', 'mistral-small', 'qwen2.5-coder'], desc: '无需注册即可使用的免费 OpenAI 兼容接口，支持 deepseek-r1、deepseek-v3、gemini-2.5-flash、gpt-4o-mini、mistral-small、qwen2.5-coder 等模型。免费 30RPM（有 token 时 120RPM），GDPR 合规。', tagline: '无需注册，多模型免费', features: ['免费', '海外', '无需注册'], apiBase: 'https://api.llm7.io/v1', register: '无需注册', billing: '30RPM免费(有token120RPM)', note: '无需注册即可使用GDPR合规' },
  { id: 'kilo-code', name: 'Kilo Code', url: 'https://kilo.ai', category: 'overseas', type: 'free', status: 'ok', models: ['grok-code-fast', 'minimax-m2.5', 'nemotron-3-super', 'trinity-large-thinking'], desc: '面向编码场景的免费模型网关，支持 grok-code-fast、minimax-m2.5、nemotron-3-super、trinity-large-thinking 等模型。自动路由选择最优免费模型，约 200 req/hr 免费，适合代码辅助。', tagline: '自动路由最优免费编码模型', features: ['免费', '海外'], apiBase: 'https://api.kilo.ai/api/gateway', register: '注册即可', billing: '约200 req/hr免费', note: '自动路由选择最优免费模型' },

  // ===== [新增] 国内大模型官方平台 (domestic) =====
  { id: 'xiaomi-mimo', name: '小米MiMo', url: 'https://platform.xiaomimimo.com', category: 'domestic', type: 'free', status: 'ok', models: ['MiMo系列'], desc: '小米官方大模型平台，专注推理能力的 MiMo 系列，限时免费中。使用小米账号登录即可调用，适合体验国产推理模型。', tagline: '专注推理，限时免费', features: ['免费', '国产'], register: '小米账号', billing: '限时免费中', note: '专注推理能力' },

  // ===== [新增] 框架与导航 (tool) =====
  { id: 'oneapi', name: 'One-API', url: 'https://github.com/songquanpeng/one-api', category: 'tool', type: 'free', status: 'ok', models: ['多供应商'], desc: '流行的多供应商API网关，30+供应商支持，提供Web面板管理多API Key，负载均衡和配额管理。是大量中转站背后的事实标准开源模板。', tagline: '多供应商API网关开源标准', features: ['开源', '多模型', '免费'], note: 'Go语言开发，Docker部署；New API / Veloera 等均基于此分支', pros: ['30+供应商支持', 'Web面板管理', 'Docker一键部署'], cons: ['文档主要为中文', '需自备服务器'], tips: '自建中转首选，配合Docker部署最简单' },
  { id: 'newapi', name: 'New API', url: 'https://github.com/Calcium-Ion/new-api', category: 'tool', type: 'free', status: 'ok', models: ['多供应商'], desc: 'One-API的Fork，增加额外渠道类型。下一代LLM网关+AI资产管理系统，统一入口+智能路由+格式转换+计费。', tagline: '下一代LLM网关管理系统', features: ['开源', '多模型', '免费'], note: 'One-API Fork增强版，中转站最常用框架', pros: ['One-API增强版', '支持Midjourney/Suno等', '中转站最常用框架'], cons: ['配置较复杂', '需自备服务器和API Key'], tips: '大部分中转站基于此搭建，功能最全面' },
  { id: 'litellm', name: 'LiteLLM', url: 'https://litellm.ai', category: 'tool', type: 'freemium', status: 'ok', models: ['100+供应商'], desc: 'Python优先的开源网关，100+供应商支持，自带密钥管理。企业广泛使用。', tagline: 'Python优先的开源LLM网关', features: ['开源', '多模型', '企业级'], note: '开源+企业版' },
  { id: 'metapi', name: 'Metapi', url: 'https://github.com/wyf9661/metapi', category: 'tool', type: 'free', status: 'ok', models: ['多供应商聚合'], desc: '"中转站的中转站"——将分散的AI中转站聚合为统一网关，一个API Key、一个端点，自动模型发现、智能路由和成本优化。', tagline: '中转站聚合统一网关', features: ['开源', '多模型'], note: '聚合New API/One API/Sub2API站点' },

  // ===== [新增] 免费对话站 (freechat) =====
  { id: 'ai-free-forever', name: 'AI Free Forever', url: 'https://aifreeforever.com', category: 'freechat', type: 'free', status: 'ok', models: ['GPT', 'Claude', '多种AI'], desc: '海外全功能AI工具聚合平台，无注册无付费无限制，从AI对话到图像生成、音频处理，覆盖1000+实用功能，适配手机电脑全设备。', tagline: '永久免费无限制AI工具聚合', features: ['免费', '无需注册', '多模型'] },
  { id: 'chatgpt-no-login', name: 'ChatGPT免登录', url: 'https://chatgpt.com', category: 'freechat', type: 'free', status: 'ok', models: ['GPT'], desc: 'OpenAI自2024年4月起移除强制登录限制，无需注册账号即可直接和ChatGPT聊天。', tagline: '无需登录直接对话ChatGPT', features: ['免费', '无需注册', '海外'], note: '国内可能需要特定方式访问' },
];
