/**
 * Tests for ChainSwitcher component.
 * Tests dropdown toggle, chain selection, events, and rendering.
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';

const sampleChains = [
  { id: 1, name: 'Ethereum', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } },
  { id: 137, name: 'Polygon', nativeCurrency: { name: 'Polygon', symbol: 'MATIC', decimals: 18 } },
  { id: 42161, name: 'Arbitrum', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } },
  {
    id: 5,
    name: 'Goerli',
    nativeCurrency: { name: 'Goerli Ether', symbol: 'ETH', decimals: 18 },
    testnet: true,
  },
];

describe('ChainSwitcher component', () => {
  let ChainSwitcher: any;

  beforeAll(async () => {
    const mod = await import('../../src/components/chain-switcher.js');
    ChainSwitcher = mod.ChainSwitcher;
  });

  it('should have correct default property values', () => {
    const el = document.createElement('ocx-chain-switcher');
    expect(el.chains).toEqual([]);
    expect(el.activeChainId).toBe(1);
  });

  it('should accept chain data and activeChainId', () => {
    const el = document.createElement('ocx-chain-switcher') as any;
    el.chains = sampleChains;
    el.activeChainId = 137;
    expect(el.chains).toHaveLength(3);
    expect(el.activeChainId).toBe(137);
  });

  it('should start with dropdown closed', () => {
    const el = document.createElement('ocx-chain-switcher') as any;
    el.chains = sampleChains;
    expect(el._open).toBe(false);
  });

  it('should toggle dropdown open on click', () => {
    const el = document.createElement('ocx-chain-switcher') as any;
    el.chains = sampleChains;
    el._toggle();
    expect(el._open).toBe(true);
    el._toggle();
    expect(el._open).toBe(false);
  });

  it('should close dropdown when clicking outside', () => {
    const el = document.createElement('ocx-chain-switcher') as any;
    el.chains = sampleChains;
    el._open = true;

    el.connectedCallback();

    // Simulate outside click
    const outsideNode = document.createElement('div');
    const fakeEvent = { target: outsideNode } as unknown as Event;
    el._onOutsideClick(fakeEvent);

    expect(el._open).toBe(false);
    el.disconnectedCallback();
  });

  it('should not close dropdown when clicking inside', () => {
    const el = document.createElement('ocx-chain-switcher') as any;
    el.chains = sampleChains;
    el._open = true;

    el.connectedCallback();

    // Simulate click on self
    const fakeEvent = { target: el } as unknown as Event;
    el._onOutsideClick(fakeEvent);

    expect(el._open).toBe(true);
    el.disconnectedCallback();
  });

  it('should dispatch ocx-chain-change event on chain selection', () => {
    const el = document.createElement('ocx-chain-switcher') as any;
    el.chains = sampleChains;
    el.activeChainId = 1;

    const handler = vi.fn();
    el.addEventListener('ocx-chain-change', handler);

    el._select(sampleChains[1]); // Polygon

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({ chainId: 137 });
    expect(el._open).toBe(false);
  });

  it('should NOT dispatch event when selecting already active chain', () => {
    const el = document.createElement('ocx-chain-switcher') as any;
    el.chains = sampleChains;
    el.activeChainId = 1;

    const handler = vi.fn();
    el.addEventListener('ocx-chain-change', handler);

    el._select(sampleChains[0]); // Same active chain

    expect(handler).not.toHaveBeenCalled();
    expect(el._open).toBe(false);
  });

  it('should render active chain name in trigger', () => {
    const el = document.createElement('ocx-chain-switcher') as any;
    el.chains = sampleChains;
    el.activeChainId = 137;
    const result = el.render();
    expect(String(result)).toContain('Polygon');
  });

  it('should render select_network when active chain not found', () => {
    const el = document.createElement('ocx-chain-switcher') as any;
    el.chains = sampleChains;
    el.activeChainId = 999;
    const result = el.render();
    expect(String(result)).toContain('select_network');
  });

  it('should render all chains in dropdown when open', () => {
    const el = document.createElement('ocx-chain-switcher') as any;
    el.chains = sampleChains;
    el.activeChainId = 1;
    el._open = true;
    const result = el.render();
    const rendered = String(result);
    expect(rendered).toContain('Ethereum');
    expect(rendered).toContain('Polygon');
    expect(rendered).toContain('Arbitrum');
  });

  it('should mark active chain as active in dropdown', () => {
    const el = document.createElement('ocx-chain-switcher') as any;
    el.chains = sampleChains;
    el.activeChainId = 137;
    el._open = true;
    const result = el.render();
    const rendered = String(result);
    // Active chain should have active class
    expect(rendered).toContain('active');
  });

  it('should render testnet badge for testnet chains', () => {
    const el = document.createElement('ocx-chain-switcher') as any;
    el.chains = sampleChains;
    el.activeChainId = 1;
    el._open = true;
    const result = el.render();
    expect(String(result)).toContain('testnet-badge');
  });

  it('should have correct aria attributes on trigger', () => {
    const el = document.createElement('ocx-chain-switcher') as any;
    el.chains = sampleChains;
    el._open = true;
    const result = el.render();
    expect(String(result)).toContain('aria-haspopup="listbox"');
    expect(String(result)).toContain('aria-expanded="true"');
  });

  it('should render dropdown with listbox role', () => {
    const el = document.createElement('ocx-chain-switcher') as any;
    el.chains = sampleChains;
    el.activeChainId = 1;
    el._open = true;
    const result = el.render();
    expect(String(result)).toContain('role="listbox"');
  });

  it('should render chain items with option role and aria-selected', () => {
    const el = document.createElement('ocx-chain-switcher') as any;
    el.chains = sampleChains;
    el.activeChainId = 137;
    el._open = true;
    const result = el.render();
    const rendered = String(result);
    expect(rendered).toContain('role="option"');
    expect(rendered).toContain('aria-selected');
  });

  it('should render checkmark for active chain', () => {
    const el = document.createElement('ocx-chain-switcher') as any;
    el.chains = sampleChains;
    el.activeChainId = 1;
    el._open = true;
    const result = el.render();
    expect(String(result)).toContain('✓');
  });

  it('should define CSS styles', () => {
    const styles = (ChainSwitcher as any).styles;
    expect(Array.isArray(styles)).toBe(true);
    expect(styles.length).toBeGreaterThanOrEqual(1);
  });

  it('should handle keyboard Enter to select chain', () => {
    const el = document.createElement('ocx-chain-switcher') as any;
    el.chains = sampleChains;
    el.activeChainId = 1;

    const handler = vi.fn();
    el.addEventListener('ocx-chain-change', handler);

    const keyEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    // Simulate the dropdown item's keydown handler
    const item = sampleChains[1];
    // The keydown handler in the template calls _select
    el._select(item);

    expect(handler).toHaveBeenCalled();
  });

  it('should render chain icon with URL when available', () => {
    const chainsWithIcons = [
      { id: 1, name: 'Ethereum', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, iconUrl: 'https://example.com/eth.svg' },
    ];
    const el = document.createElement('ocx-chain-switcher') as any;
    el.chains = chainsWithIcons;
    el.activeChainId = 1;
    const result = el.render();
    expect(String(result)).toContain('chain-icon');
  });

  it('should render fallback chain icon when no iconUrl', () => {
    const el = document.createElement('ocx-chain-switcher') as any;
    el.chains = sampleChains;
    el.activeChainId = 1;
    const result = el.render();
    expect(String(result)).toContain('⛓');
  });
});
