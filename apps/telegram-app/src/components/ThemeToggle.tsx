import { useTheme } from '../providers/ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        background: 'var(--cc-surface)',
        border: '1px solid var(--cc-border)',
        borderRadius: 'var(--cc-radius-sm)',
        cursor: 'pointer',
        color: 'var(--cc-text)',
        fontSize: 14,
        padding: 0,
      }}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
