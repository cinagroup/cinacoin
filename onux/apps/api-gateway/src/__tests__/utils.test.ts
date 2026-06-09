import { describe, it, expect } from 'vitest';
import { generateRequestId, sha256, generateApiKey, parsePagination, createSuccessResponse, createErrorResponse } from '../lib/utils';

describe('Utils', () => {
  describe('generateRequestId', () => {
    it('should generate a UUID-like string', () => {
      const id = generateRequestId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should generate unique IDs', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateRequestId()));
      expect(ids.size).toBe(100);
    });
  });

  describe('sha256', () => {
    it('should hash a string correctly', async () => {
      const hash = await sha256('test');
      expect(hash).toBe('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
    });

    it('should produce consistent hashes', async () => {
      const hash1 = await sha256('hello');
      const hash2 = await sha256('hello');
      expect(hash1).toBe(hash2);
    });
  });

  describe('generateApiKey', () => {
    it('should generate a key with prefix', () => {
      const key = generateApiKey('ck_');
      expect(key).toMatch(/^ck_[0-9a-f]{64}$/);
    });

    it('should generate unique keys', () => {
      const keys = new Set(Array.from({ length: 100 }, () => generateApiKey()));
      expect(keys.size).toBe(100);
    });
  });

  describe('parsePagination', () => {
    it('should parse default pagination', () => {
      const url = new URL('https://example.com/api');
      const result = parsePagination(url);
      expect(result).toEqual({ page: 1, limit: 20, offset: 0 });
    });

    it('should parse custom pagination', () => {
      const url = new URL('https://example.com/api?page=3&limit=10');
      const result = parsePagination(url);
      expect(result).toEqual({ page: 3, limit: 10, offset: 20 });
    });

    it('should enforce minimum values', () => {
      const url = new URL('https://example.com/api?page=0&limit=0');
      const result = parsePagination(url);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(1);
    });

    it('should enforce maximum limit', () => {
      const url = new URL('https://example.com/api?limit=200');
      const result = parsePagination(url);
      expect(result.limit).toBe(100);
    });
  });

  describe('createSuccessResponse', () => {
    it('should create a success response', () => {
      const response = createSuccessResponse({ foo: 'bar' });
      expect(response.data).toEqual({ foo: 'bar' });
      expect(response.meta).toHaveProperty('request_id');
      expect(response.meta).toHaveProperty('timestamp');
    });

    it('should include pagination when provided', () => {
      const response = createSuccessResponse([], {
        pagination: { page: 1, limit: 20, total: 100 },
      });
      expect(response.meta?.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 100,
        total_pages: 5,
      });
    });
  });

  describe('createErrorResponse', () => {
    it('should create an error response', () => {
      const response = createErrorResponse('TEST_ERROR', 'Test message');
      expect(response.error.code).toBe('TEST_ERROR');
      expect(response.error.message).toBe('Test message');
      expect(response).toHaveProperty('request_id');
      expect(response).toHaveProperty('timestamp');
    });
  });
});
