/**
 * Benchmark tests for Connector class.
 *
 * Measures connection, signing, and chain-switching performance
 * using native performance API when available.
 */
import { describe, it, expect } from 'vitest';
import { Connector } from '../src/connector.js';
class BenchConnector extends Connector {
    constructor() {
        super(...arguments);
        this.id = 'bench-connector';
        this.name = 'Bench Wallet';
        this.icon = '';
        this.installed = true;
        this.type = 'injected';
        this._connected = false;
        this._chainId = 1;
    }
    async connect(_params) {
        this._connected = true;
        return { sessionId: 'bench-session', accounts: ['0x' + 'ab'.repeat(20)], chainId: 1, connectorId: this.id };
    }
    async disconnect() { this._connected = false; }
    async getAccounts() { return this._connected ? ['0x' + 'ab'.repeat(20)] : []; }
    async getChainId() { return this._chainId; }
    async switchChain(chainId) { this._chainId = chainId; }
    async signMessage(_message) { return '0x' + 'cd'.repeat(32); }
    async signTransaction(_tx) { return '0x' + 'ef'.repeat(32); }
    getProvider() { return this._connected ? { request: async () => null } : null; }
    get isConnected() { return this._connected; }
}
/** Measure async operation duration in ms. */
async function measure(fn) {
    const start = performance.now();
    await fn();
    return performance.now() - start;
}
describe('Connector Benchmarks', () => {
    it('should connect within 5ms', async () => {
        const connector = new BenchConnector();
        const duration = await measure(async () => {
            await connector.connect();
        });
        expect(duration).toBeLessThan(5);
    });
    it('should disconnect within 1ms', async () => {
        const connector = new BenchConnector();
        await connector.connect();
        const duration = await measure(async () => {
            await connector.disconnect();
        });
        expect(duration).toBeLessThan(1);
    });
    it('should sign message within 2ms', async () => {
        const connector = new BenchConnector();
        await connector.connect();
        const duration = await measure(async () => {
            await connector.signMessage('benchmark message');
        });
        expect(duration).toBeLessThan(2);
    });
    it('should sign transaction within 2ms', async () => {
        const connector = new BenchConnector();
        await connector.connect();
        const duration = await measure(async () => {
            await connector.signTransaction({ to: '0x' + 'ab'.repeat(20), value: BigInt(1000) });
        });
        expect(duration).toBeLessThan(2);
    });
    it('should switch chain within 1ms', async () => {
        const connector = new BenchConnector();
        await connector.connect();
        const duration = await measure(async () => {
            await connector.switchChain(137);
        });
        expect(duration).toBeLessThan(1);
    });
    it('should handle 1000 connect-disconnect cycles within 500ms', async () => {
        const connector = new BenchConnector();
        const start = performance.now();
        for (let i = 0; i < 1000; i++) {
            await connector.connect();
            await connector.disconnect();
        }
        const duration = performance.now() - start;
        expect(duration).toBeLessThan(500);
    });
    it('should handle 100 rapid sign operations within 100ms', async () => {
        const connector = new BenchConnector();
        await connector.connect();
        const start = performance.now();
        const promises = Array.from({ length: 100 }, () => connector.signMessage('bench'));
        await Promise.all(promises);
        const duration = performance.now() - start;
        expect(duration).toBeLessThan(100);
    });
});
//# sourceMappingURL=connector.bench.js.map