import { useState, useEffect, useRef, type FormEvent } from "react";
import { supabase, hasSupabase, AUTH_ENABLED } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { useToastStore } from "@/store/useToastStore";
import { useT } from "@/i18n/useI18n";
import { mapDbError } from "@/lib/auth-utils";
import { X, AlertTriangle, CheckCircle2 } from "lucide-react";

interface Props {
  siteId: string;
  siteName: string;
  isOpen: boolean;
  onClose: () => void;
}

const ISSUE_TYPES: { value: string; i18nKey: string }[] = [
  { value: "down", i18nKey: "report.issueTypes.down" },
  { value: "ssl", i18nKey: "report.issueTypes.ssl" },
  { value: "hijacked", i18nKey: "report.issueTypes.hijacked" },
  { value: "wrong_info", i18nKey: "report.issueTypes.wrong_info" },
  { value: "other", i18nKey: "report.issueTypes.other" },
];

export default function ReportModal({ siteId, siteName, isOpen, onClose }: Props) {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const toast = useToastStore();

  const [issueType, setIssueType] = useState("down");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 关闭时重置表单
  useEffect(() => {
    if (!isOpen) {
      setIssueType("down");
      setDescription("");
      setContact("");
      setError("");
      setSubmitting(false);
      setSuccess(false);
    }
  }, [isOpen]);

  // Escape 关闭 + 锁定背景滚动（保存/恢复原值，兼容嵌套弹窗）
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  // 成功后自动关闭的计时器卸载时清理，避免操作已卸载组件
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // 认证开启时，未登录 → 弹出登录框；灰度关闭时允许匿名提交
    if (AUTH_ENABLED && !user) {
      openAuthModal();
      return;
    }

    if (!hasSupabase || !supabase) {
      setError(t("auth.unavailable"));
      return;
    }

    setSubmitting(true);
    try {
      const { error: err } = await supabase.from("site_reports").insert({
        site_id: siteId,
        issue_type: issueType,
        description,
        reporter_email: user?.email ?? "",
        reporter_contact: contact || null,
      });
      if (err) {
        setError(mapDbError(err, t));
        toast.error(t("toast.report.error"));
      } else {
        setSuccess(true);
        toast.success(t("toast.report.success"));
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        closeTimerRef.current = setTimeout(() => onClose(), 3000);
      }
    } catch {
      setError(t("auth.unexpectedError"));
      toast.error(t("toast.report.error"));
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        onClick={onClose}
        className="absolute inset-0 bg-cyber-bg/80 backdrop-blur-sm"
        aria-label={t("drawer.close")}
      />

      <div className="relative w-full max-w-sm rounded-2xl border border-cyber-border bg-cyber-surface p-6 shadow-2xl animate-slide-up">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-cyber-muted transition-colors hover:text-cyber-text"
          aria-label={t("drawer.close")}
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="mb-1 font-display text-xl font-bold text-cyber-text">
          {t("report.title")}
        </h2>

        {/* 成功提示 */}
        {success && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-cyber-live/30 bg-cyber-live/10 px-3 py-2 text-sm text-cyber-live">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{t("report.success")}</span>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-cyber-dead/30 bg-cyber-dead/10 px-3 py-2 text-sm text-cyber-dead">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            {/* 站点名称（只读） */}
            <div>
              <label className="mb-1 block font-mono text-[11px] text-cyber-muted">
                {t("report.siteLabel")}
              </label>
              <input
                type="text"
                value={siteName}
                readOnly
                className="w-full rounded-lg border border-cyber-border bg-cyber-bg/50 px-3 py-2 text-sm text-cyber-muted cursor-not-allowed"
              />
            </div>

            {/* 问题类型 */}
            <div>
              <label className="mb-1 block font-mono text-[11px] text-cyber-muted">
                {t("report.issueType")}
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full rounded-lg border border-cyber-border bg-cyber-bg px-3 py-2 text-sm text-cyber-text focus:border-cyber-cyan/50 focus:outline-none"
              >
                {ISSUE_TYPES.map((it) => (
                  <option key={it.value} value={it.value}>
                    {t(it.i18nKey)}
                  </option>
                ))}
              </select>
            </div>

            {/* 详细描述 */}
            <div>
              <label className="mb-1 block font-mono text-[11px] text-cyber-muted">
                {t("report.description")}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder={t("report.descPlaceholder")}
                className="w-full rounded-lg border border-cyber-border bg-cyber-bg px-3 py-2 text-sm text-cyber-text placeholder:text-cyber-muted/50 focus:border-cyber-cyan/50 focus:outline-none resize-none"
              />
            </div>

            {/* 联系方式 */}
            <div>
              <label className="mb-1 block font-mono text-[11px] text-cyber-muted">
                {t("report.contactLabel")}
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                maxLength={200}
                placeholder={user?.email ?? "you@example.com"}
                className="w-full rounded-lg border border-cyber-border bg-cyber-bg px-3 py-2 text-sm text-cyber-text placeholder:text-cyber-muted/50 focus:border-cyber-cyan/50 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-cyber-cyan py-2.5 text-sm font-semibold text-cyber-bg transition-all hover:shadow-glow-cyan disabled:opacity-50"
            >
              {submitting ? t("auth.submitting") : t("report.submit")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
