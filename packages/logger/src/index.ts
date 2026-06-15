// Detect environment: Cloudflare Workers vs Node.js
const isWorkers = typeof process === 'undefined' || !process?.env;

let pinoModule: any = null;
if (!isWorkers) {
  try {
    pinoModule = require('pino');
  } catch {
    // pino not available, will use fallback
  }
}

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

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

function getLogLevel(): string {
  if (typeof process !== 'undefined' && process?.env?.LOG_LEVEL) {
    return process.env.LOG_LEVEL;
  }
  return 'info';
}

/**
 * Fallback logger for Cloudflare Workers (no pino dependency)
 */
function createFallbackLogger(options: LoggerOptions): Logger {
  const { name, level = 'info' } = options;
  const minLevel = LOG_LEVELS[level] ?? LOG_LEVELS.info;

  function log(lvl: string, msg: string, data?: unknown) {
    if ((LOG_LEVELS as any)[lvl] < minLevel) return;
    const entry: Record<string, unknown> = { level: lvl, name, msg, time: new Date().toISOString() };
    if (data && typeof data === 'object') Object.assign(entry, data);
    else if (data !== undefined) entry.data = data;
    const output = JSON.stringify(entry);
    if (lvl === 'error') console.error(output);
    else if (lvl === 'warn') console.warn(output);
    else console.log(output);
  }

  return {
    debug: (msg, data) => log('debug', msg, data),
    info: (msg, data) => log('info', msg, data),
    warn: (msg, data) => log('warn', msg, data),
    error: (msg, error) => {
      if (error instanceof Error) log('error', msg, { error: error.message, stack: error.stack });
      else if (error !== undefined) log('error', msg, { error: String(error) });
      else log('error', msg);
    },
    child: (bindings) => createFallbackLogger({ name: `${name}:${Object.values(bindings).join(':')}`, level }),
  };
}

/**
 * Default logger instance for the Cinacoin SDK.
 * Uses pino in Node.js, fallback structured logger in Workers.
 */
export const logger: Logger & { level?: string } = isWorkers || !pinoModule
  ? createFallbackLogger({ name: 'app', level: getLogLevel() })
  : pinoModule({
      level: getLogLevel(),
      transport:
        (typeof process !== 'undefined' && process?.env?.NODE_ENV !== 'production')
          ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' } }
          : undefined,
    });

export type PinoLogger = Logger;

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
 * const log = createChildLogger('adapter-eth');
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
