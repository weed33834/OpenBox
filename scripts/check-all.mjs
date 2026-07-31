#!/usr/bin/env node
/**
 * 逐个检测所有站点，区分失效原因：
 * - ssl: SSL 证书错误
 * - timeout: 连接超时
 * - dns: DNS 解析失败
 * - refused: 连接被拒绝
 * - 4xx/5xx: HTTP 错误
 * - hijacked: 域名转卖/劫持（200 但标题可疑）
 * - ok: 正常
 *
 * 用法：
 *   node scripts/check-all.mjs
 *   node scripts/check-all.mjs --timeout 20000 --concurrency 8
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

// 解析命令行参数
const args = process.argv.slice(2);
function parseArg(flag, fallback) {
  const idx = args.indexOf(flag);
  if (idx >= 0 && idx + 1 < args.length) {
    const v = Number(args[idx + 1]);
    if (!isNaN(v)) return v;
  }
  return fallback;
}
const TIMEOUT = parseArg("--timeout", 15000);
const CONCURRENCY = parseArg("--concurrency", 5);

const sites = JSON.parse(
  readFileSync(new URL("../api/sites.json", import.meta.url), "utf-8"),
);

const SUSPICIOUS_TITLES = [
  "极省创",
  "域名出售",
  "domain for sale",
  "404",
  "not found",
  "welcome to nginx",
  "出售",
  "domain sale",
  "test page",
  "apache",
  "placeholder",
  "under construction",
  "buy this domain",
  "purchase",
  "广告",
  "for sale",
  "premium domain",
  "parked",
];

const results = [];

async function check(site) {
  const triedUrls = [];
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);

  // 优先探 apiBase（如果有）
  if (site.apiBase) {
    const apiUrl = `${site.apiBase.replace(/\/$/, "")}/models`;
    triedUrls.push(apiUrl);
    try {
      const apiRes = await fetch(apiUrl, {
        signal: ctrl.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        },
      });
      clearTimeout(t);
      if (apiRes.status < 500) {
        return {
          id: site.id,
          reason: "ok",
          title: `api ${apiRes.status}`,
          url: site.url,
          triedUrls,
        };
      }
    } catch {
      // API 不可达 → 降级
    }
  }

  // 探测首页
  triedUrls.push(site.url);
  const ctrl2 = new AbortController();
  const t2 = setTimeout(() => ctrl2.abort(), TIMEOUT);
  try {
    const res = await fetch(site.url, {
      signal: ctrl2.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
    });
    clearTimeout(t2);
    const text = await res.text();
    const title = (text.match(/<title>([^<]+)/i) || [])[1] || "";
    const low = title.toLowerCase();

    if (SUSPICIOUS_TITLES.some((k) => low.includes(k.toLowerCase()))) {
      return {
        id: site.id,
        reason: "hijacked",
        title: title.trim().slice(0, 60),
        url: site.url,
        triedUrls,
      };
    }

    if (res.status >= 200 && res.status < 400) {
      return {
        id: site.id,
        reason: "ok",
        title: title.trim().slice(0, 60),
        url: site.url,
        triedUrls,
      };
    }
    return {
      id: site.id,
      reason: `http-${res.status}`,
      title: title.trim().slice(0, 60),
      url: site.url,
      triedUrls,
    };
  } catch (e) {
    clearTimeout(t2);
    const msg = e.message || "";
    let reason = "unknown";
    if (
      msg.includes("SSL") ||
      msg.includes("CERT") ||
      msg.includes("cipher") ||
      msg.includes("tls")
    ) {
      reason = "ssl";
    } else if (msg.includes("timed out") || msg.includes("abort")) {
      reason = "timeout";
    } else if (
      msg.includes("ENOTFOUND") ||
      msg.includes("getaddrinfo")
    ) {
      reason = "dns";
    } else if (msg.includes("ECONNREFUSED") || msg.includes("refused")) {
      reason = "refused";
    } else if (msg.includes("fetch failed")) {
      reason = "fetch-failed";
    }
    return {
      id: site.id,
      reason,
      error: msg.slice(0, 80),
      url: site.url,
      triedUrls,
    };
  }
}

async function run() {
  console.log(
    `正在逐个检测 ${sites.length} 个站点（${CONCURRENCY} 并发，${TIMEOUT}ms 超时）...\n`,
  );

  for (let i = 0; i < sites.length; i += CONCURRENCY) {
    const batch = sites.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(check));
    results.push(...batchResults);
    process.stdout.write(`\r进度: ${results.length}/${sites.length}`);
  }
  console.log("\n");

  // 分类统计
  const byReason = {};
  for (const r of results) {
    byReason[r.reason] = (byReason[r.reason] || 0) + 1;
  }

  console.log("=== 状态分布 ===");
  for (const [reason, count] of Object.entries(byReason).sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`  ${reason.padEnd(16)} ${count}`);
  }
  console.log("");

  // 输出各类问题站点
  const problemReasons = ["ssl", "timeout", "dns", "refused", "hijacked"];
  for (const reason of problemReasons) {
    const list = results.filter((r) => r.reason === reason);
    if (list.length === 0) continue;
    console.log(`=== ${reason.toUpperCase()} (${list.length} 个) ===`);
    for (const r of list) {
      const extra =
        r.reason === "hijacked"
          ? ` [${r.title}]`
          : r.error
            ? ` (${r.error})`
            : "";
      console.log(`  ${r.id.padEnd(22)} ${r.url}${extra}`);
    }
    console.log("");
  }

  // HTTP 错误
  const httpErrors = results.filter((r) => r.reason.startsWith("http-"));
  if (httpErrors.length > 0) {
    console.log(`=== HTTP 错误 (${httpErrors.length} 个) ===`);
    for (const r of httpErrors) {
      console.log(`  ${r.id.padEnd(22)} ${r.reason}  ${r.url}`);
    }
    console.log("");
  }

  // fetch-failed（沙箱限制，不确定，附带尝试过的 URL）
  const fetchFailed = results.filter((r) => r.reason === "fetch-failed");
  if (fetchFailed.length > 0) {
    console.log(
      `=== FETCH FAILED / 沙箱不可达 (${fetchFailed.length} 个，需手动验证) ===`,
    );
    for (const r of fetchFailed) {
      const extraUrls =
        r.triedUrls && r.triedUrls.length > 1
          ? ` | tried: ${r.triedUrls.filter((u) => u !== r.url).join(" ")}`
          : "";
      console.log(`  ${r.id.padEnd(22)} ${r.url}${extraUrls}`);
    }
    console.log("");
  }

  // 保存 JSON 到仓库路径（可提交作为历史基准）
  const outDir = resolve(
    import.meta.dirname || dirname(process.argv[1]) || ".",
    "../api",
  );
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, "site-check-result.json");
  writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`完整结果: ${outPath}`);
}

run().catch(console.error);
