import { useToastStore } from '@/store/useToastStore';
import { Icon } from './Icon';

const COLORS: Record<string, string> = {
  info: 'var(--color-primary)',
  success: '#10b981',
  error: '#ef4444',
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => remove(t.id)}
          className="pointer-events-auto flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium shadow-[var(--shadow-card)]"
          style={{ color: COLORS[t.type] }}
        >
          <Icon name={t.type === 'error' ? 'AlertTriangle' : t.type === 'success' ? 'Check' : 'Info'} size={16} />
          <span className="text-[var(--color-fg)]">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
