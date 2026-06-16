import { describe, it, expect } from 'vitest';
import { logger, createLogger } from './index';

describe('logger', () => {
  it('should export logger with standard methods', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.child).toBe('function');
  });

  it('should log messages without throwing', () => {
    expect(() => logger.debug('debug message')).not.toThrow();
    expect(() => logger.info('info message')).not.toThrow();
    expect(() => logger.warn('warn message')).not.toThrow();
    expect(() => logger.error('error message')).not.toThrow();
  });

  it('should support structured data', () => {
    expect(() => logger.info('message', { key: 'value' })).not.toThrow();
  });

  it('should support child loggers', () => {
    const child = logger.child({ component: 'test' });
    expect(child).toBeDefined();
    expect(typeof child.info).toBe('function');
  });
});

describe('createLogger', () => {
  it('should create logger with name', () => {
    const log = createLogger({ name: 'test-logger' });
    expect(log).toBeDefined();
    expect(typeof log.info).toBe('function');
  });

  it('should create logger with custom level', () => {
    const log = createLogger({ name: 'test', level: 'debug' });
    expect(log).toBeDefined();
  });

  it('should support child loggers', () => {
    const log = createLogger({ name: 'parent' });
    const child = log.child({ service: 'child' });
    expect(child).toBeDefined();
    expect(typeof child.info).toBe('function');
  });
});
