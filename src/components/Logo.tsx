import { navigate } from '@/hooks/useHashRoute';

export function Logo() {
  return (
    <a
      href="#/home"
      onClick={(e) => {
        e.preventDefault();
        navigate('/home');
      }}
      className="flex items-center gap-2 font-semibold"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-fg)] font-bold">
        O
      </span>
      <span className="text-lg tracking-tight text-[var(--color-fg)]">OpenBox</span>
    </a>
  );
}
