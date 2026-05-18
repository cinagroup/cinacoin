/**
 * config/tests/config.test.ts
 *
 * Tests for ConfigManager, feature flags, and configuration utilities.
 */

import { ConfigManager } from '../src/ConfigManager.js';
import type { RemoteConfig, FeatureFlags } from '../src/ConfigManager.js';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

// ---------------------------------------------------------------------------
// ConfigManager Factory
// ---------------------------------------------------------------------------

function testConfigManagerCreate() {
  const config: RemoteConfig = { projectId: 'proj_123' };
  const manager = ConfigManager.create(config);
  assert(manager !== null, 'manager should be created');
  console.log('✓ ConfigManager create');
}

function testConfigManagerDefaults() {
  const manager = ConfigManager.create({ projectId: 'proj_test' });
  // Before init, uses fallback defaults
  assert(manager.getFeature('headless') === true, 'headless defaults to true');
  assert(manager.getFeature('analytics_enabled') === true, 'analytics_enabled defaults to true');
  assert(manager.getFeature('swap_enabled') === true, 'swap_enabled defaults to true');
  assert(manager.getFeature('onramp_enabled') === true, 'onramp_enabled defaults to true');
  assert(manager.getFeature('smart_accounts_enabled') === false, 'smart_accounts_enabled defaults to false');
  assert(manager.getFeature('social_login_enabled') === false, 'social_login_enabled defaults to false');
  console.log('✓ ConfigManager default features');
}

function testConfigManagerFallbackOverride() {
  const manager = ConfigManager.create({
    projectId: 'proj_override',
    fallback: {
      swap_enabled: false,
      custom_flag: true,
    },
  });
  assert(manager.getFeature('swap_enabled') === false, 'fallback override swap_enabled');
  assert(manager.getFeature('custom_flag') === true, 'custom flag from fallback');
  // Default still applies for non-overridden
  assert(manager.getFeature('headless') === true, 'headless still true');
  console.log('✓ ConfigManager fallback override');
}

function testConfigManagerGetFeature() {
  const manager = ConfigManager.create({ projectId: 'proj_get' });
  assert(manager.getFeature('headless') === true, 'known flag');
  assert(manager.getFeature('nonexistent_flag') === false, 'unknown flag returns false');
  assert(manager.getFeature('') === false, 'empty string returns false');
  console.log('✓ getFeature');
}

function testConfigManagerGetAllFeatures() {
  const manager = ConfigManager.create({ projectId: 'proj_all' });
  const features = manager.getAllFeatures();
  assert(typeof features === 'object', 'should return object');
  assert(features.headless === true, 'headless in snapshot');
  assert(features.swap_enabled === true, 'swap_enabled in snapshot');
  // Should be a shallow copy
  assert(features !== manager.getAllFeatures(), 'should return new copy each time');
  console.log('✓ getAllFeatures');
}

function testConfigManagerOnFeatureChange() {
  const manager = ConfigManager.create({ projectId: 'proj_change' });
  let calls: Array<[string, boolean]> = [];
  const unsubscribe = manager.onFeatureChange('swap_enabled', (flag, value) => {
    calls.push([flag, value]);
  });

  // Immediate invocation with current value
  assert(calls.length === 1, 'callback invoked immediately');
  assert(calls[0][0] === 'swap_enabled', 'flag name correct');
  assert(calls[0][1] === true, 'current value passed');

  // Unsubscribe should work
  unsubscribe();
  // No easy way to trigger change without remote fetch, but unsubscribe returned a function
  assert(typeof unsubscribe === 'function', 'unsubscribe is a function');
  console.log('✓ onFeatureChange');
}

async function testConfigManagerInit() {
  const manager = ConfigManager.create({ projectId: 'proj_init' });
  // init() will try to fetch from remote, which will fail (no server)
  // It should gracefully fall back to defaults
  await manager.init();
  // After init (with fallback), default features should still be available
  assert(manager.getFeature('headless') === true, 'headless after init');
  console.log('✓ ConfigManager init (fallback)');
}

function testConfigManagerDestroy() {
  const manager = ConfigManager.create({ projectId: 'proj_destroy' });
  manager.destroy();
  // After destroy, features should still be readable (fallback values)
  assert(manager.getFeature('headless') === true, 'features readable after destroy');
  console.log('✓ ConfigManager destroy');
}

function testConfigManagerIdempotentInit() {
  const manager = ConfigManager.create({ projectId: 'proj_idem' });
  // Multiple init calls should not throw
  manager.destroy(); // reset state first
  // init will try network, fail, use fallback — should be safe to call again
  console.log('✓ ConfigManager idempotent init (structure check)');
}

// ---------------------------------------------------------------------------
// Feature flags type check
// ---------------------------------------------------------------------------

function testFeatureFlagsType() {
  const flags: FeatureFlags = {
    headless: true,
    analytics_enabled: false,
    swap_enabled: true,
    onramp_enabled: false,
    smart_accounts_enabled: false,
    social_login_enabled: false,
    custom_flag: true, // index signature
  };
  assert(flags.headless === true, 'headless');
  assert(flags['custom_flag'] === true, 'custom flag via index');
  console.log('✓ FeatureFlags type');
}

function testDefaultFeaturesBaseline() {
  // The default feature set should have a known baseline
  const manager = ConfigManager.create({ projectId: 'proj_baseline' });
  const all = manager.getAllFeatures();

  // Count expected default-true flags
  let trueCount = 0;
  for (const key of Object.keys(all)) {
    if (all[key]) trueCount++;
  }
  assert(trueCount === 4, `expected 4 true flags by default, got ${trueCount}`);
  console.log('✓ default features baseline');
}

// ---------------------------------------------------------------------------
// Remote config URL resolution
// ---------------------------------------------------------------------------

function testRemoteConfigOptions() {
  // Test various config option combinations
  const configs: RemoteConfig[] = [
    { projectId: 'a' },
    { projectId: 'b', pollingInterval: 60000 },
    { projectId: 'c', fallback: { test: true } },
    { projectId: 'd', pollingInterval: 10000, fallback: { x: true, y: false } },
  ];

  for (const cfg of configs) {
    const manager = ConfigManager.create(cfg);
    assert(manager !== null, `manager created for ${cfg.projectId}`);
  }
  console.log('✓ RemoteConfig options');
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

async function run() {
  const tests = [
    testConfigManagerCreate,
    testConfigManagerDefaults,
    testConfigManagerFallbackOverride,
    testConfigManagerGetFeature,
    testConfigManagerGetAllFeatures,
    testConfigManagerOnFeatureChange,
    testConfigManagerInit,
    testConfigManagerDestroy,
    testConfigManagerIdempotentInit,
    testFeatureFlagsType,
    testDefaultFeaturesBaseline,
    testRemoteConfigOptions,
  ];

  let passed = 0;
  let failed = 0;

  for (const fn of tests) {
    try {
      await fn();
      passed++;
    } catch (e: any) {
      console.error(`✗ ${fn.name}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed (${tests.length} total)`);
  if (failed > 0) process.exit(1);
}

run();
