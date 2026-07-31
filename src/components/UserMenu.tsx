import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useT } from "@/i18n/useI18n";
import { deriveUserDisplay } from "@/hooks/useUserProfile";
import { LogOut, User as UserIcon } from "lucide-react";

export default function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const t = useT();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  if (!user) return null;

  const { avatarUrl, email, username } = deriveUserDisplay(user);

  return (
    <div ref={ref} className="relative z-50">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-cyber-border bg-cyber-surface/60 px-2 py-1.5 transition-all hover:border-cyber-cyan/40"
        aria-label={t("auth.userMenu")}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-5 w-5 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyber-cyan/20 text-[10px] font-bold text-cyber-cyan">
            {username.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="hidden max-w-[100px] truncate font-mono text-[11px] text-cyber-text/80 sm:inline">
          {username}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-cyber-border bg-cyber-surface shadow-card animate-slide-up">
          <div className="border-b border-cyber-border px-4 py-3">
            <div className="flex items-center gap-2">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-8 w-8 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyber-cyan/20 font-mono text-sm font-bold text-cyber-cyan">
                  <UserIcon className="h-4 w-4" />
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-cyber-text">{username}</p>
                <p className="truncate font-mono text-[11px] text-cyber-muted">{email}</p>
              </div>
            </div>
          </div>
          <a
            href="#/me"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-cyber-muted transition-colors hover:bg-cyber-elevated hover:text-cyber-cyan"
          >
            <UserIcon className="h-4 w-4" />
            {t("profile.my")}
          </a>
          <button
            onClick={() => {
              signOut();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-cyber-muted transition-colors hover:bg-cyber-dead/10 hover:text-cyber-dead"
          >
            <LogOut className="h-4 w-4" />
            {t("auth.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
