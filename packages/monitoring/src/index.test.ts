import { describe, it, expect } from 'vitest';

describe('@cinacoin/monitoring', () => {
  it('should export metrics module', async () => {
    const metrics = await import('./metrics.js');
    expect(metrics).toBeDefined();
  });

  it('should export performance module', async () => {
    const perf = await import('./performance.js');
    expect(perf).toBeDefined();
  });

  it('should export alerts module', async () => {
    const alerts = await import('./alerts.js');
    expect(alerts).toBeDefined();
  });

  it('should export dashboard module', async () => {
    const dashboard = await import('./dashboard.js');
    expect(dashboard).toBeDefined();
  });

  it('should export analytics engine module', async () => {
    const engine = await import('./analytics-engine.js');
    expect(engine).toBeDefined();
  });
});
