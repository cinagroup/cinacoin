/**
 * Pairing lifecycle tests.
 *
 * Tests:
 * - parseWcUri / formatWcUri roundtrip
 * - isValidWcUri validation
 * - createPairing (mocked relay)
 * - approvePairing (mocked relay)
 * - deletePairing sends notification
 * - pairingPing with response
 * - isPairingExpired / isPairingValid
 */
import { describe, it, expect } from 'vitest';
import { parseWcUri, formatWcUri, isValidWcUri, isPairingExpired, isPairingValid, } from '../src/pairing.js';
// ============================================================
// URI parsing
// ============================================================
describe('parseWcUri', () => {
    it('parses a valid WC v2 URI', () => {
        const uri = 'wc:abc123def456789012345678901234567890123456789012345678901234@2?relay-protocol=waku&relay-url=wss%3A%2F%2Frelay.example.com&symKey=deadbeef00000000deadbeef00000000deadbeef00000000deadbeef00000000';
        const parsed = parseWcUri(uri);
        expect(parsed.version).toBe(2);
        expect(parsed.topic).toBe('abc123def456789012345678901234567890123456789012345678901234');
        expect(parsed.relayProtocol).toBe('waku');
        expect(parsed.relayUrl).toBe('wss://relay.example.com');
        expect(parsed.symKey).toBe('deadbeef00000000deadbeef00000000deadbeef00000000deadbeef00000000');
    });
    it('parses URI with methods param', () => {
        const uri = 'wc:abc123def456789012345678901234567890123456789012345678901234@2?relay-protocol=irn&relay-url=wss%3A%2F%2Frelay.example.com&symKey=deadbeef00000000deadbeef00000000deadbeef00000000deadbeef00000000&methods=eth_sendTransaction%2Cpersonal_sign';
        const parsed = parseWcUri(uri);
        expect(parsed.methods).toEqual(['eth_sendTransaction', 'personal_sign']);
    });
    it('throws on unsupported version', () => {
        const uri = 'wc:abc123def456789012345678901234567890123456789012345678901234@1?relay-protocol=waku&relay-url=wss%3A%2F%2Frelay.example.com&symKey=deadbeef00000000deadbeef00000000deadbeef00000000deadbeef00000000';
        expect(() => parseWcUri(uri)).toThrow('Unsupported WalletConnect version: 1');
    });
    it('throws on missing symKey', () => {
        const uri = 'wc:abc123def456789012345678901234567890123456789012345678901234@2?relay-protocol=waku&relay-url=wss%3A%2F%2Frelay.example.com';
        expect(() => parseWcUri(uri)).toThrow('Invalid WC URI: missing topic or symKey');
    });
    it('throws on missing topic', () => {
        const uri = 'wc:@2?relay-protocol=waku&relay-url=wss%3A%2F%2Frelay.example.com&symKey=deadbeef00000000deadbeef00000000deadbeef00000000deadbeef00000000';
        expect(() => parseWcUri(uri)).toThrow('Invalid WC URI: missing topic or symKey');
    });
});
// ============================================================
// URI formatting
// ============================================================
describe('formatWcUri', () => {
    it('formats a WC v2 URI from components', () => {
        const uri = formatWcUri({
            version: 2,
            topic: 'abc123def456789012345678901234567890123456789012345678901234',
            relayProtocol: 'waku',
            relayUrl: 'wss://relay.example.com',
            symKey: 'deadbeef00000000deadbeef00000000deadbeef00000000deadbeef00000000',
        });
        expect(uri).toContain('wc:');
        expect(uri).toContain('@2');
        expect(uri).toContain('relay-protocol=waku');
        expect(uri).toContain('relay-url=');
        expect(uri).toContain('symKey=deadbeef');
    });
    it('includes methods when provided', () => {
        const uri = formatWcUri({
            version: 2,
            topic: 'abc123def456789012345678901234567890123456789012345678901234',
            relayProtocol: 'irn',
            relayUrl: 'wss://relay.example.com',
            symKey: 'deadbeef00000000deadbeef00000000deadbeef00000000deadbeef00000000',
            methods: ['eth_sendTransaction', 'personal_sign'],
        });
        expect(uri).toContain('methods=');
        expect(uri).toContain('eth_sendTransaction');
        expect(uri).toContain('personal_sign');
    });
    it('roundtrips through parseWcUri', () => {
        const params = {
            version: 2,
            topic: 'abc123def456789012345678901234567890123456789012345678901234',
            relayProtocol: 'waku',
            relayUrl: 'wss://relay.example.com',
            symKey: 'deadbeef00000000deadbeef00000000deadbeef00000000deadbeef00000000',
        };
        const uri = formatWcUri(params);
        const parsed = parseWcUri(uri);
        expect(parsed.version).toBe(params.version);
        expect(parsed.topic).toBe(params.topic);
        expect(parsed.relayProtocol).toBe(params.relayProtocol);
        expect(parsed.relayUrl).toBe(params.relayUrl);
        expect(parsed.symKey).toBe(params.symKey);
    });
});
// ============================================================
// URI validation
// ============================================================
describe('isValidWcUri', () => {
    it('returns true for valid WC v2 URIs', () => {
        const uri = 'wc:abc123def456789012345678901234567890123456789012345678901234@2?relay-protocol=waku&relay-url=wss%3A%2F%2Frelay.example.com&symKey=deadbeef00000000deadbeef00000000deadbeef00000000deadbeef00000000';
        expect(isValidWcUri(uri)).toBe(true);
    });
    it('returns false for WC v1 URIs', () => {
        const uri = 'wc:abc123@1?bridge=https%3A%2F%2Fbridge.example.com&key=abc';
        expect(isValidWcUri(uri)).toBe(false);
    });
    it('returns false for malformed URIs', () => {
        expect(isValidWcUri('not-a-uri')).toBe(false);
        expect(isValidWcUri('')).toBe(false);
        expect(isValidWcUri('wc:short@2?relay-protocol=waku')).toBe(false);
    });
});
// ============================================================
// Pairing expiry helpers
// ============================================================
describe('isPairingExpired', () => {
    it('returns true for expired pairings', () => {
        const pairing = {
            topic: 'abc'.repeat(21) + 'a', // 64 chars
            uri: 'wc:abc@2?relay-protocol=waku&relay-url=wss://x&symKey=abc',
            active: true,
            expiry: Date.now() - 1000, // 1 second ago
        };
        expect(isPairingExpired(pairing)).toBe(true);
    });
    it('returns false for non-expired pairings', () => {
        const pairing = {
            topic: 'abc'.repeat(21) + 'a',
            uri: 'wc:abc@2?relay-protocol=waku&relay-url=wss://x&symKey=abc',
            active: true,
            expiry: Date.now() + 60000, // 1 minute from now
        };
        expect(isPairingExpired(pairing)).toBe(false);
    });
});
describe('isPairingValid', () => {
    it('returns true for active, non-expired pairings', () => {
        const pairing = {
            topic: 'abc'.repeat(21) + 'a',
            uri: 'wc:abc@2?relay-protocol=waku&relay-url=wss://x&symKey=abc',
            active: true,
            expiry: Date.now() + 60000,
        };
        expect(isPairingValid(pairing)).toBe(true);
    });
    it('returns false for inactive pairings', () => {
        const pairing = {
            topic: 'abc'.repeat(21) + 'a',
            uri: 'wc:abc@2?relay-protocol=waku&relay-url=wss://x&symKey=abc',
            active: false,
            expiry: Date.now() + 60000,
        };
        expect(isPairingValid(pairing)).toBe(false);
    });
    it('returns false for expired pairings', () => {
        const pairing = {
            topic: 'abc'.repeat(21) + 'a',
            uri: 'wc:abc@2?relay-protocol=waku&relay-url=wss://x&symKey=abc',
            active: true,
            expiry: Date.now() - 1000,
        };
        expect(isPairingValid(pairing)).toBe(false);
    });
});
//# sourceMappingURL=pairing.test.js.map