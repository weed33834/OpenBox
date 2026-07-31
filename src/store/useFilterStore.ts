import { create } from "zustand";
import { useMemo } from "react";
import type { Category, Site, SiteType, Status } from "@/data/sites";
import { sites as ALL_SITES } from "@/data/sites";
import { CAT_ORDER } from "@/lib/constants";

export type SortKey = "default" | "name" | "status";
export type LiveStatus = "checking" | "up" | "down" | "unknown";

interface FilterState {
  // 筛选
  keyword: string;
  category: Category | "all";
  type: SiteType | "all";
  status: Status | "all";
  model: string;
  onlyApi: boolean;
  sort: SortKey;

  // 详情抽屉
  selectedId: string | null;

  // 实时探测
  liveStatus: Record<string, LiveStatus>; // id -> 实时状态
  liveProgress: { checked: number; total: number };
  lastCheckedAt: number | null; // 上次完成检测的时间戳

  // actions
  setKeyword: (v: string) => void;
  setCategory: (c: Category | "all") => void;
  setType: (t: SiteType | "all") => void;
  setStatus: (s: Status | "all") => void;
  setModel: (m: string) => void;
  setOnlyApi: (v: boolean) => void;
  setSort: (s: SortKey) => void;
  setSelectedId: (id: string | null) => void;
  setLiveStatus: (id: string, s: LiveStatus) => void;
  setLiveProgress: (p: { checked: number; total: number }) => void;
  setLastCheckedAt: (ts: number | null) => void;
  reset: () => void;
}

const initialFilter = {
  keyword: "",
  category: "all" as Category | "all",
  type: "all" as SiteType | "all",
  status: "all" as Status | "all",
  model: "",
  onlyApi: false,
  sort: "default" as SortKey,
  selectedId: null as string | null,
};

export const useFilterStore = create<FilterState>((set) => ({
  ...initialFilter,
  liveStatus: {},
  liveProgress: { checked: 0, total: 0 },
  lastCheckedAt: null,
  setKeyword: (v) => set({ keyword: v }),
  setCategory: (c) => set({ category: c }),
  setType: (t) => set({ type: t }),
  setStatus: (s) => set({ status: s }),
  setModel: (m) => set({ model: m }),
  setOnlyApi: (v) => set({ onlyApi: v }),
  setSort: (s) => set({ sort: s }),
  setSelectedId: (id) => set({ selectedId: id }),
  setLiveStatus: (id, s) =>
    set((state) => ({ liveStatus: { ...state.liveStatus, [id]: s } })),
  setLiveProgress: (p) => set({ liveProgress: p }),
  setLastCheckedAt: (ts) => set({ lastCheckedAt: ts }),
  reset: () => set({ ...initialFilter }),
}));

// ===== 模块级常量：分类计数（不依赖 state，只算一次） =====
export const CATEGORY_COUNTS: Record<Category | "all", number> = (() => {
  const counts: Record<Category | "all", number> = {
    all: ALL_SITES.length,
    linuxdo: 0,
    freechat: 0,
    freerelay: 0,
    paidrelay: 0,
    overseas: 0,
    domestic: 0,
    tool: 0,
    blacklist: 0,
  };
  for (const s of ALL_SITES) counts[s.category]++;
  return counts;
})();

// 预构建搜索索引：避免每次过滤时重复拼接字符串
const SEARCH_INDEX: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const s of ALL_SITES) {
    map.set(
      s.id,
      `${s.name} ${s.desc} ${s.url} ${s.note ?? ""} ${s.models.join(" ")}`.toLowerCase(),
    );
  }
  return map;
})();

const STATUS_ORDER: Record<Status, number> = { ok: 0, unstable: 1, unknown: 2, dead: 3 };

// 分类排序权重：基于共享 CAT_ORDER 数组的下标，未收录的分类（如 blacklist）排到最后
const catRank = (c: Category): number => {
  const idx = (CAT_ORDER as readonly Category[]).indexOf(c);
  return idx === -1 ? CAT_ORDER.length : idx;
};

// 单站点筛选判断：useFilteredSites 与 useFilteredCount 共用，避免逻辑分叉
function siteMatches(
  site: Site,
  kw: string,
  modelKw: string,
  category: Category | "all",
  type: SiteType | "all",
  status: Status | "all",
  onlyApi: boolean,
): boolean {
  if (category !== "all" && site.category !== category) return false;
  if (type !== "all" && site.type !== type) return false;
  if (status !== "all" && site.status !== status) return false;
  if (onlyApi && !site.apiBase) return false;

  if (kw) {
    const hay = SEARCH_INDEX.get(site.id);
    if (!hay || !hay.includes(kw)) return false;
  } else if (modelKw) {
    const hay = site.models.join(" ").toLowerCase();
    if (!hay.includes(modelKw)) return false;
  }
  return true;
}

// ===== 派生：当前可见的站点（精确切片订阅 + useMemo，避免 selectedId 变化触发重算） =====
export function useFilteredSites(): Site[] {
  const keyword = useFilterStore((s) => s.keyword);
  const category = useFilterStore((s) => s.category);
  const type = useFilterStore((s) => s.type);
  const status = useFilterStore((s) => s.status);
  const model = useFilterStore((s) => s.model);
  const onlyApi = useFilterStore((s) => s.onlyApi);
  const sort = useFilterStore((s) => s.sort);

  return useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const modelKw = model.trim().toLowerCase();

    const list = ALL_SITES.filter((site) =>
      siteMatches(site, kw, modelKw, category, type, status, onlyApi),
    );

    if (sort === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name, "zh"));
    } else if (sort === "status") {
      list.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
    } else {
      list.sort(
        (a, b) =>
          catRank(a.category) - catRank(b.category) ||
          STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
          a.name.localeCompare(b.name, "zh"),
      );
    }
    return list;
  }, [keyword, category, type, status, model, onlyApi, sort]);
}

// ===== 轻量计数：只返回筛选结果数量，跳过排序与数组构建，供仅需 .length 的场景（如 Toolbar）使用 =====
export function useFilteredCount(): number {
  const keyword = useFilterStore((s) => s.keyword);
  const category = useFilterStore((s) => s.category);
  const type = useFilterStore((s) => s.type);
  const status = useFilterStore((s) => s.status);
  const model = useFilterStore((s) => s.model);
  const onlyApi = useFilterStore((s) => s.onlyApi);

  return useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const modelKw = model.trim().toLowerCase();
    let count = 0;
    for (const site of ALL_SITES) {
      if (siteMatches(site, kw, modelKw, category, type, status, onlyApi)) count++;
    }
    return count;
  }, [keyword, category, type, status, model, onlyApi]);
}
