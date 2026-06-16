import { describe, it, expect } from 'vitest';

describe('@cinacoin/push-server', () => {
  it('should export default fetch handler', async () => {
    const mod = await import('./index');
    // push-server exports a default export (Hono app)
    expect(mod.default).toBeDefined();
  });

  it('should export DeviceRegistry', async () => {
    const { DeviceRegistry } = await import('./device-registry');
    expect(DeviceRegistry).toBeDefined();
  });

  it('should export NotificationDelivery', async () => {
    const { NotificationDelivery } = await import('./notification-delivery');
    expect(NotificationDelivery).toBeDefined();
  });

  it('should export RateLimiter', async () => {
    const { RateLimiter } = await import('./rate-limiter');
    expect(RateLimiter).toBeDefined();
  });
});
