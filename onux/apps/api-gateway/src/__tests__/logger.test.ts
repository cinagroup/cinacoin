import { describe, it, expect } from 'vitest';
import { Logger, createLogger } from '../lib/logger';

describe('Logger', () => {
  it('should create a logger instance', () => {
    const logger = createLogger();
    expect(logger).toBeInstanceOf(Logger);
  });

  it('should create a logger with custom options', () => {
    const logger = createLogger({ level: 'debug', serviceName: 'test-service' });
    expect(logger).toBeInstanceOf(Logger);
  });

  it('should log messages at different levels', () => {
    const logger = createLogger({ level: 'debug' });
    
    // These should not throw
    expect(() => logger.debug('Debug message')).not.toThrow();
    expect(() => logger.info('Info message')).not.toThrow();
    expect(() => logger.warn('Warning message')).not.toThrow();
    expect(() => logger.error('Error message')).not.toThrow();
  });

  it('should log with metadata', () => {
    const logger = createLogger({ level: 'debug' });
    
    expect(() => {
      logger.info('Test message', { key: 'value', number: 42 });
    }).not.toThrow();
  });

  it('should log errors with error objects', () => {
    const logger = createLogger({ level: 'debug' });
    const error = new Error('Test error');
    
    expect(() => {
      logger.error('Error occurred', error, { context: 'test' });
    }).not.toThrow();
  });

  it('should log HTTP requests', () => {
    const logger = createLogger({ level: 'debug' });
    
    expect(() => {
      logger.httpRequest({
        requestId: 'test-id',
        method: 'GET',
        path: '/api/test',
        status: 200,
        duration: 42,
        clientIp: '127.0.0.1',
        userAgent: 'test-agent',
      });
    }).not.toThrow();
  });
});
