import { describe, it, expect } from 'vitest';

describe('@cinacoin/push-network-sdk', () => {
  it('should export PushNetworkClient class', async () => {
    const { PushNetworkClient } = await import('./index');
    expect(PushNetworkClient).toBeDefined();
  });

  it('should be instantiable with config', async () => {
    const { PushNetworkClient } = await import('./index');
    const client = new PushNetworkClient({
      baseUrl: 'https://push.cinacoin.com',
    });
    expect(client).toBeDefined();
  });

  it('should expose registerDevice method', async () => {
    const { PushNetworkClient } = await import('./index');
    const client = new PushNetworkClient({
      baseUrl: 'https://push.cinacoin.com',
    });
    expect(typeof client.registerDevice).toBe('function');
  });

  it('should expose updatePreferences method', async () => {
    const { PushNetworkClient } = await import('./index');
    const client = new PushNetworkClient({
      baseUrl: 'https://push.cinacoin.com',
    });
    expect(typeof client.updatePreferences).toBe('function');
  });

  it('should expose getDeliveryStatus method', async () => {
    const { PushNetworkClient } = await import('./index');
    const client = new PushNetworkClient({
      baseUrl: 'https://push.cinacoin.com',
    });
    expect(typeof client.getDeliveryStatus).toBe('function');
  });
});
