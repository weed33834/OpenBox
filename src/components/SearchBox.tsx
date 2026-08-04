import { useState } from 'react';
import { useT } from '@/i18n/useI18n';
import { navigate } from '@/hooks/useHashRoute';
import { Icon } from './Icon';

export function SearchBox({
  initial = '',
  autoFocus = false,
  big = false,
}: {
  initial?: string;
  autoFocus?: boolean;
  big?: boolean;
}) {
  const t = useT();
  const [q, setQ] = useState(initial);

  const submit = () => {
    const term = q.trim();
    navigate(term ? `/search?q=${encodeURIComponent(term)}` : '/search');
  };

  return (
    <form
      className={big ? 'card flex items-center gap-2 p-2' : 'flex items-center gap-2'}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="relative flex-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
          <Icon name="Search" size={18} />
        </span>
        <input
          className="input pl-9"
          placeholder={t('home.searchPlaceholder')}
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <button className="btn btn-primary btn-sm" type="submit">
        {t('common.search')}
      </button>
    </form>
  );
}
