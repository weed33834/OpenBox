// 本地种子数据：作为「未配置 Supabase 时」的兜底数据源，也作为生产库的初始内容。
// 内容来源：① 既有策展数据（src/data/sites.ts，API/中转类）经映射复用；② 新分类的精选真实条目。
import type { Resource, ResourceType } from '@/lib/types';
import { SUBTYPE_SCENARIOS } from './taxonomy';
import { sites, deriveFeatures, type Site } from './sites';

// ---- 旧 Category -> 新 slug 映射（黑名单整体丢弃） ----
const LEGACY_MAP: Record<string, string> = {
  linuxdo: 'free-api',
  overseas: 'free-api',
  domestic: 'free-api',
  freechat: 'ai-apps',
  freerelay: 'relays',
  paidrelay: 'relays',
  tool: 'tools',
};

function mapLegacy(s: Site): Resource | null {
  const category = LEGACY_MAP[s.category];
  if (!category) return null; // blacklist 等不纳入新站
  const featuredIds = new Set([
    'anyrouter',
    'cups-moe',
    'duckcoding-free',
    'wzw',
  ]);
  return {
    id: s.id,
    subType: category,
    scenarios: SUBTYPE_SCENARIOS[category] ?? [],
    name: s.name,
    url: s.url,
    type: s.type,
    status: s.status,
    summary: s.tagline ?? s.desc,
    description: s.desc,
    tags: s.features && s.features.length ? s.features : deriveFeatures(s),
    models: s.models,
    pricing: s.billing,
    register: s.register,
    pros: s.pros,
    cons: s.cons,
    tips: s.tips,
    official: s.category === 'domestic' || s.category === 'overseas',
    featured: featuredIds.has(s.id),
  };
}

const legacyResources: Resource[] = sites
  .map(mapLegacy)
  .filter((r): r is Resource => r !== null);

// ---- 新分类精选条目（均为稳定、可公开验证的真实项目/产品） ----

function mk(subType: string, name: string, url: string, extra: Partial<Resource> = {}): Resource {
  return {
    id: `cur-${subType}-${name}`.replace(/[^a-zA-Z0-9\-]/g, '-').toLowerCase(),
    subType,
    scenarios: SUBTYPE_SCENARIOS[subType] ?? [],
    name,
    url,
    type: 'free' as ResourceType,
    status: 'unknown',
    summary: '',
    description: '',
    tags: [],
    ...extra,
  };
}

const curated: Resource[] = [
  // ===== 免费 API：官方/社区稳定免费额度（OpenAI 兼容为主），与 freechat 镜像站区分 =====
  mk('free-api', 'Google AI Studio (Gemini)', 'https://aistudio.google.com', {
    type: 'freemium', status: 'ok', official: true, featured: true,
    summary: 'Google 官方免费大模型 playground，Gemini Flash/Pro 免费额度，多模态 + 1M 上下文。',
    description: 'AI Studio 是体验 Gemini 系列最便捷入口，免费层提供 Flash 大模型与可观额度，支持函数调用与多模态输入。',
    tags: ['官方', '多模态', '海外'], models: ['Gemini 2.5/3 Flash', 'Gemini Pro'],
    pros: ['官方免费', '上下文长'], cons: ['区域限制'], tips: '免费版足够日常原型验证。',
  }),
  mk('free-api', 'Groq', 'https://groq.com', {
    type: 'freemium', status: 'ok', official: true,
    summary: 'LPU 极速推理，免费层 ~1000 req/天，OpenAI 兼容。',
    description: 'Groq 以自研 LPU 提供极低延迟推理，免费档覆盖 Llama、Gemma、Qwen 等开放模型，API 与 OpenAI 兼容。',
    tags: ['推理', '海外', 'OpenAI兼容'], models: ['Llama', 'Gemma', 'Qwen'],
    pros: ['速度极快', '免费额度'], cons: ['模型受限'],
  }),
  mk('free-api', 'Cerebras', 'https://cerebras.ai', {
    type: 'freemium', status: 'ok', official: true,
    summary: '免费 ~1M tokens/天，GPT-OSS 与 GLM 高速推理。',
    description: 'Cerebras 提供超大推理集群，免费档每日百万 token，支持 GPT-OSS、GLM 等开放权重模型。',
    tags: ['推理', '海外', 'OpenAI兼容'], models: ['GPT-OSS', 'GLM'], pros: ['额度大', '快'],
  }),
  mk('free-api', 'GitHub Models', 'https://github.com/marketplace/models', {
    type: 'free', status: 'ok', official: true,
    summary: 'GitHub 内置前沿模型试用，50–150 RPD，OpenAI 兼容。',
    description: 'GitHub Models 让开发者在 Codespace/本地用统一接口试用 Claude、GPT、Llama 等前沿模型，适合实验。',
    tags: ['官方', '海外', 'OpenAI兼容'], models: ['GPT', 'Claude', 'Llama', 'Phi'],
    pros: ['前沿模型', '集成 GitHub'], cons: ['限额'],
  }),
  mk('free-api', 'Mistral Platform', 'https://mistral.ai', {
    type: 'freemium', status: 'ok', official: true,
    summary: 'Mistral 官方 Le Chat / API，慷慨免费档，OpenAI 兼容。',
    description: 'Mistral 提供 Mistral/ Codestral 等开放模型与托管 API，免费档含实验额度，API 兼容 OpenAI。',
    tags: ['官方', '海外', 'OpenAI兼容'], models: ['Mistral', 'Codestral'], pros: ['欧洲合规', '免费档'],
  }),
  mk('free-api', 'DeepSeek API', 'https://platform.deepseek.com', {
    type: 'freemium', status: 'ok', official: true, featured: true,
    summary: 'DeepSeek 官方 API，价格极低 + 注册赠送额度，OpenAI 兼容。',
    description: 'DeepSeek 官方开放 API 提供 V3/R1 等强模型，定价远低于同档，注册送额度，兼容 OpenAI SDK。',
    tags: ['官方', '国产', 'OpenAI兼容'], models: ['DeepSeek V3', 'DeepSeek R1'],
    pros: ['极便宜', '推理强'], cons: ['高峰限速'],
  }),
  mk('free-api', 'SiliconFlow (硅基流动)', 'https://siliconflow.cn', {
    type: 'freemium', status: 'ok', official: true,
    summary: '国内可用的多模型 API，注册送免费额度，OpenAI 兼容。',
    description: 'SiliconFlow 聚合 Qwen、DeepSeek、GLM 等开源模型，提供国内直连 API 与免费额度，兼容 OpenAI 接口。',
    tags: ['国产', 'OpenAI兼容'], models: ['Qwen', 'DeepSeek', 'GLM'], pros: ['国内直连', '免费额度'],
  }),
  mk('free-api', 'Together AI', 'https://www.together.ai', {
    type: 'freemium', status: 'ok', official: true,
    summary: '开放模型推理与微调平台，免费档可用多模型。',
    description: 'Together AI 提供 Llama、Qwen 等模型的托管推理与微调，免费档含额度，OpenAI 兼容。',
    tags: ['海外', 'OpenAI兼容'], models: ['Llama', 'Qwen', 'DeepSeek'], pros: ['模型多'],
  }),
  mk('free-api', 'NVIDIA NIM', 'https://build.nvidia.com', {
    type: 'freemium', status: 'ok', official: true,
    summary: 'NVIDIA 托管推理微服务，免费档覆盖主流开放模型。',
    description: 'NVIDIA NIM 以容器化微服务形式提供模型推理端点，免费档可试用 Nemotron、Llama 等。',
    tags: ['官方', '海外', 'OpenAI兼容'], models: ['Nemotron', 'Llama'], pros: ['官方优化'],
  }),
  mk('free-api', 'Hugging Face Inference', 'https://huggingface.co/inference-api', {
    type: 'freemium', status: 'ok', official: true,
    summary: '直接调用数万开源模型的推理 API，免费档可用。',
    description: 'Hugging Face 提供 Serverless Inference，免费档可调用大量开源模型，适合快速验证。',
    tags: ['开源', '海外', 'OpenAI兼容'], models: ['Llama', 'Mistral', 'Qwen'], pros: ['模型海量'],
  }),
  mk('free-api', 'Pollinations', 'https://pollinations.ai', {
    type: 'free', status: 'ok', official: true,
    summary: '完全免费、无需密钥的文本/图像生成 API。',
    description: 'Pollinations 提供免注册、免密钥的 AI 生成端点（含 OpenAI 兼容 chat），适合轻量集成与学习。',
    tags: ['免费', '无需密钥', 'OpenAI兼容'], models: ['开放模型'], pros: ['零门槛'], cons: ['限流'],
  }),

  // ===== 中转站：以 OpenAI 兼容聚合为主（与 freechat 镜像区分，此处为 API 网关类） =====
  mk('relays', 'OpenRouter', 'https://openrouter.ai', {
    type: 'freemium', status: 'ok', official: true, featured: true,
    summary: '一个 Key 调数百模型，含大量 :free 模型，OpenAI 兼容。',
    description: 'OpenRouter 聚合 OpenAI/Anthropic/Google 及众多开源模型，免费档含多款 :free 模型，单一 OpenAI 兼容接口，便于切换。',
    tags: ['聚合', '海外', 'OpenAI兼容'], models: ['GPT', 'Claude', 'Llama', 'Gemini'],
    pros: ['模型极多', '免费档'], cons: ['免费模型轮换'],
  }),

  // ===== 代理节点：以客户端/核心/聚合项目为主（节点订阅时效性极强，故只列稳定项目） =====
  mk('proxy-nodes', 'v2rayN', 'https://github.com/2dust/v2rayN', {
    type: 'free', status: 'ok',
    summary: 'Windows 端主流代理客户端，支持 VMess/VLESS/Trojan/SS 等全协议。',
    description: 'v2rayN 是 Windows 平台最流行的 V2Ray 图形客户端，集成 v2fly 核心，支持订阅管理与分流规则。',
    tags: ['客户端', 'Windows', '开源'], protocols: ['vmess', 'vless', 'trojan', 'ss'],
    pros: ['协议最全', '社区活跃', '订阅方便'], cons: ['仅 Windows 原生'],
    tips: '搭配节点订阅地址使用，注意及时更新核心版本。',
  }),
  mk('proxy-nodes', 'v2rayNG', 'https://github.com/2dust/v2rayNG', {
    type: 'free', status: 'ok',
    summary: 'Android 端 V2Ray 客户端，移动端翻墙首选。',
    description: 'v2rayNG 是 Android 平台的 V2Ray 客户端，界面简洁，支持扫码与订阅导入。',
    tags: ['客户端', 'Android', '开源'], protocols: ['vmess', 'vless', 'trojan', 'ss'],
    pros: ['免费开源', '轻量'], cons: ['仅 Android'],
  }),
  mk('proxy-nodes', 'mihomo (Clash Meta)', 'https://github.com/MetaCubeX/mihomo', {
    type: 'free', status: 'ok',
    summary: 'Clash 内核继任者，规则分流与 TUN 模式强大。',
    description: 'mihomo（原 Clash Meta）是目前最活跃的 Clash 分支，支持真规则、TUN 全局代理、SSR 等。',
    tags: ['核心', '开源', '跨平台'], protocols: ['vmess', 'vless', 'trojan', 'ss', 'ssr'],
    pros: ['规则引擎强', '跨平台'], cons: ['需自行配置前端'],
    tips: '可配合 Clash Verge Rev 等 GUI 使用。',
  }),
  mk('proxy-nodes', 'Clash Verge Rev', 'https://github.com/clash-verge-rev/clash-verge-rev', {
    type: 'free', status: 'ok',
    summary: '基于 mihomo 的跨平台 Clash GUI，体验顺滑。',
    description: 'Clash Verge Rev 是社区维护的 Clash Verge 增强版，内置 mihomo 核心，支持系统代理与 TUN。',
    tags: ['客户端', '跨平台', '开源'], protocols: ['vmess', 'vless', 'trojan', 'ss'],
    pros: ['开箱即用', '界面现代'], cons: ['依赖核心更新'],
  }),
  mk('proxy-nodes', 'sing-box', 'https://github.com/SagerNet/sing-box', {
    type: 'free', status: 'ok',
    summary: '下一代代理核心，协议与路由极其灵活。',
    description: 'sing-box 由 SagerNet 团队开发，统一支持多种入站/出站协议，配置即代码，适合进阶用户。',
    tags: ['核心', '开源', '跨平台'], protocols: ['vmess', 'vless', 'trojan', 'ss', 'hysteria', 'tuic'],
    pros: ['协议新', '性能高'], cons: ['配置门槛较高'],
  }),
  mk('proxy-nodes', 'NekoBox', 'https://github.com/MatsuriDayo/NeKoBox', {
    type: 'free', status: 'ok',
    summary: 'Android/iOS 上的 sing-box 图形客户端。',
    description: 'NekoBox 基于 sing-box，提供移动端友好的订阅与分流体验。',
    tags: ['客户端', '移动端', '开源'], protocols: ['vmess', 'vless', 'trojan', 'ss'],
    pros: ['移动端友好'], cons: ['iOS 需自签'],
  }),
  mk('proxy-nodes', 'hiddify', 'https://github.com/hiddify/hiddify-app', {
    type: 'free', status: 'ok',
    summary: '多平台代理客户端，内置智能路由与订阅管理。',
    description: 'hiddify 提供桌面与移动端客户端，强调易用性与抗封锁能力。',
    tags: ['客户端', '跨平台', '开源'], protocols: ['vmess', 'vless', 'trojan', 'ss'],
    pros: ['多端一致', '易用'], cons: ['体积偏大'],
  }),
  mk('proxy-nodes', 'freefq/freefq', 'https://github.com/freefq/freefq', {
    type: 'free', status: 'unknown',
    summary: 'GitHub 上的免费节点订阅聚合仓库（链接有时效性）。',
    description: 'freefq 等开源仓库会整理并发布免费节点订阅地址，但节点有效性随时间变化，请自行甄别。',
    tags: ['订阅聚合', '开源'], protocols: ['vmess', 'vless', 'trojan', 'ss'],
    pros: ['免费', '更新频繁'], cons: ['节点易失效', '需自担风险'],
    tips: '仅作技术学习用途，注意合规与隐私。',
  }),

  // ===== AI 应用 =====
  mk('ai-apps', 'ChatGPT', 'https://chat.openai.com', {
    type: 'freemium', status: 'ok', official: true,
    summary: 'OpenAI 对话式 AI，免费版可用 GPT-4o mini。',
    description: 'ChatGPT 是目前使用最广的 AI 对话产品，免费层提供基础模型与有限额度。',
    tags: ['对话', '海外', '官方'], models: ['GPT-4o', 'GPT-4o mini', 'o系列'],
    pros: ['生态最全', '插件丰富'], cons: ['免费层有限额'], tips: '免费版够日常轻量使用。',
  }),
  mk('ai-apps', 'Claude', 'https://claude.ai', {
    type: 'freemium', status: 'ok', official: true,
    summary: 'Anthropic 出品，长文本与代码能力强。',
    description: 'Claude 以长上下文与安全对齐著称，免费版可用 Sonnet 级别模型。',
    tags: ['对话', '海外', '官方'], models: ['Claude Opus', 'Claude Sonnet', 'Claude Haiku'],
    pros: ['长上下文', '代码强'], cons: ['区域限制'],
  }),
  mk('ai-apps', 'Gemini', 'https://gemini.google.com', {
    type: 'freemium', status: 'ok', official: true,
    summary: 'Google 多模态 AI，免费版可用 Gemini Flash。',
    description: 'Gemini 深度集成 Google 生态，支持文本、图像、代码多模态。',
    tags: ['对话', '多模态', '官方'], models: ['Gemini Pro', 'Gemini Flash'],
    pros: ['多模态', '免费额度'], cons: ['地区限制'],
  }),
  mk('ai-apps', 'Perplexity', 'https://www.perplexity.ai', {
    type: 'freemium', status: 'ok',
    summary: 'AI 搜索问答引擎，附带来源引用。',
    description: 'Perplexity 将搜索与生成结合，回答自带引用链接，适合研究型查询。',
    tags: ['搜索', '海外'], pros: ['有引用', '实时'], cons: ['免费版限额'],
  }),
  mk('ai-apps', 'Poe', 'https://poe.com', {
    type: 'freemium', status: 'ok',
    summary: '聚合多模型的对话平台（ChatGPT/Claude 等）。',
    description: 'Poe 由 Quora 出品，单站可用多家模型，免费版每日有限点数。',
    tags: ['聚合', '海外'], models: ['GPT', 'Claude', 'Llama'], pros: ['多模型', '入口统一'],
  }),
  mk('ai-apps', 'Cursor', 'https://cursor.com', {
    type: 'freemium', status: 'ok',
    summary: 'AI 原生代码编辑器，免费版可用基础模型。',
    description: 'Cursor 基于 VS Code 分支，内置代码补全与对话式改写，极大提升编码效率。',
    tags: ['编程', '海外'], pros: ['编码强', '免费档可用'], cons: ['高级模型需订阅'],
  }),
  mk('ai-apps', 'v0', 'https://v0.dev', {
    type: 'freemium', status: 'ok',
    summary: 'Vercel 出品的 AI 界面生成器，文本即前端。',
    description: 'v0 可根据提示生成 React/Tailwind 组件与页面，适合快速原型。',
    tags: ['编程', '前端'], pros: ['出图快'], cons: ['需登录'],
  }),
  mk('ai-apps', 'Midjourney', 'https://www.midjourney.com', {
    type: 'paid', status: 'ok',
    summary: '顶尖 AI 绘画，付费订阅制。',
    description: 'Midjourney 以高质量图像生成著称，通过网页与 Discord 使用。',
    tags: ['绘画', '海外'], pros: ['画质顶级'], cons: ['纯付费'],
  }),
  mk('ai-apps', 'Suno', 'https://suno.com', {
    type: 'freemium', status: 'ok',
    summary: 'AI 音乐生成，免费版每日有限额度。',
    description: 'Suno 可根据歌词或描述生成完整歌曲，含人声与编曲。',
    tags: ['音乐', '海外'], pros: ['生成完整曲'], cons: ['免费有限额'],
  }),
  mk('ai-apps', 'HuggingChat', 'https://huggingface.co/chat', {
    type: 'free', status: 'ok',
    summary: 'Hugging Face 开源模型对话，完全免费。',
    description: 'HuggingChat 直接调用开源模型（如 Llama、Mistral），无需密钥。',
    tags: ['对话', '开源'], models: ['Llama', 'Mistral'], pros: ['真免费', '开源'],
  }),
  mk('ai-apps', 'Kimi', 'https://kimi.moonshot.cn', {
    type: 'freemium', status: 'ok', official: true,
    summary: '月之暗面出品，长文本处理强。',
    description: 'Kimi 支持超长上下文，适合读论文、长文档总结。',
    tags: ['对话', '国产'], pros: ['长上下文', '中文好'], cons: ['高峰限速'],
  }),
  mk('ai-apps', '豆包', 'https://www.doubao.com', {
    type: 'freemium', status: 'ok', official: true,
    summary: '字节跳动 AI 助手，免费额度充足。',
    description: '豆包提供对话、写作、图像等能力，网页与 App 均可用。',
    tags: ['对话', '国产'], pros: ['免费额度大'], cons: ['高级能力需付'],
  }),
  mk('ai-apps', '通义千问', 'https://tongyi.aliyun.com', {
    type: 'freemium', status: 'ok', official: true,
    summary: '阿里云大模型，免费版可用通义千问。',
    description: '通义千问覆盖对话、编码、文档等多场景，开放 API 免费额度。',
    tags: ['对话', '国产'], pros: ['生态全', '有API'], cons: ['限额'],
  }),
  mk('ai-apps', '文心一言', 'https://yiyan.baidu.com', {
    type: 'freemium', status: 'ok', official: true,
    summary: '百度大模型，中文理解扎实。',
    description: '文心一言覆盖对话、创作、多模态，企业级应用广泛。',
    tags: ['对话', '国产'], pros: ['中文强'], cons: ['限额'],
  }),
  mk('ai-apps', 'DeepSeek Chat', 'https://chat.deepseek.com', {
    type: 'freemium', status: 'ok', official: true, featured: true,
    summary: '深度求索对话产品，V3/R1 推理免费。',
    description: 'DeepSeek Chat 提供强大的推理与代码能力，基础使用免费，R1 深度思考模式广受好评。',
    tags: ['对话', '国产'], models: ['DeepSeek V3', 'DeepSeek R1'], pros: ['推理强', '免费'], cons: ['高峰限速'],
  }),
  mk('ai-apps', '智谱清言', 'https://chatglm.cn', {
    type: 'freemium', status: 'ok', official: true,
    summary: '清华系 AI 助手，学术与技术场景突出。',
    description: '智谱清言（GLM）支持联网搜索、AI 绘画与代码生成，技术与学术表现稳健。',
    tags: ['对话', '国产'], models: ['GLM'], pros: ['学术强'],
  }),
  mk('ai-apps', '讯飞星火', 'https://xinghuo.xfyun.cn', {
    type: 'freemium', status: 'ok', official: true,
    summary: '科大讯飞大模型，语音交互见长。',
    description: '讯飞星火在语音识别与合成上有天然优势，支持语音输入与播报。',
    tags: ['对话', '国产', '语音'], pros: ['语音强'],
  }),
  mk('ai-apps', '即梦 AI', 'https://jimeng.jianying.com', {
    type: 'freemium', status: 'ok', official: true,
    summary: '字节跳动 AI 绘画与视频，每日免费额度。',
    description: '即梦支持文生图、图生图与文生视频，生成快、中文提示友好，适合创意素材。',
    tags: ['绘画', '视频', '国产'], pros: ['免费额度', '中文友好'],
  }),
  mk('ai-apps', '可灵 AI', 'https://klingai.com', {
    type: 'freemium', status: 'ok', official: true,
    summary: '快手 AI 视频生成，质量领先，每日免费额度。',
    description: '可灵支持文生视频、图生视频，动作流畅，是目前领先的国内 AI 视频平台之一。',
    tags: ['视频', '国产'], pros: ['视频质量高'], cons: ['免费有限额'],
  }),
  mk('ai-apps', 'NotebookLM', 'https://notebooklm.google.com', {
    type: 'free', status: 'ok', official: true, featured: true,
    summary: 'Google 研究助手，上传资料自动生成播客与笔记。',
    description: 'NotebookLM 可基于你提供的资料回答问题、生成摘要与音频概述，最多 50 个来源，适合文献与报告。',
    tags: ['研究', '海外', '文档'], pros: ['资料驱动', '播客生成'], cons: ['需登录'],
  }),
  mk('ai-apps', 'Runway', 'https://runwayml.com', {
    type: 'freemium', status: 'ok',
    summary: '专业 AI 视频生成与编辑，影视级工具。',
    description: 'Runway 提供文生视频、视频编辑与特效，被影视行业广泛使用，免费档含有限额度。',
    tags: ['视频', '海外'], pros: ['专业级'], cons: ['免费有限额'],
  }),

  // ===== 实用工具 =====
  mk('tools', 'Ollama', 'https://ollama.com', {
    type: 'free', status: 'ok',
    summary: '本地运行大模型的极简工具，一行命令拉起。',
    description: 'Ollama 让在本地跑 Llama、Mistral、Qwen 等开源模型变得简单，支持 macOS/Windows/Linux。',
    tags: ['本地推理', '开源'], pros: ['本地隐私', '易用'], cons: ['吃显存'],
    tips: '`ollama run qwen2.5` 即可体验。',
  }),
  mk('tools', 'Dify', 'https://github.com/langgenius/dify', {
    type: 'free', status: 'ok',
    summary: '开源 LLM 应用开发平台，可视化编排。',
    description: 'Dify 提供 RAG、Agent、工作流等能力，可自部署，快速搭建 AI 应用。',
    tags: ['开发平台', '开源', 'RAG'], pros: ['可视化', '可私有化'], cons: ['部署需资源'],
  }),
  mk('tools', 'LangChain', 'https://github.com/langchain-ai/langchain', {
    type: 'free', status: 'ok',
    summary: '最流行的 LLM 应用开发框架。',
    description: 'LangChain 提供链式调用、工具调用、记忆等抽象，Python/JS 双语言。',
    tags: ['框架', '开源'], pros: ['生态大'], cons: ['抽象偏重'],
  }),
  mk('tools', 'LlamaIndex', 'https://github.com/run-llama/llama_index', {
    type: 'free', status: 'ok',
    summary: '面向 RAG 的数据框架。',
    description: 'LlamaIndex 专注数据接入与检索增强生成，适合构建知识库问答。',
    tags: ['框架', 'RAG', '开源'], pros: ['检索强'], cons: ['偏专业'],
  }),
  mk('tools', 'Open WebUI', 'https://github.com/open-webui/open-webui', {
    type: 'free', status: 'ok',
    summary: '自托管的 ChatGPT 风格界面，对接 Ollama/API。',
    description: 'Open WebUI 提供多模型对话、RAG、插件，可私有化部署。',
    tags: ['界面', '开源', '自托管'], pros: ['体验好', '可私有'], cons: ['需部署'],
  }),
  mk('tools', 'ComfyUI', 'https://github.com/comfyanonymous/ComfyUI', {
    type: 'free', status: 'ok',
    summary: '节点式 Stable Diffusion 工作流引擎。',
    description: 'ComfyUI 以可视化节点编排图像生成流程，适合进阶生图与视频。',
    tags: ['绘画', '开源'], pros: ['流程可控'], cons: ['学习曲线陡'],
  }),
  mk('tools', 'Flowise', 'https://github.com/FlowiseAI/Flowise', {
    type: 'free', status: 'ok',
    summary: '拖拽式 LLM 应用搭建平台。',
    description: 'Flowise 用低代码方式构建 Agent 与 RAG 流程，适合快速验证。',
    tags: ['低代码', '开源'], pros: ['上手快'], cons: ['复杂场景受限'],
  }),
  mk('tools', 'n8n', 'https://n8n.io', {
    type: 'freemium', status: 'ok',
    summary: '开源工作流自动化，可接大模型节点。',
    description: 'n8n 支持可视化自动化，内置 AI 节点，适合把 LLM 接入业务系统。',
    tags: ['自动化', '开源'], pros: ['集成多'], cons: ['高级功能付费'],
  }),
  mk('tools', 'LiteLLM', 'https://github.com/BerriAI/litellm', {
    type: 'free', status: 'ok',
    summary: '统一调用上百种 LLM 的代理网关。',
    description: 'LiteLLM 提供 OpenAI 兼容接口，统一各家模型鉴权与计费，便于切换。',
    tags: ['网关', '开源'], pros: ['统一接口'], cons: ['需自部署'],
  }),
  mk('tools', 'V2Ray 官网', 'https://www.v2ray.com', {
    type: 'free', status: 'ok',
    summary: 'V2Ray 项目文档与核心下载。',
    description: 'V2Ray 是主流代理核心，官网提供文档与版本说明。',
    tags: ['文档', '代理'], protocols: ['vmess', 'vless'], pros: ['权威'], cons: ['偏技术'],
  }),
  mk('tools', 'GitHub Copilot', 'https://github.com/features/copilot', {
    type: 'freemium', status: 'ok', official: true,
    summary: 'IDE 代码补全标杆，学生/开源者免费。',
    description: 'Copilot 深度集成 VS Code 等编辑器，提供补全、对话与 Agent 模式，学生与教育邮箱免费。',
    tags: ['编程', '官方'], pros: ['生态好', '免费档'], cons: ['高级模型需订阅'],
  }),
  mk('tools', 'Codeium', 'https://codeium.com', {
    type: 'freemium', status: 'ok',
    summary: '免费代码补全，支持主流 IDE。',
    description: 'Codeium 提供免费无限代码补全与聊天，覆盖多种语言与编辑器。',
    tags: ['编程'], pros: ['免费档强'],
  }),
  mk('tools', 'Windsurf', 'https://windsurf.com', {
    type: 'freemium', status: 'ok',
    summary: 'AI 原生编辑器（原 Codeium 出品），Cascade 智能体。',
    description: 'Windsurf 以 Cascade Agent 实现多文件编辑与命令执行，免费档可用基础模型。',
    tags: ['编程'], pros: ['Agent 强'], cons: ['高级模型需订阅'],
  }),
  mk('tools', 'Bolt.new', 'https://bolt.new', {
    type: 'freemium', status: 'ok',
    summary: '浏览器内一句话生成全栈应用。',
    description: 'Bolt.new 可在浏览器里从提示直接生成并运行 React/全栈项目，适合快速原型。',
    tags: ['编程', '前端'], pros: ['出原型快'], cons: ['需登录'],
  }),
  mk('tools', 'Lovable', 'https://lovable.dev', {
    type: 'freemium', status: 'ok',
    summary: '自然语言到 Web 应用，接 Supabase 后端。',
    description: 'Lovable 用对话式生成可部署的 Web 应用，内置 Supabase 集成，免费档有限额度。',
    tags: ['编程', '前端'], pros: ['全栈生成'], cons: ['免费有限额'],
  }),
  mk('tools', 'AnythingLLM', 'https://anythingllm.com', {
    type: 'free', status: 'ok',
    summary: '私有化知识库问答，桌面与自托管双形态。',
    description: 'AnythingLLM 提供文档入库、RAG 与多模型对话，可本地或自托管，注重隐私。',
    tags: ['RAG', '自托管', '开源'], pros: ['可私有', '易用'], cons: ['需资源'],
  }),
  mk('tools', 'Continue', 'https://continue.dev', {
    type: 'free', status: 'ok',
    summary: '开源 AI 编程插件，VS Code/JetBrains 通用。',
    description: 'Continue 是开源的 IDE AI 助手，可接任意模型与本地推理，灵活可定制。',
    tags: ['编程', '开源'], pros: ['开源', '多模型'],
  }),
  mk('tools', 'Hugging Face', 'https://huggingface.co', {
    type: 'free', status: 'ok', official: true,
    summary: '模型/数据集/空间枢纽，AI 开发者必备。',
    description: 'Hugging Face 托管海量开源模型与数据集，提供 Inference、Spaces 与课程，是开源 AI 中心。',
    tags: ['模型库', '开源'], pros: ['资源海量'],
  }),
  mk('tools', 'Replit', 'https://replit.com', {
    type: 'freemium', status: 'ok',
    summary: '云端 IDE，内置 AI Agent 与部署。',
    description: 'Replit 提供浏览器内开发环境与 Agent，可直接运行与部署应用，免费档可用。',
    tags: ['IDE', '云'], pros: ['免配置'], cons: ['性能受限'],
  }),
  mk('tools', 'Aider', 'https://aider.chat', {
    type: 'free', status: 'ok',
    summary: '终端 AI 编程 Pair，直接改仓库。',
    description: 'Aider 在命令行中与仓库协作，支持多文件编辑与 Git 集成，适合开发者。',
    tags: ['编程', '开源'], pros: ['轻量', '强控制'], cons: ['需命令行'],
  }),
  mk('tools', 'Roo Code', 'https://roocode.com', {
    type: 'free', status: 'ok',
    summary: 'VS Code 中的 AI Agent 扩展，多模式协作。',
    description: 'Roo Code 提供 Code/Architect/Ask 等模式，可接多种模型，开源免费。',
    tags: ['编程', '开源'], pros: ['开源', '灵活'],
  }),
  mk('tools', 'CrewAI', 'https://crewai.com', {
    type: 'free', status: 'ok',
    summary: '多智能体编排框架，角色化协作。',
    description: 'CrewAI 用角色化 Agent 与任务流水线构建多智能体系统，适合自动化工作流。',
    tags: ['框架', 'Agent', '开源'], pros: ['多Agent'], cons: ['偏专业'],
  }),
  mk('tools', 'LM Studio', 'https://lmstudio.ai', {
    type: 'free', status: 'ok',
    summary: '本地模型 GUI，图形化加载与聊天。',
    description: 'LM Studio 提供图形界面在本地运行 GGUF 等模型，支持 OpenAI 兼容本地服务。',
    tags: ['本地推理', '开源'], pros: ['易用', '隐私'], cons: ['吃显存'],
  }),

  // ===== 学习资源 =====
  mk('learn', 'Learn Prompting', 'https://learnprompting.org', {
    type: 'free', status: 'ok',
    summary: '系统化的提示词工程免费课程。',
    description: 'Learn Prompting 提供从入门到进阶的提示词教程，中英双语。',
    tags: ['课程', '提示词'], pros: ['体系全', '免费'],
  }),
  mk('learn', 'FlowGPT', 'https://flowgpt.com', {
    type: 'free', status: 'ok',
    summary: '海量提示词社区与模板库。',
    description: 'FlowGPT 汇集用户分享的提示词，覆盖写作、编程、角色扮演等场景。',
    tags: ['提示词', '社区'], pros: ['模板多'], cons: ['质量参差'],
  }),
  mk('learn', 'OpenAI Cookbook', 'https://github.com/openai/openai-cookbook', {
    type: 'free', status: 'ok',
    summary: '官方示例合集，手把手调用 API。',
    description: 'OpenAI Cookbook 提供大量可运行示例，覆盖检索、微调、函数调用等。',
    tags: ['文档', '示例', '开源'], pros: ['权威', '实用'],
  }),
  mk('learn', 'Anthropic 文档', 'https://docs.anthropic.com', {
    type: 'free', status: 'ok',
    summary: 'Claude 官方 API 与最佳实践文档。',
    description: 'Anthropic 文档详述提示工程、工具使用与模型能力边界。',
    tags: ['文档', '官方'], pros: ['权威'],
  }),
  mk('learn', 'LLM 入门 cookbook', 'https://github.com/datawhalechina/llm-cookbook', {
    type: 'free', status: 'ok',
    summary: 'Datawhale 出品的中文 LLM 实战教程。',
    description: '基于吴恩达课程的中文实践 notebook，适合国内开发者入门。',
    tags: ['课程', '开源', '中文'], pros: ['中文友好'],
  }),
  mk('learn', 'Hugging Face 课程', 'https://huggingface.co/learn', {
    type: 'free', status: 'ok',
    summary: '从 Transformer 到扩散模型的免费课程。',
    description: 'Hugging Face 提供 NLP、Diffusers、Web 端推理等多门免费课。',
    tags: ['课程', '开源'], pros: ['体系全'],
  }),
  mk('learn', 'PromptPerfect', 'https://promptperfect.jina.ai', {
    type: 'freemium', status: 'ok',
    summary: '一键优化提示词，提升模型表现。',
    description: 'PromptPerfect 自动改写并翻译提示词，支持多模型适配。',
    tags: ['提示词', '工具'], pros: ['易用'], cons: ['免费有限'],
  }),
  mk('learn', 'DeepLearning.AI', 'https://www.deeplearning.ai', {
    type: 'free', status: 'ok', official: true,
    summary: '吴恩达团队出品，ChatGPT 提示工程等短课免费。',
    description: 'DeepLearning.AI 提供与 OpenAI/Anthropic 合作的免费短课，覆盖提示工程、智能体构建等。',
    tags: ['课程', '官方'], pros: ['权威', '免费'],
  }),
  mk('learn', 'Google Cloud 生成式 AI', 'https://cloud.google.com/learn/generative-ai', {
    type: 'free', status: 'ok', official: true,
    summary: 'Google 官方生成式 AI 学习路径。',
    description: 'Google Cloud Skills Boost 的免费生成式 AI 路径，含 Gemini 提示设计与实验。',
    tags: ['课程', '官方'], pros: ['权威'],
  }),
  mk('learn', 'Microsoft 生成式 AI 入门', 'https://github.com/microsoft/generative-ai-for-beginners', {
    type: 'free', status: 'ok', official: true,
    summary: '微软开源 21 课，从零学生成式 AI。',
    description: '微软出品的生成式 AI 入门仓库，含示例与中文友好内容，适合系统学习。',
    tags: ['课程', '开源', '中文'], pros: ['体系全', '免费'],
  }),
  mk('learn', 'Anthropic 提示工程教程', 'https://docs.anthropic.com', {
    type: 'free', status: 'ok', official: true,
    summary: 'Claude 官方提示工程交互教程。',
    description: 'Anthropic 文档提供提示工程、工具调用与最佳实践的交互式教程。',
    tags: ['文档', '官方'], pros: ['权威', '交互'],
  }),
  mk('learn', 'OpenAI Academy', 'https://openai.com/academy', {
    type: 'free', status: 'ok', official: true,
    summary: 'OpenAI 官方免费课程与直播。',
    description: 'OpenAI Academy 提供 AI 基础、应用与进阶的免费课程，适合各阶段学习者。',
    tags: ['课程', '官方'], pros: ['权威', '免费'],
  }),
  mk('learn', 'Coddy 提示工程', 'https://coddy.tech', {
    type: 'free', status: 'ok',
    summary: '交互式提示工程课，带证书。',
    description: 'Coddy 提供边写边学的提示工程课程，含测验与完成证书。',
    tags: ['课程'], pros: ['交互', '证书'],
  }),
  mk('learn', 'FreeAcademy 提示课', 'https://freeacademy.ai', {
    type: 'free', status: 'ok',
    summary: '多门免费提示工程短课。',
    description: 'FreeAcademy 提供提示工程入门与实战免费课，模板驱动、即学即用。',
    tags: ['课程'], pros: ['实用'],
  }),
  mk('learn', 'Coursera 提示工程 (Vanderbilt)', 'https://www.coursera.org/learn/prompt-engineering', {
    type: 'free', status: 'ok', official: true,
    summary: '范德堡大学提示工程课，可免费旁听。',
    description: 'Vanderbilt 在 Coursera 的提示工程专项，模式化教学，可免费旁听（证书付费）。',
    tags: ['课程', '官方'], pros: ['体系深'],
  }),
  mk('learn', 'Scrimba 提示工程', 'https://scrimba.com', {
    type: 'freemium', status: 'ok',
    summary: '面向开发者的交互式提示工程课。',
    description: 'Scrimba 以可暂停改写的交互课，把提示工程落在开发者日常工作里。',
    tags: ['课程'], pros: ['实践性强'],
  }),
  mk('learn', 'Simplilearn SkillUp', 'https://www.simplilearn.com/skillup-free-online-courses/prompt-engineering', {
    type: 'free', status: 'ok',
    summary: '多门免费提示工程自定进度课。',
    description: 'Simplilearn SkillUp 提供提示工程入门到进阶的免费自定进度课程与证书。',
    tags: ['课程'], pros: ['免费证书'],
  }),
  mk('learn', '2026 AI 免费资源地图', 'https://yangmao.ai/en/free-map', {
    type: 'free', status: 'ok',
    summary: '汇总免费 GPU/API/工具/课程的资源地图。',
    description: 'yangmao.ai 持续追踪并整理免费算力、API 额度、开发工具与课程，适合按图索骥。',
    tags: ['资源地图', '汇总'], pros: ['持续更新'],
  }),
  mk('learn', 'aifreeplan', 'https://aifreeplan.com', {
    type: 'free', status: 'ok',
    summary: '对比 91+ AI 工具的免费额度与限制。',
    description: 'aifreeplan 整理各 AI 产品的免费档、信用点与试用细节，便于选型。',
    tags: ['资源地图', '汇总'], pros: ['对比清晰'],
  }),
];

// 编辑人气分（静态、全局、可解释）：用于「热门榜」排序的默认信号。
// 后续接入后端（Supabase）时，可替换为收藏数/点击量等真实信号，组件无需改动。
const POPULARITY_BY_NAME: Record<string, number> = {
  'Google AI Studio (Gemini)': 95,
  OpenRouter: 92,
  'DeepSeek API': 90,
  Groq: 85,
  Cerebras: 82,
  'Hugging Face Inference': 80,
  ChatGPT: 94,
  Claude: 92,
  Gemini: 88,
  'DeepSeek Chat': 86,
  Kimi: 80,
  '豆包': 82,
  Ollama: 88,
  Dify: 85,
  LangChain: 84,
  'Hugging Face': 86,
  NotebookLM: 84,
  'GitHub Copilot': 83,
  Cursor: 85,
  Midjourney: 82,
  Suno: 80,
  ComfyUI: 80,
  n8n: 78,
  AnythingLLM: 78,
  'Learn Prompting': 80,
  'DeepLearning.AI': 82,
  'Microsoft 生成式 AI 入门': 80,
};

const curatedRanked: Resource[] = curated.map((r) => ({
  ...r,
  popularity: POPULARITY_BY_NAME[r.name] ?? 0,
}));

/** 全站种子资源（旧数据映射 + 新分类精选 + 人气分） */
export const seedResources: Resource[] = [...legacyResources, ...curatedRanked];

/** 统计各子类型资源数（用于首页卡片角标） */
export function countBySubType(): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const r of seedResources) acc[r.subType] = (acc[r.subType] ?? 0) + 1;
  return acc;
}
