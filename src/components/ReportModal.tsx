import { useState } from 'react';
import { useT } from '@/i18n/useI18n';

export interface ReportModalProps {
  resourceName: string;
  resourceId: string;
  onClose: () => void;
  onSubmit: (resourceId: string, reason: string, note: string) => Promise<boolean>;
}

const REASONS = [
  { key: 'report.dead', label: '资源失效 / 打不开' },
  { key: 'report.wrongUrl', label: '链接指向错误' },
  { key: 'report.inappropriate', label: '内容不当 / 违规' },
  { key: 'report.other', label: '其他问题' },
] as const;

export function ReportModal({ resourceName, resourceId, onClose, onSubmit }: ReportModalProps) {
  const t = useT();
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    setError('');
    const ok = await onSubmit(resourceId, reason, note);
    setSubmitting(false);
    if (ok) {
      setDone(true);
      setTimeout(onClose, 1800);
    } else {
      setError(t('report.fail'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fade-in 0.25s ease-out both' }}
      >
        {done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] text-xl">
              ✓
            </div>
            <p className="font-semibold">{t('report.success')}</p>
            <p className="text-sm text-[var(--color-muted)]">{t('report.thanks')}</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">{t('report.title')}</h3>
              <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
            </div>
            <p className="mb-1 text-sm text-[var(--color-muted)]">{resourceName}</p>

            <div className="mt-3 space-y-2">
              {REASONS.map((r) => (
                <label
                  key={r.key}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    reason === r.key
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-muted)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.key}
                    checked={reason === r.key}
                    onChange={() => setReason(r.key)}
                    className="accent-[var(--color-primary)]"
                  />
                  {t(r.key)}
                </label>
              ))}
            </div>

            {reason && (
              <textarea
                className="input mt-3 min-h-[72px] resize-none text-sm"
                placeholder={t('report.note')}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            )}

            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

            <button
              className="btn btn-primary mt-4 w-full"
              disabled={!reason || submitting}
              onClick={handleSubmit}
            >
              {submitting ? '…' : t('report.submit')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
