import { describe, it, expect } from 'vitest';

describe('@cinacoin/notify-server', () => {
  it('should export NotifyServer class', async () => {
    const { NotifyServer } = await import('./NotifyServer');
    expect(NotifyServer).toBeDefined();
  });

  it('should export all from index', async () => {
    const mod = await import('./index');
    expect(mod.NotifyServer).toBeDefined();
  });
});
