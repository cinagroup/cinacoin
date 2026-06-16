import { describe, it, expect } from 'vitest';

describe('@cinacoin/react', () => {
  it('should export CinacoinProvider', async () => {
    const mod = await import('./CinacoinProvider');
    expect(mod.CinacoinProvider).toBeDefined();
    expect(mod.useCinacoinContext).toBeDefined();
  });

  it('should export ConnectButton', async () => {
    const mod = await import('./ConnectButton');
    expect(mod.ConnectButton).toBeDefined();
  });

  it('should export ConnectModal', async () => {
    const mod = await import('./ConnectModal');
    expect(mod.ConnectModal).toBeDefined();
  });

  it('should export ChainSwitcher', async () => {
    const mod = await import('./ChainSwitcher');
    expect(mod.ChainSwitcher).toBeDefined();
  });

  it('should export hooks from main index', async () => {
    const mod = await import('./index');
    expect(mod.CinacoinProvider).toBeDefined();
    expect(mod.useCinacoin).toBeDefined();
    expect(mod.useAccount).toBeDefined();
    expect(mod.useChainId).toBeDefined();
    expect(mod.useConnect).toBeDefined();
    expect(mod.useDisconnect).toBeDefined();
    expect(mod.useSwitchChain).toBeDefined();
  });
});
