import { useThemeStore } from '@/store/useThemeStore';
import { Icon } from './Icon';

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);
  return (
    <button
      className="btn btn-ghost btn-sm"
      onClick={toggle}
      aria-label="切换主题"
      title={theme === 'dark' ? '切换到亮色' : '切换到暗色'}
    >
      <Icon name={theme === 'dark' ? 'Sun' : 'Moon'} size={18} />
    </button>
  );
}
