import { memo, useCallback, useMemo, useState } from "react";
import { PackageX, RotateCcw } from "lucide-react";
import SiteCard from "./SiteCard";
import ReportModal from "@/components/ReportModal";
import { useFilteredSites, useFilterStore } from "@/store/useFilterStore";
import { CATEGORY_META, type Category, type Site } from "@/data/sites";
import { CAT_ORDER } from "@/lib/constants";
import { useT, useI18n, translate } from "@/i18n/useI18n";

function SiteGrid() {
  const sites = useFilteredSites();
  const category = useFilterStore((s) => s.category);
  const reset = useFilterStore((s) => s.reset);
  const t = useT();
  const lang = useI18n((s) => s.lang);

  // 统一的反馈弹窗：由 SiteCard 通过 onReport 触发，避免每张卡片各挂一个 ReportModal
  const [reportSiteId, setReportSiteId] = useState<string | null>(null);
  const handleReport = useCallback((siteId: string) => setReportSiteId(siteId), []);
  const reportSite = reportSiteId ? sites.find((s) => s.id === reportSiteId) ?? null : null;

  // 当筛选为 all 时按分类分组渲染，否则扁平渲染（黑名单站点不显示在主列表）
  const visibleSites = useMemo(() => sites.filter((s) => s.category !== "blacklist"), [sites]);
  const grouped = useMemo(() => {
    if (category !== "all") return null;
    const map = new Map<Category, Site[]>();
    for (const s of visibleSites) {
      if (!map.has(s.category)) map.set(s.category, []);
      map.get(s.category)!.push(s);
    }
    return CAT_ORDER.filter((k) => map.has(k)).map((k) => ({
      key: k,
      items: map.get(k)!,
    }));
  }, [visibleSites, category]);

  // 共享的反馈弹窗实例（受 reportSiteId 控制）
  const reportModal = (
    <ReportModal
      siteId={reportSite?.id ?? ""}
      siteName={reportSite?.name ?? ""}
      isOpen={!!reportSiteId}
      onClose={() => setReportSiteId(null)}
    />
  );

  if (visibleSites.length === 0) {
    return (
      <div className="container py-16 sm:py-24">
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
          <PackageX className="h-14 w-14 text-cyber-muted sm:h-16 sm:w-16" strokeWidth={1.2} />
          <div>
            <h3 className="font-display text-xl font-semibold sm:text-2xl">{t("grid.empty.title")}</h3>
            <p className="mt-2 text-sm text-cyber-muted">{t("grid.empty.desc")}</p>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-lg border border-cyber-cyan/40 bg-cyber-cyan/10 px-4 py-2 font-mono text-sm text-cyber-cyan transition-colors hover:bg-cyber-cyan/20"
          >
            <RotateCcw className="h-4 w-4" />
            {t("grid.empty.action")}
          </button>
        </div>
      </div>
    );
  }

  if (grouped) {
    return (
      <>
        <div className="container py-6 sm:py-8">
          {grouped.map((g) => (
            <section key={g.key} className="mb-8 last:mb-0 sm:mb-10">
              <div className="mb-3 flex items-center gap-2 sm:gap-3">
                <span
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{
                    background: CATEGORY_META[g.key].color,
                    boxShadow: `0 0 8px ${CATEGORY_META[g.key].color}`,
                  }}
                />
                <h2 className="font-display text-base font-semibold text-cyber-text sm:text-lg">
                  {translate(lang, `cat.${g.key}`)}
                </h2>
                <span className="font-mono text-[11px] text-cyber-muted">
                  {g.items.length}
                  <span className="hidden sm:inline"> · {CATEGORY_META[g.key].desc}</span>
                </span>
                <span className="ml-auto h-px flex-1 bg-gradient-to-r from-cyber-border to-transparent" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {g.items.map((site, i) => (
                  <SiteCard key={site.id} site={site} index={i} onReport={handleReport} />
                ))}
              </div>
            </section>
          ))}
        </div>
        {reportModal}
      </>
    );
  }

  return (
    <>
      <div className="container py-6 sm:py-8">
        <div className="mb-3 flex items-center gap-2 sm:gap-3">
          <span
            className="h-3 w-3 shrink-0 rounded-sm"
            style={{
              background: CATEGORY_META[category as Category].color,
              boxShadow: `0 0 8px ${CATEGORY_META[category as Category].color}`,
            }}
          />
          <h2 className="font-display text-base font-semibold text-cyber-text sm:text-lg">
            {translate(lang, `cat.${category as Category}`)}
          </h2>
          <span className="font-mono text-[11px] text-cyber-muted">
            {t("grid.matched", { n: visibleSites.length })}
          </span>
          <span className="ml-auto h-px flex-1 bg-gradient-to-r from-cyber-border to-transparent" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleSites.map((site, i) => (
            <SiteCard key={site.id} site={site} index={i} onReport={handleReport} />
          ))}
        </div>
      </div>
      {reportModal}
    </>
  );
}

export default memo(SiteGrid);
