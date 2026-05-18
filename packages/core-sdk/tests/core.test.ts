/**
 * core-sdk/tests/core.test.ts
 *
 * Tests for CinaConnectCore initialization, Connector base class, and Connector
 * abstract interface contract.
 */

import { EventEmitter } from '../src/events.js';
import { Connector, RedirectHandler } from '../src/connector.js';
import type { ConnectParams, ConnectionResult, TransactionRequest } from '../src/types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Concrete subclass for testing the abstract Connector class
class TestConnector extends Connector {
  readonly id = 'test-connector';
  readonly name = 'Test Connector';
  readonly icon = 'data:image/png;base64,icon';
  readonly installed = true;
  readonly type = 'injected';

  private _accounts = ['0xabcdef0123456789abcdef0123456789abcdef01'];
  private _chainId = 1;
  private _connected = false;

  async connect(_params?: ConnectParams): Promise<ConnectionResult> {
    this._connected = true;
    this.emit('connect', { accounts: this._accounts, chainId: this._chainId });
    return {
      sessionId: 'session-123',
      accounts: this._accounts,
      chainId: this._chainId,
      connectorId: this.id,
    };
  }

  async disconnect(): Promise<void> {
    this._connected = false;
    this.emit('disconnect');
  }

  async getAccounts(): Promise<string[]> {
    return this._connected ? this._accounts : [];
  }

  async getChainId(): Promise<number> {
    return this._chainId;
  }

  async switchChain(chainId: number): Promise<void> {
    this._chainId = chainId;
    this.emit('chainChanged', chainId);
  }

  async signMessage(message: string): Promise<string> {
    return `sig:${message}`;
  }

  async signTransaction(_tx: TransactionRequest): Promise<string> {
    return '0xsignedtx';
  }
}

// ---------------------------------------------------------------------------
// Connector
// ---------------------------------------------------------------------------

let connector: TestConnector;

function setup() {
  connector = new TestConnector();
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

// --- Initialization ---

async function testConnectorIdentity() {
  setup();
  assert(connector.id === 'test-connector', 'id should be test-connector');
  assert(connector.name === 'Test Connector', 'name should match');
  assert(connector.installed === true, 'installed should be true');
  assert(connector.type === 'injected', 'type should be injected');
  console.log('✓ connector identity');
}

// --- EventEmitter inheritance ---

async function testConnectorIsEventEmitter() {
  setup();
  assert(connector instanceof EventEmitter, 'Connector should extend EventEmitter');

  let called = false;
  connector.on('test_event', () => { called = true; });
  connector.emit('test_event');
  assert(called === true, 'event handler should fire');
  console.log('✓ connector is EventEmitter');
}

// --- Connect / Disconnect ---

async function testConnectDisconnect() {
  setup();

  const result = await connector.connect();
  assert(result.sessionId === 'session-123', 'sessionId should match');
  assert(result.accounts.length === 1, 'should have 1 account');
  assert(result.chainId === 1, 'chainId should be 1');
  assert(result.connectorId === 'test-connector', 'connectorId should match');

  const accounts = await connector.getAccounts();
  assert(accounts.length === 1, 'should return accounts after connect');

  await connector.disconnect();
  const afterDisconnect = await connector.getAccounts();
  assert(afterDisconnect.length === 0, 'should return empty after disconnect');

  console.log('✓ connect / disconnect');
}

// --- Switch chain ---

async function testSwitchChain() {
  setup();
  await connector.connect();

  let changedChain: number | undefined;
  connector.on('chainChanged', (chainId: number) => { changedChain = chainId; });

  await connector.switchChain(42161);
  assert(changedChain === 42161, 'chainChanged event should fire with new chain');

  const chainId = await connector.getChainId();
  assert(chainId === 42161, 'chainId should update after switch');

  console.log('✓ switch chain');
}

// --- Sign message ---

async function testSignMessage() {
  setup();
  const sig = await connector.signMessage('hello');
  assert(sig === 'sig:hello', 'signMessage should return formatted sig');
  console.log('✓ sign message');
}

// --- Sign transaction ---

async function testSignTransaction() {
  setup();
  const sig = await connector.signTransaction({ from: '0x1', to: '0x2', value: '100' });
  assert(sig === '0xsignedtx', 'signTransaction should return signed tx');
  console.log('✓ sign transaction');
}

// --- getProvider default ---

async function testGetProvider() {
  setup();
  assert(connector.getProvider() === null, 'default getProvider should return null');
  console.log('✓ getProvider default');
}

// --- Connect events ---

async function testConnectEvent() {
  setup();
  let connectData: any;
  connector.on('connect', (data: any) => { connectData = data; });
  await connector.connect();
  assert(connectData.chainId === 1, 'connect event should include chainId');
  console.log('✓ connect event');
}

// --- Disconnect event ---

async function testDisconnectEvent() {
  setup();
  await connector.connect();
  let disconnected = false;
  connector.on('disconnect', () => { disconnected = true; });
  await connector.disconnect();
  assert(disconnected === true, 'disconnect event should fire');
  console.log('✓ disconnect event');
}

// --- RedirectHandler ---

async function testRedirectHandler() {
  const handler = new RedirectHandler('desktop');
  assert(handler.platform === 'desktop', 'platform should be desktop');

  handler.setPlatform('mobile');
  assert(handler.platform === 'mobile', 'platform should update');

  const link = handler.generateLink('metamask', 'wc:uri', { foo: 'bar' });
  assert(link.includes('wc:uri'), 'generated link should include uri');
  assert(link.includes('metamask'), 'generated link should include walletId');
  console.log('✓ RedirectHandler');
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

async function run() {
  const tests = [
    testConnectorIdentity,
    testConnectorIsEventEmitter,
    testConnectDisconnect,
    testSwitchChain,
    testSignMessage,
    testSignTransaction,
    testGetProvider,
    testConnectEvent,
    testDisconnectEvent,
    testRedirectHandler,
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
