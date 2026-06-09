/**
 * Logger utility
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  service: string;
  [key: string]: unknown;
}

export function createLogger(serviceName: string) {
  const levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

  function shouldLog(level: LogLevel): boolean {
    return levelPriority[level] >= levelPriority[currentLevel];
  }

  function formatEntry(level: LogLevel, message: string, meta?: Record<string, unknown>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: serviceName,
      ...meta,
    };
  }

  return {
    debug(message: string, meta?: Record<string, unknown>) {
      if (shouldLog('debug')) {
        console.log(JSON.stringify(formatEntry('debug', message, meta)));
      }
    },

    info(message: string, meta?: Record<string, unknown>) {
      if (shouldLog('info')) {
        console.log(JSON.stringify(formatEntry('info', message, meta)));
      }
    },

    warn(message: string, meta?: Record<string, unknown>) {
      if (shouldLog('warn')) {
        console.warn(JSON.stringify(formatEntry('warn', message, meta)));
      }
    },

    error(message: string, error?: unknown, meta?: Record<string, unknown>) {
      if (shouldLog('error')) {
        const errorMeta = error instanceof Error 
          ? { error: error.message, stack: error.stack, ...meta }
          : meta;
        console.error(JSON.stringify(formatEntry('error', message, errorMeta)));
      }
    },
  };
}
