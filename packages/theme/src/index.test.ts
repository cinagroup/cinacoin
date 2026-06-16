import { describe, it, expect } from 'vitest';

describe('@cinacoin/theme', () => {
  it('should export useTheme hook', async () => {
    const mod = await import('./index');
    expect(mod.useTheme).toBeDefined();
    expect(typeof mod.useTheme).toBe('function');
  });

  it('should export ThemeProvider component', async () => {
    const mod = await import('./index');
    expect(mod.ThemeProvider).toBeDefined();
  });

  it('should export auto-theme utilities', async () => {
    const { generateAutoThemeCSS, getSystemColorScheme, prefersDarkMode } = await import('./auto-theme');
    expect(typeof generateAutoThemeCSS).toBe('function');
    expect(typeof getSystemColorScheme).toBe('function');
    expect(typeof prefersDarkMode).toBe('function');
  });

  it('should export theme context hook', async () => {
    const mod = await import('./index');
    expect(mod.useThemeContext).toBeDefined();
  });
});
