import pino from 'pino';

/**
 * Logger configuration options
 */
export interface LoggerOptions {
  name: string;
  level?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Logger interface matching common logging patterns
 */
export interface Logger {
  debug: (msg: string, data?: Record<string, unknown>) => void;
  info: (msg: string, data?: Record<string, unknown>) => void;
  warn: (msg: string, data?: Record<string, unknown>) => void;
  error: (msg: string, error?: unknown) => void;
  child: (bindings: Record<string, unknown>) => Logger;
}

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

export type PinoLogger = pino.Logger;

/**
 * Create a logger with the specified options.
 *
 * @param options - Logger configuration with name and optional level.
 * @returns A logger instance with debug/info/warn/error methods.
 *
 * @example
 * ```ts
 * import { createLogger } from '@cinacoin/logger';
 * const log = createLogger({ name: 'project-registry-api', level: 'info' });
 * log.info('Server started', { port: 3000 });
 * log.error('Failed to connect', error);
 * ```
 */
export function createLogger(options: LoggerOptions): Logger {
  const { name, level = 'info' } = options;
  const childLogger = logger.child({ name });
  
  // Set level on child logger
  childLogger.level = level;

  return {
    debug: (msg, data) => childLogger.debug(data || {}, msg),
    info: (msg, data) => childLogger.info(data || {}, msg),
    warn: (msg, data) => childLogger.warn(data || {}, msg),
    error: (msg, error) => {
      if (error instanceof Error) {
        childLogger.error({ error: error.message, stack: error.stack }, msg);
      } else if (error !== undefined) {
        childLogger.error({ error: String(error) }, msg);
      } else {
        childLogger.error(msg);
      }
    },
    child: (bindings) => {
      const grandchild = childLogger.child(bindings);
      return {
        debug: (msg, data) => grandchild.debug(data || {}, msg),
        info: (msg, data) => grandchild.info(data || {}, msg),
        warn: (msg, data) => grandchild.warn(data || {}, msg),
        error: (msg, error) => {
          if (error instanceof Error) {
            grandchild.error({ error: error.message, stack: error.stack }, msg);
          } else if (error !== undefined) {
            grandchild.error({ error: String(error) }, msg);
          } else {
            grandchild.error(msg);
          }
        },
        child: (moreBindings) => {
          // Recursive child creation
          return createLogger({ name: `${name}:${Object.values(moreBindings).join(':')}`, level });
        },
      };
    },
  };
}

/**
 * Create a child logger with a named context (legacy API).
 *
 * @param name - The module or component name for log context.
 * @returns A pino child logger instance.
 *
 * @example
 * ```ts
 * import { createChildLogger } from '@cinacoin/logger';
 * const log = createChildLogger('adapter-tron');
 * log.info('Connected to TRON mainnet');
 * ```
 */
export function createChildLogger(name: string): PinoLogger {
  return logger.child({ name });
}

/**
 * Silent logger that discards all output.
 * Useful for testing or when logging should be suppressed.
 */
export const silentLogger: PinoLogger = logger.child({}, { level: 'silent' });

export default logger;
