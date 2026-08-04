import { create } from 'zustand';
import { dict, type Lang } from './translations';
import type { LocalizedText } from '@/lib/types';

interface I18nState {
  lang: Lang;
  setLang: (l: Lang) => void;
}

function initLang(): Lang {
  if (typeof window === 'undefined') return 'zh';
  const saved = localStorage.getItem('ob_lang');
  return saved === 'en' || saved === 'ja' ? saved : 'zh';
}

export const useI18nStore = create<I18nState>((set) => ({
  lang: initLang(),
  setLang: (lang) => {
    localStorage.setItem('ob_lang', lang);
    set({ lang });
  },
}));

/** 支持的语言列表（LangSwitcher 循环切换用） */
export const LANGS: Lang[] = ['zh', 'en', 'ja'];

/** 返回绑定当前语言的翻译函数（语言切换时组件会重新渲染） */
export function useT(): (key: string) => string {
  const lang = useI18nStore((s) => s.lang);
  return (key: string) => dict[lang][key] ?? dict.zh[key] ?? key;
}

/** 将 LocalizedText（分类/场景名）解析为当前语言文本 */
export function localize(text: LocalizedText, lang: Lang): string {
  return text[lang] ?? text.zh;
}

/** 绑定当前语言的 localize，组件内直接 localize(name) 即可 */
export function useLocalize(): (text: LocalizedText) => string {
  const lang = useI18nStore((s) => s.lang);
  return (text: LocalizedText) => localize(text, lang);
}
