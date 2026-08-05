// 站点语录池（加载过渡页展示，三语随机）
// 目的：品牌露出 + 传达站点价值，用户等待时不空洞。
import type { LocaleKey } from '@/lib/types';

export const slogans: Record<LocaleKey, string[]> = {
  zh: [
    '汇聚全网免费资源，为你省下每一分钱',
    '白嫖不是目的，效率才是',
    '每一条链接都经真实验证，拒绝无效资源',
    '薅羊毛，我们是认真的',
    '资源会过期，验证让它们保持新鲜',
    '从免费 API 到永久服务器，一站薅齐',
  ],
  en: [
    'Every free resource, curated for you',
    'Efficiency first, wallet untouched',
    'Every link verified by hand — no dead ends',
    'Serious about saving your money',
    'Fresh deals, verified daily',
    'From free APIs to forever-free VPS, all in one',
  ],
  ja: [
    '無料リソースを網羅、お金を守る',
    '効率が命、財布は無傷',
    '全リンクを実検証、無駄なし',
    '無料を真剣に、節約を極める',
    '鮮度を保つ検証、毎日更新',
    '無料APIから永久無料VPSまで一箇所で',
  ],
};
