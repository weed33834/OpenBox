import { useCallback, useEffect, useRef, useState } from "react";
import { sites as ALL_SITES, type Site } from "@/data/sites";
import { useFilterStore, type LiveStatus } from "@/store/useFilterStore";

const CACHE_KEY = "FreeAPI:live-status";
const CACHE_TTL = 60 * 60 * 1000; // 1 小时

// 检测 AbortSignal.timeout 支持（现代浏览器，可省去手动 AbortController + setTimeout）
const supportsTimeoutSignal =
  typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function";

interface CachedEntry {
  s: LiveStatus;
  t: number;
}

function readCache(): Record<string, CachedEntry> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCache(map: Record<string, CachedEntry>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(map));
  } catch {
    /* 忽略 quota 错误 */
  }
}

/**
 * 判断错误是否为超时/中止（兼容 AbortController.abort 与 AbortSignal.timeout 两种抛出方式）。
 */
function isAbortOrTimeoutError(e: unknown): boolean {
  const err = e as { message?: string; name?: string };
  const msg = (err?.message ?? "").toLowerCase();
  const name = err?.name ?? "";
  return (
    msg.includes("abort") ||
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    name === "AbortError" ||
    name === "TimeoutError"
  );
}

/**
 * 带超时的 fetch：支持 AbortSignal.timeout 时优先使用，否则回退到 AbortController + setTimeout。
 * 回退分支保证在返回/抛错时清理定时器。
 */
async function fetchWithTimeout(
  target: string,
  timeout: number,
  init?: RequestInit,
): Promise<Response> {
  if (supportsTimeoutSignal) {
    return fetch(target, { ...init, signal: AbortSignal.timeout(timeout) });
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    return await fetch(target, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 客户端 fetch 探测 API 端点 / 站点首页。
 * 策略：
 *   1. 优先 HEAD {apiBase}/models（6s 超时），2xx/3xx/4xx 算 up，5xx/网络错误算 down
 *   2. 降级 HEAD site.url，同样逻辑
 *   3. CORS 受限时用 no-cors + 超时检测，仅能确认域名网络可达，返回 "unknown"
 *      （no-cors 返回 opaque 响应，无法读取真实 HTTP 状态，不能判定 up/down）
 *
 * 注意：这是纯前端探测，只能确认域名可达性，不等于 API 真正可用。
 */
async function probeWithFetch(
  url: string,
  apiBase?: string,
): Promise<LiveStatus> {
  const doFetch = async (target: string): Promise<LiveStatus> => {
    try {
      const res = await fetchWithTimeout(target, 6000, {
        method: "HEAD",
        redirect: "follow",
      });
      // 2xx/3xx/4xx 均视为可达，5xx 算 down
      return res.status < 500 ? "up" : "down";
    } catch (e: unknown) {
      // 超时算 down
      if (isAbortOrTimeoutError(e)) return "down";
      // CORS / 网络错误 → 尝试 no-cors
      throw e;
    }
  };

  // 第一层：API 端点
  if (apiBase) {
    try {
      return await doFetch(`${apiBase.replace(/\/$/, "")}/models`);
    } catch {
      // API 端点失败，降级到首页
    }
  }

  // 第二层：站点首页
  try {
    return await doFetch(url);
  } catch {
    // CORS 受限 → no-cors 兜底
  }

  // 第三层：no-cors 模式（仅判断 reachable）
  // 注意：no-cors 请求返回的是 opaque 响应，无论服务端实际返回什么 HTTP 状态码，
  // fetch 都不会抛异常且 response.status 恒为 0。因此「请求未抛异常」只能说明域名
  // 网络可达，无法判定服务是否真正可用。为避免把已宕机的站点误报为 "up"，
  // 这里返回 "unknown" 而非 "up"。
  try {
    await fetchWithTimeout(url, 6000, {
      method: "HEAD",
      mode: "no-cors",
      redirect: "follow",
    });
    return "unknown";
  } catch {
    return "down";
  }
}

/**
 * 站点实时健康检测 hook（客户端 fetch 端点探测）。
 * 首屏读 localStorage 缓存秒出，后台分批增量更新。
 */
export function useSiteHealth() {
  const setLiveStatus = useFilterStore((s) => s.setLiveStatus);
  const setLiveProgress = useFilterStore((s) => s.setLiveProgress);
  const setLastCheckedAt = useFilterStore((s) => s.setLastCheckedAt);
  const lastCheckedAt = useFilterStore((s) => s.lastCheckedAt);
  const running = useRef(false);
  // 收集所有 setTimeout 句柄，在卸载时统一清理，避免组件销毁后仍触发批次
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (running.current) return;
    running.current = true;

    const cache = readCache();
    const now = Date.now();
    const fresh = now - (lastCheckedAt ?? 0) < CACHE_TTL;

    // 1. 先用缓存立即填充
    for (const site of ALL_SITES) {
      const entry = cache[site.id];
      if (entry && now - entry.t < CACHE_TTL) {
        setLiveStatus(site.id, entry.s);
      } else {
        setLiveStatus(site.id, "checking");
      }
    }

    // 2. 缓存仍新鲜则不重复探测
    if (fresh) {
      running.current = false;
      return;
    }

    // 3. 分批探测：每批 8 个，批间隔 300ms
    const BATCH = 8;
    const BATCH_DELAY = 300;
    let checked = 0;
    setLiveProgress({ checked: 0, total: ALL_SITES.length });
    const newCache: Record<string, CachedEntry> = { ...cache };

    const runBatch = (start: number) => {
      const slice = ALL_SITES.slice(start, start + BATCH);
      Promise.all(
        slice.map(async (site) => {
          const s = await probeWithFetch(site.url, site.apiBase);
          setLiveStatus(site.id, s);
          newCache[site.id] = { s, t: Date.now() };
          checked++;
          setLiveProgress({ checked, total: ALL_SITES.length });
          return s;
        }),
      ).then(() => {
        // 已中止（卸载/重测）则不再调度后续批次
        if (!running.current) return;
        if (start + BATCH < ALL_SITES.length) {
          timers.current.push(setTimeout(() => runBatch(start + BATCH), BATCH_DELAY));
        } else {
          writeCache(newCache);
          setLastCheckedAt(Date.now());
          running.current = false;
        }
      });
    };

    // 错开首屏，避免和渲染抢主线程
    timers.current.push(setTimeout(() => runBatch(0), 800));

    return () => {
      running.current = false;
      // 清理所有挂起的批次定时器，防止卸载后继续探测/写状态
      timers.current.forEach((t) => clearTimeout(t));
      timers.current = [];
    };
  }, [setLiveStatus, setLiveProgress, setLastCheckedAt, lastCheckedAt]);
}

/**
 * 手动触发重新检测。
 */
export function useRecheckHealth() {
  return () => {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch {
      /* ignore */
    }
    useFilterStore.setState({
      liveStatus: {},
      liveProgress: { checked: 0, total: ALL_SITES.length },
      lastCheckedAt: null,
    });
  };
}

// ===== 深度健康检测：手动触发，实际调用 API 端点验证可用性 =====

/** 深度检测结果：包含 HTTP 状态码、延迟等详细信息。 */
export interface DeepCheckResult {
  status: "up" | "down" | "unknown";
  httpStatus?: number;
  message: string;
  latency?: number;
}

/**
 * 深度健康检测 hook —— 手动触发，通过实际请求 API 端点来验证其真正可用性。
 *
 * 检测流程：
 *   1. 若站点无 apiBase，直接返回 unknown（无 API 端点可测）
 *   2. 先以 HEAD {apiBase}/models（8s 超时）轻量探测
 *      - 2xx/3xx/4xx → up；5xx → down；超时 → down；CORS → no-cors → unknown
 *   3. 若 HEAD 未确认 up，再以 POST {apiBase}/chat/completions（10s 超时）发送最小请求体
 *      - 状态判定逻辑同上
 *
 * CORS 受限时 no-cors 返回 opaque 响应，无法读取真实 HTTP 状态，统一返回 unknown。
 *
 * @returns { checkSite, isChecking, result }
 *   - checkSite: (site: Site) => Promise<DeepCheckResult>  手动触发检测
 *   - isChecking: boolean                                   是否正在检测中
 *   - result: DeepCheckResult | null                        最近一次检测结果
 */
export function useDeepHealthCheck() {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<DeepCheckResult | null>(null);

  /**
   * no-cors 兜底：仅用于探测域名网络可达性。
   * no-cors 模式仅允许 simple 请求头，故不携带自定义头与请求体。
   * opaque 响应无法读取 HTTP 状态，故返回 unknown；请求抛异常则返回 down。
   */
  const noCorsFallback = useCallback(
    async (target: string, method: string, timeout: number): Promise<DeepCheckResult> => {
      const start = Date.now();
      try {
        await fetchWithTimeout(target, timeout, {
          method,
          mode: "no-cors",
          redirect: "follow",
        });
        // opaque 响应：无法读取真实 HTTP 状态，无法判定 up/down
        return {
          status: "unknown",
          latency: Date.now() - start,
          message: "CORS blocked the response; unable to determine actual status",
        };
      } catch {
        return { status: "down", message: "Network request failed" };
      }
    },
    [],
  );

  /**
   * 发起单次请求并按 HTTP 状态码判定结果。
   * - 2xx/3xx/4xx → up（端点可达且响应正常）
   * - 5xx → down（服务端错误）
   * - 超时 → down
   * - CORS / 网络错误 → no-cors 兜底探测可达性
   */
  const tryRequest = useCallback(
    async (
      target: string,
      init: RequestInit,
      timeout: number,
    ): Promise<DeepCheckResult> => {
      const start = Date.now();
      try {
        const res = await fetchWithTimeout(target, timeout, init);
        const latency = Date.now() - start;
        if (res.status < 500) {
          return {
            status: "up",
            httpStatus: res.status,
            latency,
            message: `HTTP ${res.status}`,
          };
        }
        return {
          status: "down",
          httpStatus: res.status,
          latency,
          message: `Server error ${res.status}`,
        };
      } catch (e: unknown) {
        // 超时 → down
        if (isAbortOrTimeoutError(e)) {
          return { status: "down", latency: Date.now() - start, message: "Timeout" };
        }
        // CORS / 网络错误 → no-cors 兜底探测可达性
        return noCorsFallback(target, init.method ?? "HEAD", timeout);
      }
    },
    [noCorsFallback],
  );

  const checkSite = useCallback(
    async (site: Site): Promise<DeepCheckResult> => {
      // 1. 无 API 端点，无法深度检测
      if (!site.apiBase) {
        const r: DeepCheckResult = {
          status: "unknown",
          message: "No API endpoint",
        };
        setResult(r);
        return r;
      }

      setIsChecking(true);
      const base = site.apiBase.replace(/\/$/, "");

      try {
        // 2. HEAD {apiBase}/models（8s 超时）—— 轻量探测
        const headResult = await tryRequest(
          `${base}/models`,
          { method: "HEAD", redirect: "follow" },
          8000,
        );

        // HEAD 确认 up 则直接返回，无需继续
        if (headResult.status === "up") {
          setResult(headResult);
          return headResult;
        }

        // 3. HEAD 未确认 up，降级 POST {apiBase}/chat/completions（10s 超时）
        //    发送最小请求体，验证 API 是否真正能处理对话请求
        const model = site.models[0] ?? "gpt-3.5-turbo";
        const body = JSON.stringify({
          model,
          messages: [{ role: "user", content: "hi" }],
          max_tokens: 1,
          stream: false,
        });
        const postResult = await tryRequest(
          `${base}/chat/completions`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            redirect: "follow",
          },
          10000,
        );

        setResult(postResult);
        return postResult;
      } finally {
        setIsChecking(false);
      }
    },
    [tryRequest],
  );

  return { checkSite, isChecking, result };
}
