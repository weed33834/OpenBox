import type { ReactNode } from 'react';
import { Icon } from './Icon';

export function EmptyState({ icon = 'Search', title, hint }: { icon?: string; title: string; hint?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
        <Icon name={icon} size={22} />
      </div>
      <p className="font-medium text-[var(--color-fg)]">{title}</p>
      {hint && <p className="mt-1 text-sm text-[var(--color-muted)]">{hint}</p>}
    </div>
  );
}
