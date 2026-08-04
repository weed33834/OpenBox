import { useI18nStore, LANGS } from '@/i18n/useI18n';

const LABEL: Record<string, string> = { zh: '中', en: 'EN', ja: '日' };

export function LangSwitcher() {
  const lang = useI18nStore((s) => s.lang);
  const setLang = useI18nStore((s) => s.setLang);
  const next = LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length];
  return (
    <button
      className="btn btn-ghost btn-sm"
      onClick={() => setLang(next)}
      aria-label="切换语言"
      title={`${LABEL[lang]} → ${LABEL[next]}`}
    >
      {LABEL[lang]}
    </button>
  );
}
