import { describe, it, expect } from 'vitest';

import { CINACOIN_COLORS, getThemeVariables, CINACOIN_THEME } from '../src/theme';

describe('Cinacoin Theme', () => {
  it('should define brand colors', () => {
    expect(CINACOIN_COLORS.primary).toBe('#0066FF');
    expect(CINACOIN_COLORS.accent).toBe('#00D4FF');
  });

  it('should return light theme variables', () => {
    const lightTheme = getThemeVariables('light');
    expect(lightTheme['--w3m-color-mix']).toBe(CINACOIN_COLORS.primary);
    expect(lightTheme['--w3m-background']).toBe(CINACOIN_COLORS.background.light);
  });

  it('should return dark theme variables', () => {
    const darkTheme = getThemeVariables('dark');
    expect(darkTheme['--w3m-color-mix']).toBe(CINACOIN_COLORS.primary);
    expect(darkTheme['--w3m-background']).toBe(CINACOIN_COLORS.background.dark);
  });

  it('should have complete theme configuration', () => {
    expect(CINACOIN_THEME.light).toBeDefined();
    expect(CINACOIN_THEME.dark).toBeDefined();
    expect(CINACOIN_THEME.light['--w3m-font-family']).toBeDefined();
  });
});
