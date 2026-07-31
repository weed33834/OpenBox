import { memo } from "react";
import { X, CheckCircle2, AlertTriangle, Info, AlertCircle } from "lucide-react";
import { useToastStore, type ToastType } from "@/store/useToastStore";
import { cn } from "@/lib/utils";

const TOAST_CONFIG: Record<ToastType, { icon: typeof Info; color: string; border: string; bg: string }> = {
  success: { icon: CheckCircle2, color: "text-cyber-green", border: "border-cyber-green/40", bg: "bg-cyber-green/10" },
  error: { icon: AlertCircle, color: "text-cyber-dead", border: "border-cyber-dead/40", bg: "bg-cyber-dead/10" },
  warning: { icon: AlertTriangle, color: "text-cyber-amber", border: "border-cyber-amber/40", bg: "bg-cyber-amber/10" },
  info: { icon: Info, color: "text-cyber-cyan", border: "border-cyber-cyan/40", bg: "bg-cyber-cyan/10" },
};

function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const config = TOAST_CONFIG[toast.type];
        const Icon = config.icon;
        return (
          <div
            key={toast.id}
            className={cn(
              "flex items-start gap-2.5 rounded-lg border px-4 py-3 shadow-card backdrop-blur-md animate-slide-up",
              "max-w-[calc(100vw-2rem)] sm:max-w-sm",
              config.border,
              config.bg,
            )}
            role="alert"
          >
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", config.color)} />
            <p className="min-w-0 flex-1 text-sm leading-relaxed text-cyber-text">{toast.message}</p>
            <button
              onClick={() => remove(toast.id)}
              className="shrink-0 rounded p-0.5 text-cyber-muted transition-colors hover:text-cyber-text"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default memo(ToastContainer);
