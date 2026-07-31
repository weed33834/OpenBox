import type { Lang } from "@/i18n/translations";

const LOCALE_MAP: Record<Lang, string> = {
  zh: "zh-CN",
  en: "en-US",
  ja: "ja-JP",
};

/**
 * 将 i18n lang 代码映射到 BCP 47 locale 标签。
 */
export function langToLocale(lang: Lang): string {
  return LOCALE_MAP[lang] ?? "en-US";
}

/**
 * 格式化日期（仅日期部分）。
 */
export function formatDate(date: Date | string | number, lang: Lang): string {
  const d = typeof date === "object" ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(langToLocale(lang), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * 格式化日期时间。
 */
export function formatDateTime(date: Date | string | number, lang: Lang): string {
  const d = typeof date === "object" ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString(langToLocale(lang), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
