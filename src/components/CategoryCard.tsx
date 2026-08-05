import type { SubType } from '@/lib/types';
import { useLocalize } from '@/i18n/useI18n';
import { navigate } from '@/hooks/useHashRoute';
import { Icon } from './Icon';

/** 子类型卡片：用于首页「全部分类」场景树，点击进入 #/category/:slug */
export function CategoryCard({ subType, count }: { subType: SubType; count?: number }) {
  const localize = useLocalize();
  return (
    <button
      onClick={() => navigate(`/category/${subType.slug}`)}
      className="card card-hover group relative overflow-hidden p-4 text-left transition-transform"
    >
      {/* 分类色条（差异化视觉锚点） */}
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: subType.color }} />
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${subType.color}1a`, color: subType.color }}
        >
          <Icon name={subType.icon} size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-[var(--color-fg)]">{localize(subType.name)}</h3>
            {count !== undefined && count > 0 && (
              <span
                className="shrink-0 rounded-md px-1.5 py-0.5 text-xs font-semibold"
                style={{ background: `${subType.color}1a`, color: subType.color }}
              >
                {count}
              </span>
            )}
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-[var(--color-muted)]">
            {localize(subType.description)}
          </p>
        </div>
        <Icon
          name="ChevronRight"
          size={16}
          className="shrink-0 text-[var(--color-muted)] transition-transform group-hover:translate-x-0.5"
        />
      </div>
    </button>
  );
}
