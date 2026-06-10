/**
 * Lightweight logger compatible with Cloudflare Workers (no process/pino dependency)
 */

export interface LoggerOptions {
  name: string;
  level?: 'debug' | 'info' | 'warn' | 'error';
}

export interface Logger {
  debug: (msg: string, data?: Record<string, unknown>) => void;
  info: (msg: string, data?: Record<string, unknown>) => void;
  warn: (msg: string, data?: Record<string, unknown>) => void;
  error: (msg: string, error?: unknown) => void;
  child: (bindings: Record<string, unknown>) => Logger;
}

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

function getEnvVar(key: string): string | undefined {
  // Workers use globalThis, Node uses process.env
  if (typeof globalThis !== 'undefined' && (globalThis as any).__ENV__) {
    return (globalThis as any).__ENV__[key];
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
}

function createBaseLogger(options: LoggerOptions): Logger {
  const { name, level = 'info' } = options;
  const minLevel = LOG_LEVELS[level] ?? LOG_LEVELS.info;

  function log(lvl: string, msg: string, data?: unknown) {
    if ((LOG_LEVELS as any)[lvl] < minLevel) return;

    const entry: Record<string, unknown> = {
      level: lvl,
      name,
      msg,
      time: new Date().toISOString(),
    };

    if (data && typeof data === 'object') {
      Object.assign(entry, data);
    } else if (data !== undefined) {
      entry.data = data;
    }

    const output = JSON.stringify(entry);
    if (lvl === 'error') {
      console.error(output);
    } else if (lvl === 'warn') {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  return {
    debug: (msg, data) => log('debug', msg, data),
    info: (msg, data) => log('info', msg, data),
    warn: (msg, data) => log('warn', msg, data),
    error: (msg, error) => {
      if (error instanceof Error) {
        log('error', msg, { error: error.message, stack: error.stack });
      } else if (error !== undefined) {
        log('error', msg, { error: String(error) });
      } else {
        log('error', msg);
      }
    },
    child: (bindings) => {
      const childName = `${name}:${Object.values(bindings).join(':')}`;
      return createBaseLogger({ name: childName, level });
    },
  };
}

export function createLogger(options: LoggerOptions): Logger {
  return createBaseLogger(options);
}

export const logger = createBaseLogger({
  name: 'app',
  level: getEnvVar('LOG_LEVEL') || 'info',
});

export function createChildLogger(name: string): Logger {
  return createBaseLogger({ name });
}

export const silentLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  child: () => silentLogger,
};

export default logger;
