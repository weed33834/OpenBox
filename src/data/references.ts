// 参考资源库（内部研究用，不混入站点资源，也不对外展示）
// 用途：收集同类开源导航/聚合项目与资料源，供内容扩充与功能借鉴。
// 维护：新增参考源追加到列表即可。

export interface Reference {
  name: string;
  url: string;
  kind: 'github' | 'site';
  desc: string;
}

export const references: Reference[] = [
  {
    name: 'awesome-free-models',
    url: 'https://github.com/hrs070/awesome-free-models',
    kind: 'github',
    desc: '免费 AI 模型/API/工具精选清单，链接定期实测验证',
  },
  {
    name: 'awesome-ai-api',
    url: 'https://github.com/MackDing/awesome-ai-api',
    kind: 'github',
    desc: '200+ AI API 网关与中转站，每日实测 /v1/models，自带排行榜与黑名单方法论',
  },
  {
    name: 'awesome-free-llm-apis',
    url: 'https://github.com/mnfst/awesome-free-llm-apis',
    kind: 'github',
    desc: '永久免费 LLM API 精选（提供商 + 推理平台，额度透明）',
  },
  {
    name: 'free-llm-api-resources',
    url: 'https://github.com/cheahjs/free-llm-api-resources',
    kind: 'github',
    desc: '免费 LLM 推理资源，永久免费与试用额度分开整理',
  },
  {
    name: 'awesome-ai',
    url: 'https://github.com/arinagrawal05/awesome-ai',
    kind: 'github',
    desc: '实用 AI 工具、慷慨免费 API、500+ 开源项目清单',
  },
  {
    name: 'awesome-ai-tools',
    url: 'https://github.com/eudk/awesome-ai-tools',
    kind: 'github',
    desc: '大型 AI 工具目录（LLM 软件/LLMOps 等分类）',
  },
  {
    name: 'free-ai-tools',
    url: 'https://github.com/ShaikhWarsi/free-ai-tools',
    kind: 'github',
    desc: '免费/低价 AI 工具、LLM API、IDE、Agent 与基础设施',
  },
  {
    name: 'no-cost-ai',
    url: 'https://github.com/zebbern/no-cost-ai',
    kind: 'github',
    desc: '免费 AI 服务大全：对话/图像/视频/语音/API 分类',
  },
];
