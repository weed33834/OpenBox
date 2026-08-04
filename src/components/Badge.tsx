import type { ResourceStatus, ResourceType } from '@/lib/types';
import { STATUS_META, TYPE_META } from '@/lib/format';

// 8 位 hex 透明度（6位色 + '1a' ≈ 10%）
const soft = (hex: string) => `${hex}1a`;

export function StatusBadge({ status }: { status: ResourceStatus }) {
  const m = STATUS_META[status];
  return (
    <span className="badge" style={{ color: m.color, background: soft(m.color) }}>
      <span className="status-dot" style={{ background: m.color }} />
      {m.label}
    </span>
  );
}

export function TypeBadge({ type }: { type: ResourceType }) {
  const m = TYPE_META[type];
  return (
    <span className="badge" style={{ color: m.color, background: soft(m.color) }}>
      {m.label}
    </span>
  );
}
