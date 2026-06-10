import pino from 'pino';

/**
 * Default logger instance for the Cinacoin SDK.
 *
 * Uses pino with pretty-print in development and structured JSON in production.
 * Configure log level via the `LOG_LEVEL` environment variable.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});

export type Logger = pino.Logger;

/**
 * Create a child logger with a named context.
 *
 * @param name - The module or component name for log context.
 * @returns A pino child logger instance.
 *
 * @example
 * ```ts
 * import { createLogger } from '@cinacoin/logger';
 * const log = createLogger('adapter-tron');
 * log.info('Connected to TRON mainnet');
 * ```
 */
export function createLogger(name: string): Logger {
  return logger.child({ name });
}

/**
 * Silent logger that discards all output.
 * Useful for testing or when logging should be suppressed.
 */
export const silentLogger: Logger = logger.child({}, { level: 'silent' });

export default logger;
