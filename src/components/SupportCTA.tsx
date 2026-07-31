// 站点内的"支持项目"转化带：求 Star / Fork / 提 Issue / 安装到主屏
// 公益 / 开源项目站最该有的入口，之前只有 footer 里一行低调的 GitHub 文字链
import { memo } from "react";
import { Star, Code2, MessageSquare, Smartphone, Check } from "lucide-react";
import { useT } from "@/i18n/useI18n";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { useToastStore } from "@/store/useToastStore";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const GITHUB_REPO = "https://github.com/weed33834/FreeAPI";

interface SupportAction {
  key: string;
  href: string;
  icon: LucideIcon;
  label: string;
  primary?: boolean;
  fill?: boolean;
}

function SupportCTA() {
  const t = useT();
  const { canInstall, install } = usePwaInstall();
  const toast = useToastStore();

  const onInstall = async () => {
    const ok = await install();
    if (ok === false) {
      toast.info(t("support.installHint"));
    }
  };

  const actions: SupportAction[] = [
    {
      key: "star",
      href: GITHUB_REPO,
      icon: Star,
      label: t("support.star"),
      primary: true,
      fill: true,
    },
    {
      key: "fork",
      href: `${GITHUB_REPO}/fork`,
      icon: Code2,
      label: t("support.fork"),
    },
    {
      key: "issue",
      href: `${GITHUB_REPO}/issues`,
      icon: MessageSquare,
      label: t("support.issue"),
    },
  ];

  return (
    <section className="border-t border-cyber-border bg-cyber-surface/30">
      <div className="container py-10">
        <div className="relative overflow-hidden rounded-2xl border border-cyber-cyan/30 bg-gradient-to-br from-cyber-cyan/10 via-cyber-surface to-cyber-magenta/10 p-6 shadow-card sm:p-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyber-cyan/80 to-transparent" />
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyber-cyan/40 bg-cyber-cyan/10 px-3 py-1 font-mono text-[11px] text-cyber-cyan">
              <Star className="h-3.5 w-3.5 fill-cyber-cyan" />
              {t("support.badge")}
            </span>
            <h2 className="font-display text-xl font-bold text-cyber-text sm:text-2xl">
              {t("support.title")}
            </h2>
            <p className="max-w-xl text-sm text-cyber-muted">{t("support.desc")}</p>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-2.5">
              {actions.map((a) => {
                const Icon = a.icon;
                return (
                  <a
                    key={a.key}
                    href={a.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 font-mono text-sm font-semibold transition-all",
                      a.primary
                        ? "border-cyber-cyan/60 bg-cyber-cyan text-cyber-bg hover:shadow-glow-cyan"
                        : "border-cyber-border bg-cyber-surface/70 text-cyber-text hover:border-cyber-cyan/50 hover:text-cyber-cyan",
                    )}
                  >
                    <Icon className={cn("h-4 w-4", a.primary && "fill-cyber-bg")} />
                    {a.label}
                  </a>
                );
              })}

              {canInstall && (
                <button
                  onClick={onInstall}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyber-border bg-cyber-surface/70 px-4 py-2.5 font-mono text-sm font-semibold text-cyber-text transition-all hover:border-cyber-magenta/50 hover:text-cyber-magenta"
                >
                  <Smartphone className="h-4 w-4" />
                  {t("support.install")}
                </button>
              )}
            </div>

            {!canInstall && (
              <p className="flex items-center gap-1.5 font-mono text-[11px] text-cyber-muted/70">
                <Check className="h-3 w-3" />
                {t("support.installedHint")}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(SupportCTA);
