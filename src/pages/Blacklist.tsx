import { useMemo } from "react";
import {
  ShieldOff, AlertTriangle, Skull, Clock, Globe,
  FileX, ServerCrash, ArrowLeft, Ban,
} from "lucide-react";
import { sites, CATEGORY_META, TYPE_META } from "@/data/sites";
import type { Site, BlacklistReasonType } from "@/data/sites";
import { useT, useI18n, translate } from "@/i18n/useI18n";

// 黑名单站点为静态数据，模块级计算一次即可，无需每次渲染 useMemo
const BLACKLIST_SITES = sites.filter((s) => s.category === "blacklist");

// ─── 结构化枚举映射（替代脆弱的字符串匹配） ───

const REASON_ICON: Record<BlacklistReasonType, typeof Skull> = {
  "domain-sale": Skull,
  "http-error": ServerCrash,
  "not-found": FileX,
  "repo-removed": FileX,
  "service-stopped": Ban,
  "ssl-error": AlertTriangle,
  timeout: Clock,
  other: Globe,
};

/** 根据结构化枚举返回图标 */
function getReasonIcon(type: BlacklistReasonType | undefined) {
  const Icon = REASON_ICON[type ?? "other"] ?? Globe;
  return <Icon className="h-4 w-4 text-cyber-dead" />;
}

/** 按 blacklistReasonType 分组（结构化枚举，可靠筛选） */
interface ReasonGroup {
  type: BlacklistReasonType;
  label: string; // 人类可读的 reason 文本（取该组第一条的 blacklistReason）
  sites: Site[];
}

function groupByReasonType(list: Site[]): ReasonGroup[] {
  const map = new Map<BlacklistReasonType, ReasonGroup>();
  for (const s of list) {
    const type = s.blacklistReasonType ?? "other";
    if (!map.has(type)) {
      map.set(type, { type, label: s.blacklistReason || "", sites: [] });
    }
    map.get(type)!.sites.push(s);
  }
  // 按站点数量降序
  return Array.from(map.values()).sort((a, b) => b.sites.length - a.sites.length);
}

// 统计：各枚举类型的站点数量（模块级预计算，O(n) 一次）
const STATS: Record<BlacklistReasonType, number> = {
  "domain-sale": 0,
  "http-error": 0,
  "not-found": 0,
  "repo-removed": 0,
  "service-stopped": 0,
  "ssl-error": 0,
  timeout: 0,
  other: 0,
};
for (const s of BLACKLIST_SITES) {
  STATS[s.blacklistReasonType ?? "other"]++;
}

export default function Blacklist() {
  const groups = useMemo(() => groupByReasonType(BLACKLIST_SITES), []);

  const meta = CATEGORY_META.blacklist;
  const t = useT();
  const lang = useI18n((s) => s.lang);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      {/* 返回首页 */}
      <a
        href="#/"
        className="mb-4 inline-flex items-center gap-1.5 font-mono text-xs text-cyber-muted transition-colors hover:text-cyber-cyan"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("bl.back")}
      </a>

      {/* 标题区 */}
      <div className="mb-6 sm:mb-8">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyber-dead/20">
            <ShieldOff className="h-5 w-5 text-cyber-dead" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-xl font-bold tracking-wider text-cyber-text sm:text-2xl">
              {translate(lang, "cat.blacklist")}
            </h1>
            <p className="font-mono text-xs text-cyber-muted">{meta.desc}</p>
          </div>
        </div>
        <div className="rounded-lg border border-cyber-dead/30 bg-cyber-dead/5 p-3 font-mono text-xs leading-relaxed text-cyber-muted sm:p-4 sm:text-sm">
          <AlertTriangle className="mr-2 inline h-4 w-4 shrink-0 text-cyber-dead" />
          {t("bl.notice")}
        </div>
      </div>

      {/* 统计：使用结构化枚举统计，不再依赖字符串匹配 */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-lg border border-cyber-border bg-cyber-elevated p-3 text-center sm:p-4">
          <div className="font-display text-2xl font-bold text-cyber-dead sm:text-3xl">{BLACKLIST_SITES.length}</div>
          <div className="mt-1 font-mono text-[10px] text-cyber-muted sm:text-xs">{t("bl.totalSites")}</div>
        </div>
        <div className="rounded-lg border border-cyber-border bg-cyber-elevated p-3 text-center sm:p-4">
          <div className="font-display text-2xl font-bold text-cyber-dead sm:text-3xl">
            {groups.length}
          </div>
          <div className="mt-1 font-mono text-[10px] text-cyber-muted sm:text-xs">{t("bl.reasonGroups")}</div>
        </div>
        <div className="rounded-lg border border-cyber-border bg-cyber-elevated p-3 text-center sm:p-4">
          <div className="font-display text-2xl font-bold text-cyber-amber sm:text-3xl">
            {STATS["domain-sale"]}
          </div>
          <div className="mt-1 font-mono text-[10px] text-cyber-muted sm:text-xs">{t("bl.domainSale")}</div>
        </div>
        <div className="rounded-lg border border-cyber-border bg-cyber-elevated p-3 text-center sm:p-4">
          <div className="font-display text-2xl font-bold text-cyber-magenta sm:text-3xl">
            {STATS["repo-removed"]}
          </div>
          <div className="mt-1 font-mono text-[10px] text-cyber-muted sm:text-xs">{t("bl.github404")}</div>
        </div>
      </div>

      {/* 按原因类型分组展示 */}
      <div className="space-y-4 sm:space-y-6">
        {groups.map((group) => (
          <div key={group.type} className="rounded-xl border border-cyber-border bg-cyber-elevated/50 p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2 border-b border-cyber-border/50 pb-3 sm:mb-4">
              {getReasonIcon(group.type)}
              <span className="font-mono text-xs font-semibold text-cyber-dead sm:text-sm">
                {translate(lang, `bl.reason.${group.type}`)}
              </span>
              <span className="ml-auto font-mono text-[11px] text-cyber-muted">
                {t("bl.sitesCount", { n: group.sites.length })}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.sites.map((site) => (
                <div
                  key={site.id}
                  className="group rounded-lg border border-cyber-border/50 bg-cyber-bg/50 p-3 transition-all hover:border-cyber-dead/50"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="truncate font-display text-sm font-semibold text-cyber-text">{site.name}</span>
                    <span
                      className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px]"
                      style={{
                        backgroundColor: `${TYPE_META[site.type].color}22`,
                        color: TYPE_META[site.type].color,
                      }}
                    >
                      {translate(lang, site.type === "free" ? "bl.free" : "bl.paid")}
                    </span>
                  </div>
                  <div className="mb-2 truncate font-mono text-[11px] text-cyber-muted">{site.url}</div>
                  <div className="font-mono text-[11px] leading-relaxed text-cyber-muted/80">{site.desc}</div>
                  {site.blacklistReason && (
                    <div className="mt-2 border-t border-cyber-border/30 pt-2 font-mono text-[10px] leading-relaxed text-cyber-dead/70">
                      {site.blacklistReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 底部提示 */}
      <div className="mt-6 rounded-lg border border-cyber-border bg-cyber-elevated/30 p-3 text-center font-mono text-[11px] leading-relaxed text-cyber-muted sm:mt-8 sm:p-4 sm:text-xs">
        {t("bl.footer")}
      </div>
    </div>
  );
}
