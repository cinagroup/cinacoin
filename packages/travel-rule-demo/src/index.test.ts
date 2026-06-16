import { describe, it, expect } from 'vitest';

describe('@cinacoin/travel-rule-demo', () => {
  it('should have demo module', async () => {
    // travel-rule-demo is a demo script, verify it exists
    const mod = await import('./index');
    expect(mod).toBeDefined();
  });
});
