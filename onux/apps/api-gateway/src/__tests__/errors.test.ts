import { describe, it, expect } from 'vitest';
import {
  ApiGatewayError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  InternalError,
  BadGatewayError,
} from '../lib/errors';

describe('Error Classes', () => {
  describe('ApiGatewayError', () => {
    it('should create an error with correct properties', () => {
      const error = new ApiGatewayError({
        message: 'Test error',
        statusCode: 400,
        code: 'TEST_ERROR',
      });
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.name).toBe('ApiGatewayError');
    });

    it('should serialize to JSON correctly', () => {
      const error = new ApiGatewayError({
        message: 'Test error',
        statusCode: 400,
        code: 'TEST_ERROR',
        details: { field: 'email' },
      });
      const json = error.toJSON();
      expect(json.error.code).toBe('TEST_ERROR');
      expect(json.error.message).toBe('Test error');
      expect(json.error.details).toEqual({ field: 'email' });
    });
  });

  describe('BadRequestError', () => {
    it('should have correct status code', () => {
      const error = new BadRequestError();
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
    });
  });

  describe('UnauthorizedError', () => {
    it('should have correct status code', () => {
      const error = new UnauthorizedError();
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('ForbiddenError', () => {
    it('should have correct status code', () => {
      const error = new ForbiddenError();
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });
  });

  describe('NotFoundError', () => {
    it('should have correct status code', () => {
      const error = new NotFoundError();
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });
  });

  describe('ValidationError', () => {
    it('should have correct status code', () => {
      const error = new ValidationError();
      expect(error.statusCode).toBe(422);
      expect(error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('RateLimitError', () => {
    it('should have correct status code', () => {
      const error = new RateLimitError();
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('InternalError', () => {
    it('should have correct status code', () => {
      const error = new InternalError();
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('BadGatewayError', () => {
    it('should have correct status code', () => {
      const error = new BadGatewayError();
      expect(error.statusCode).toBe(502);
      expect(error.code).toBe('BAD_GATEWAY');
    });
  });
});
