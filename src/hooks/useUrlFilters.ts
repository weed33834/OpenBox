import { useEffect, useRef } from "react";
import { useFilterStore } from "@/store/useFilterStore";
import type { Category, SiteType, Status } from "@/data/sites";

// URL hash 参数白名单：非法值会被忽略，避免任意写入污染筛选状态
const VALID_CATEGORIES: ReadonlySet<Category> = new Set<Category>([
  "linuxdo",
  "freechat",
  "freerelay",
  "paidrelay",
  "overseas",
  "domestic",
  "tool",
  "blacklist",
]);
const VALID_TYPES: ReadonlySet<SiteType> = new Set<SiteType>(["free", "paid", "freemium"]);
const VALID_STATUSES: ReadonlySet<Status> = new Set<Status>([
  "ok",
  "unstable",
  "dead",
  "unknown",
]);

const DEBOUNCE_MS = 300;

/** 从 location.hash 中解析查询参数，兼容 #/?a=1&b=2 与 #/ 无参数两种形态 */
function parseHashParams(): URLSearchParams {
  const hash = window.location.hash;
  const qIdx = hash.indexOf("?");
  if (qIdx === -1) return new URLSearchParams();
  return new URLSearchParams(hash.slice(qIdx + 1));
}

/** 将当前筛选状态序列化为 hash 并回写 URL（replaceState 不产生历史记录，避免触发 hashchange 路由） */
function writeHash() {
  const { keyword, category, type, status, model, onlyApi } = useFilterStore.getState();
  const sp = new URLSearchParams();
  if (keyword) sp.set("kw", keyword);
  if (category !== "all") sp.set("cat", category);
  if (type !== "all") sp.set("type", type);
  if (status !== "all") sp.set("status", status);
  if (model) sp.set("model", model);
  if (onlyApi) sp.set("api", "1");
  const str = sp.toString();
  const next = str ? `#/?${str}` : "#/";
  if (window.location.hash !== next) {
    window.history.replaceState(null, "", next);
  }
}

/**
 * 双向同步筛选状态与 URL hash：
 * - 挂载时解析 URL hash（如 #/?cat=linuxdo&type=free&kw=gpt&model=claude&status=ok&api=1）并应用到 store
 * - 筛选字段变化时，防抖 300ms 回写 URL hash（便于分享/收藏）
 */
export function useUrlFilters() {
  const initializedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 挂载时：URL hash -> store（仅执行一次）
  useEffect(() => {
    const sp = parseHashParams();

    const cat = sp.get("cat");
    if (cat && VALID_CATEGORIES.has(cat as Category)) {
      useFilterStore.getState().setCategory(cat as Category);
    }
    const type = sp.get("type");
    if (type && VALID_TYPES.has(type as SiteType)) {
      useFilterStore.getState().setType(type as SiteType);
    }
    const status = sp.get("status");
    if (status && VALID_STATUSES.has(status as Status)) {
      useFilterStore.getState().setStatus(status as Status);
    }
    const kw = sp.get("kw");
    if (kw) useFilterStore.getState().setKeyword(kw);
    const model = sp.get("model");
    if (model) useFilterStore.getState().setModel(model);
    const api = sp.get("api");
    if (api === "1") useFilterStore.getState().setOnlyApi(true);

    initializedRef.current = true;

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // 订阅 store 变化 -> 防抖回写 URL（初始化完成前不回写，避免覆盖 URL）
  useEffect(() => {
    const unsub = useFilterStore.subscribe((state, prev) => {
      if (!initializedRef.current) return;
      if (
        state.keyword === prev.keyword &&
        state.category === prev.category &&
        state.type === prev.type &&
        state.status === prev.status &&
        state.model === prev.model &&
        state.onlyApi === prev.onlyApi
      ) {
        return;
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(writeHash, DEBOUNCE_MS);
    });
    return unsub;
  }, []);
}
