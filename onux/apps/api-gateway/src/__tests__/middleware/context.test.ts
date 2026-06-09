import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateRequestId, getClientIp } from '../../lib/utils';

/**
 * Integration tests for request context middleware
 */
describe('Request Context Middleware', () => {
  describe('generateRequestId', () => {
    it('should generate valid UUID v4 format', () => {
      const id = generateRequestId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should generate unique IDs across 1000 iterations', () => {
      const ids = new Set(Array.from({ length: 1000 }, () => generateRequestId()));
      expect(ids.size).toBe(1000);
    });
  });

  describe('getClientIp', () => {
    it('should extract IP from cf-connecting-ip header', () => {
      const request = new Request('https://example.com', {
        headers: { 'cf-connecting-ip': '1.2.3.4' },
      });
      expect(getClientIp(request)).toBe('1.2.3.4');
    });

    it('should extract first IP from x-forwarded-for', () => {
      const request = new Request('https://example.com', {
        headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8, 9.10.11.12' },
      });
      expect(getClientIp(request)).toBe('1.2.3.4');
    });

    it('should fallback to x-real-ip', () => {
      const request = new Request('https://example.com', {
        headers: { 'x-real-ip': '10.0.0.1' },
      });
      expect(getClientIp(request)).toBe('10.0.0.1');
    });

    it('should return unknown when no IP headers present', () => {
      const request = new Request('https://example.com');
      expect(getClientIp(request)).toBe('unknown');
    });

    it('should prefer cf-connecting-ip over x-forwarded-for', () => {
      const request = new Request('https://example.com', {
        headers: {
          'cf-connecting-ip': '1.2.3.4',
          'x-forwarded-for': '5.6.7.8',
        },
      });
      expect(getClientIp(request)).toBe('1.2.3.4');
    });
  });
});
