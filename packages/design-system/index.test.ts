import { describe, it, expect } from 'vitest';

describe('@cinacoin/design-system', () => {
  it('should export design tokens', async () => {
    const tokens = await import('./tokens.js');
    expect(tokens).toBeDefined();
  });

  it('should export theme presets', async () => {
    const presets = await import('./presets.js');
    expect(presets).toBeDefined();
  });

  it('should export dark theme preset', async () => {
    const { darkTheme } = await import('./presets.js');
    expect(darkTheme).toBeDefined();
  });

  it('should export light theme preset', async () => {
    const { lightTheme } = await import('./presets.js');
    expect(lightTheme).toBeDefined();
  });

  it('should export RTL utilities', async () => {
    const rtl = await import('./rtl.js');
    expect(rtl).toBeDefined();
  });
});
