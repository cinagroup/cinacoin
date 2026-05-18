/**
 * Tests for @cinaconnect/nuxt — module and composables.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mock @nuxt/kit ──────────────────────────────────────────────────────────

vi.mock('@nuxt/kit', () => ({
  defineNuxtModule: vi.fn((config: any) => {
    // Simulate what defineNuxtModule does — return an object with setup
    return {
      meta: config.meta,
      defaults: config.defaults,
      setup: config.setup,
    };
  }),
  addPlugin: vi.fn(),
  addImportsDir: vi.fn(),
  addComponent: vi.fn(),
  addTemplate: vi.fn(),
  createResolver: vi.fn(() => ({
    resolve: vi.fn((p: string) => '/mock/path/' + p),
  })),
}));

// ─── Mock #imports (Nuxt auto-imports) ───────────────────────────────────────

const mockNuxtApp = {
  $cinaConnect: {
    address: '0x1234',
    balance: '1.5',
    chain: 'mainnet',
    isConnected: true,
    networks: ['mainnet', 'arbitrum'],
    switchNetwork: vi.fn().mockResolvedValue(undefined),
    connect: vi.fn().mockResolvedValue(undefined),
  },
};

vi.mock('#imports', () => ({
  useNuxtApp: vi.fn(() => mockNuxtApp),
  useRuntimeConfig: vi.fn(() => ({
    public: {
      cinaconnect: {
        projectId: 'test-project-id',
        networks: ['mainnet', 'arbitrum'],
        metadata: { name: 'Test App' },
        themeMode: 'auto',
        themeVariables: {},
      },
    },
  })),
  defineNuxtPlugin: vi.fn((fn: any) => fn),
}));

// ─── Mock @cinaconnect/vue ───────────────────────────────────────────────────

vi.mock('@cinaconnect/vue', () => ({
  CinaConnect: vi.fn().mockImplementation(() => ({
    address: '0x1234',
    balance: '1.5',
    chain: 'mainnet',
    isConnected: true,
    networks: ['mainnet', 'arbitrum'],
    switchNetwork: vi.fn().mockResolvedValue(undefined),
    connect: vi.fn().mockResolvedValue(undefined),
  })),
}));

// ─── Mock #build/types ───────────────────────────────────────────────────────

vi.mock('#build/types', () => ({}));

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('CinaConnect Nuxt Module', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.resetModules());

  it('should export default Nuxt module', async () => {
    const mod = await import('../src/module.js');
    expect(mod.default).toBeDefined();
  });

  it('module should have meta with name and configKey', async () => {
    const mod = await import('../src/module.js');
    expect(mod.default.meta).toBeDefined();
    expect(mod.default.meta.name).toBe('@cinaconnect/nuxt');
    expect(mod.default.meta.configKey).toBe('cinaconnect');
  });

  it('module should have defaults', async () => {
    const mod = await import('../src/module.js');
    expect(mod.default.defaults).toBeDefined();
    expect(mod.default.defaults.networks).toEqual(['mainnet']);
    expect(mod.default.defaults.themeMode).toBe('auto');
    expect(mod.default.defaults.themeVariables).toEqual({});
  });

  it('module should have setup function', async () => {
    const mod = await import('../src/module.js');
    expect(typeof mod.default.setup).toBe('function');
  });

  it('setup should call addPlugin, addImportsDir, addComponent, addTemplate', async () => {
    const { defineNuxtModule, addPlugin, addImportsDir, addComponent, addTemplate } =
      await import('@nuxt/kit');

    // Import the module to trigger the mocked defineNuxtModule
    await import('../src/module.js');

    // The module is defined, but setup isn't called automatically.
    // We manually call the setup function to verify behavior.
    const mod = await import('../src/module.js');

    const mockNuxt = {
      options: {
        runtimeConfig: { public: {} as any },
      },
      hook: vi.fn(),
    };

    mod.default.setup(
      { projectId: 'test-id', networks: ['mainnet'] },
      mockNuxt as any
    );

    expect(addPlugin).toHaveBeenCalled();
    expect(addImportsDir).toHaveBeenCalled();
    expect(addComponent).toHaveBeenCalled();
    expect(addTemplate).toHaveBeenCalled();
  });

  it('setup should configure runtime config', async () => {
    const { defineNuxtModule } = await import('@nuxt/kit');
    const mod = await import('../src/module.js');

    const mockNuxt = {
      options: { runtimeConfig: { public: {} as any } },
      hook: vi.fn(),
    };

    mod.default.setup(
      { projectId: 'my-project-id', networks: ['mainnet', 'arbitrum'] },
      mockNuxt as any
    );

    expect(mockNuxt.options.runtimeConfig.public.cinaconnect).toBeDefined();
    expect(mockNuxt.options.runtimeConfig.public.cinaconnect.projectId).toBe('my-project-id');
    expect(mockNuxt.options.runtimeConfig.public.cinaconnect.networks).toEqual([
      'mainnet',
      'arbitrum',
    ]);
  });
});

describe('Nuxt composables', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.resetModules());

  it('should export useCinaConnect', async () => {
    const composables = await import('../src/runtime/composables.js');
    expect(composables.useCinaConnect).toBeDefined();
    expect(typeof composables.useCinaConnect).toBe('function');
  });

  it('should export useCinaConnectAccount', async () => {
    const composables = await import('../src/runtime/composables.js');
    expect(composables.useCinaConnectAccount).toBeDefined();
    expect(typeof composables.useCinaConnectAccount).toBe('function');
  });

  it('should export useCinaConnectNetwork', async () => {
    const composables = await import('../src/runtime/composables.js');
    expect(composables.useCinaConnectNetwork).toBeDefined();
    expect(typeof composables.useCinaConnectNetwork).toBe('function');
  });

  it('useCinaConnect should return cinaConnect instance', async () => {
    const { useCinaConnect } = await import('../src/runtime/composables.js');
    const result = useCinaConnect();
    expect(result).toHaveProperty('cinaConnect');
  });

  it('useCinaConnectAccount should return address, balance, chain, isConnected', async () => {
    const { useCinaConnectAccount } = await import('../src/runtime/composables.js');
    const result = useCinaConnectAccount();
    expect(result).toHaveProperty('address');
    expect(result).toHaveProperty('balance');
    expect(result).toHaveProperty('chain');
    expect(result).toHaveProperty('isConnected');
  });

  it('useCinaConnectNetwork should return networks and switchNetwork', async () => {
    const { useCinaConnectNetwork } = await import('../src/runtime/composables.js');
    const result = useCinaConnectNetwork();
    expect(result).toHaveProperty('networks');
    expect(result).toHaveProperty('switchNetwork');
    expect(typeof result.switchNetwork).toBe('function');
  });
});

describe('Nuxt runtime plugin', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.resetModules());

  it('plugin should be a function', async () => {
    const plugin = await import('../src/runtime/plugin.js');
    expect(typeof plugin.default).toBe('function');
  });

  it('plugin should provide cinaConnect', async () => {
    const plugin = await import('../src/runtime/plugin.js');
    const mockNuxtApp = {
      provide: vi.fn(),
    };

    const result = plugin.default(mockNuxtApp as any);

    expect(mockNuxtApp.provide).toHaveBeenCalledWith('cinaConnect', expect.anything());
    expect(result).toHaveProperty('provide');
    expect(result.provide).toHaveProperty('cinaConnect');
  });
});
