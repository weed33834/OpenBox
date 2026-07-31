#!/usr/bin/env node
/**
 * 从 src/data/sites.ts 提取站点清单并输出为 JSON。
 *
 * 用法：
 *   node scripts/export-sites.mjs              # 输出到 api/sites.json
 *   node scripts/export-sites.mjs /tmp/x.json  # 输出到指定路径
 *
 * 依赖：无外部依赖，仅用 Node 内置模块。
 * 原理：读取 sites.ts 源码，用括号匹配提取 sites 数组，eval 解析。
 *       这是开发脚本，eval 的数据来自受版本控制的源码，安全性可接受。
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const tsPath = resolve(__dirname, "../src/data/sites.ts");
const outPath = process.argv[2] || resolve(__dirname, "../api/sites.json");

const source = readFileSync(tsPath, "utf-8");

// 定位 `export const sites` 的起始位置
const declMatch = source.match(/export\s+const\s+sites\s*(?::\s*[^\]=]+)?\s*=\s*/);
if (!declMatch) {
  console.error("错误：无法在 src/data/sites.ts 中找到 sites 导出");
  process.exit(1);
}

const arrStart = source.indexOf("[", declMatch.index + declMatch[0].length);

// 括号匹配：找到 sites 数组的闭合 ]
let depth = 0;
let inString = false;
let stringChar = "";
let arrEnd = -1;

for (let i = arrStart; i < source.length; i++) {
  const ch = source[i];
  const prev = source[i - 1];

  // 处理字符串内的括号（跳过转义字符）
  if (inString) {
    if (ch === "\\") { i++; continue; }
    if (ch === stringChar) inString = false;
    continue;
  }

  if (ch === '"' || ch === "'" || ch === "`") {
    inString = true;
    stringChar = ch;
    continue;
  }

  if (ch === "[") depth++;
  else if (ch === "]") {
    depth--;
    if (depth === 0) { arrEnd = i; break; }
  }
}

if (arrEnd === -1) {
  console.error("错误：无法找到 sites 数组的闭合 ]");
  process.exit(1);
}

const arrLiteral = source.slice(arrStart, arrEnd + 1);

// 使用 eval 解析数组字面量（开发脚本，数据来自受控源码）
let sites;
try {
  sites = eval(arrLiteral);
} catch (e) {
  console.error("错误：解析 sites 数组失败:", e.message);
  process.exit(1);
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(sites, null, 2));
console.log(`已导出 ${sites.length} 个站点到 ${outPath}`);
