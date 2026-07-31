// 语言切换器：zh / en / ja，紧凑设计适配移动端
import { memo, useEffect } from "react";
import { Globe } from "lucide-react";
import { useI18n, useT } from "@/i18n/useI18n";
import { LANGS, type Lang } from "@/i18n/translations";
import { cn } from "@/lib/utils";

function LangSwitcher() {
  const lang = useI18n((s) => s.lang);
  const setLang = useI18n((s) => s.setLang);
  const t = useT();

  // 同步 <html lang> 属性，便于 SEO 与无障碍
  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : lang;
  }, [lang]);

  return (
    <div
      className="flex items-center gap-0.5 rounded-full border border-cyber-border bg-cyber-surface/60 p-0.5 backdrop-blur"
      role="group"
      aria-label={t("lang.switcher")}
    >
      <Globe className="ml-1.5 mr-0.5 h-3 w-3 shrink-0 text-cyber-muted" aria-hidden />
      {LANGS.map((l) => {
        const active = lang === l.code;
        return (
          <button
            key={l.code}
            onClick={() => setLang(l.code as Lang)}
            aria-pressed={active}
            aria-label={l.label}
            title={l.label}
            className={cn(
              "rounded-full px-2 py-0.5 font-mono text-[11px] font-medium transition-all",
              active
                ? "bg-cyber-cyan/20 text-cyber-cyan"
                : "text-cyber-muted hover:bg-cyber-elevated hover:text-cyber-text",
            )}
          >
            {/* 移动端显示缩写，桌面端显示完整短名 */}
            <span className="sm:hidden">{l.short}</span>
            <span className="hidden sm:inline">{l.code.toUpperCase()}</span>
          </button>
        );
      })}
    </div>
  );
}

export default memo(LangSwitcher);
