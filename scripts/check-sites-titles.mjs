#!/usr/bin/env node
/**
 * 真实检测所有站点：访问 URL，抓取页面标题和状态码
 * 识别"域名转卖/失效/无关页面"等问题站点
 * 用法：node scripts/check-sites-titles.mjs
 */
import { readFileSync } from "node:fs";

const sites = JSON.parse(readFileSync(new URL("../api/sites.json", import.meta.url), "utf-8"));

// 可疑标题关键词（域名转卖、广告、404、默认页）
const SUSPICIOUS = [
  "极省创", "域名出售", "domain for sale", "404", "not found",
  "welcome to nginx", "出售", "domain sale", "test page",
  "iis", "apache", "placeholder", "under construction",
  "buy this domain", "purchase", "广告",
  "for sale", "premium domain", "parked",
];

const results = [];
const CONCURRENCY = 8;

async function check(site) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(site.url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
    });
    clearTimeout(t);
    const text = await res.text();
    const title = (text.match(/<title>([^<]+)/i) || [])[1] || "";
    return { id: site.id, status: res.status, url: site.url, title: title.trim(), ok: true };
  } catch (e) {
    clearTimeout(t);
    return { id: site.id, status: 0, url: site.url, title: "", error: e.message.slice(0, 80), ok: false };
  }
}

async function run() {
  console.log(`正在检测 ${sites.length} 个站点（${CONCURRENCY} 并发，12s 超时）...\n`);

  // 分批并发
  for (let i = 0; i < sites.length; i += CONCURRENCY) {
    const batch = sites.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(check));
    results.push(...batchResults);
    process.stdout.write(`\r进度: ${results.length}/${sites.length}`);
  }
  console.log("\n");

  // 分类输出
  const reachable = results.filter((r) => r.ok && r.status >= 200 && r.status < 400);
  const suspicious = reachable.filter((r) => {
    const low = (r.title || "").toLowerCase();
    return SUSPICIOUS.some((k) => low.includes(k.toLowerCase()));
  });
  const errors = results.filter((r) => !r.ok || r.status >= 400);

  console.log("=== 统计 ===");
  console.log(`可达: ${reachable.length} | 可疑(域名转卖/无关): ${suspicious.length} | 不可达/错误: ${errors.length}`);
  console.log("");

  console.log("=== 可疑站点（200 但标题像域名转卖/广告/404）===");
  for (const r of suspicious) {
    console.log(`  ${r.id.padEnd(22)} [${r.status}] ${r.title.slice(0, 50)}  →  ${r.url}`);
  }
  console.log("");

  console.log("=== HTTP 错误站点（4xx/5xx）===");
  for (const r of errors.filter((e) => e.ok && e.status >= 400)) {
    console.log(`  ${r.id.padEnd(22)} [${r.status}]  →  ${r.url}`);
  }
  console.log("");

  console.log("=== 网络不可达（fetch failed / 超时）===");
  for (const r of results.filter((e) => !e.ok)) {
    console.log(`  ${r.id.padEnd(22)} ${r.error}  →  ${r.url}`);
  }
  console.log("");

  // 输出 TSV 供后续处理
  const { writeFileSync } = await import("node:fs");
  const tsv = results
    .map((r) => `${r.id}\t${r.status}\t${(r.title || r.error || "").slice(0, 60)}\t${r.url}`)
    .join("\n");
  writeFileSync("/tmp/site-titles.tsv", tsv);
  console.log("完整结果: /tmp/site-titles.tsv");
}

run().catch(console.error);
