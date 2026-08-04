import type { SubType } from '@/lib/types';
import { useLocalize } from '@/i18n/useI18n';
import { navigate } from '@/hooks/useHashRoute';
import { Icon } from './Icon';

/** 子类型卡片：用于分类页与首页「全部分类」场景树，点击进入 #/category/:slug */
export function CategoryCard({ subType, count }: { subType: SubType; count?: number }) {
  const localize = useLocalize();
  return (
    <button
      onClick={() => navigate(`/category/${subType.slug}`)}
      className="card card-hover group flex flex-col gap-3 p-5 text-left"
    >
      <div className="flex items-center justify-between">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ background: `${subType.color}1a`, color: subType.color }}
        >
          <Icon name={subType.icon} size={22} />
        </span>
        {count !== undefined && <span className="text-sm text-[var(--color-muted)]">{count}</span>}
      </div>
      <div>
        <h3 className="font-semibold text-[var(--color-fg)]">{localize(subType.name)}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-[var(--color-muted)]">{localize(subType.description)}</p>
      </div>
    </button>
  );
}
