// 轻量 i18n：zustand store + useT hook，持久化到 localStorage
import { useCallback } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { translations, format, type Lang } from "./translations";

interface I18nState {
  lang: Lang;
  setLang: (l: Lang) => void;
}

export const useI18n = create<I18nState>()(
  persist(
    (set) => ({
      lang: "zh",
      setLang: (l) => set({ lang: l }),
    }),
    {
      name: "FreeAPI-lang",
      // 只持久化语言偏好
      partialize: (s) => ({ lang: s.lang }),
    },
  ),
);

// 从 URL 参数读取语言偏好（支持 ?lang=en / ?lang=ja）
function getLangFromUrl(): Lang | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const lang = params.get("lang");
  if (lang === "zh" || lang === "en" || lang === "ja") return lang;
  return null;
}

// 初始化：URL 参数优先于 localStorage
const initialLang = getLangFromUrl();
if (initialLang) {
  useI18n.getState().setLang(initialLang);
}

/**
 * 翻译 hook：const t = useT(); t("hero.title")
 * 支持模板变量：t("hero.subtitle", { total: 200 })
 * 缺失键回退到中文，再回退到键本身
 */
export function useT() {
  const lang = useI18n((s) => s.lang);
  // 用 useCallback 稳定翻译函数引用，避免依赖 useT 的组件因每次渲染拿到新函数而重渲染
  return useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const entry = translations[key];
      if (!entry) return key;
      const text = entry[lang] ?? entry.zh ?? key;
      return vars ? format(text, vars) : text;
    },
    [lang],
  );
}

/** 非 hook 版本：用于无法调用 hook 的场景（极少用） */
export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const entry = translations[key];
  if (!entry) return key;
  const text = entry[lang] ?? entry.zh ?? key;
  return vars ? format(text, vars) : text;
}

/** 特点标签翻译：feat.<中文标签>，只调用一次 translate 并比较回退 */
export function translateFeature(lang: Lang, feature: string): string {
  const key = `feat.${feature}`;
  const translated = translate(lang, key);
  return translated === key ? feature : translated;
}
