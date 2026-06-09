/**
 * Structured logging for Cloudflare Workers
 * Outputs JSON logs compatible with Cloudflare Logpush and analytics tools
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  method?: string;
  path?: string;
  status?: number;
  duration?: number;
  clientIp?: string;
  userAgent?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, unknown>;
}

export class Logger {
  private level: LogLevel;
  private serviceName: string;

  constructor(options: { level?: LogLevel; serviceName?: string } = {}) {
    this.level = options.level || 'info';
    this.serviceName = options.serviceName || 'api-gateway';
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private formatEntry(entry: LogEntry): string {
    return JSON.stringify({
      ...entry,
      service: this.serviceName,
    });
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog('debug')) return;
    this.log('debug', message, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog('info')) return;
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog('warn')) return;
    this.log('warn', message, metadata);
  }

  error(message: string, error?: Error | unknown, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog('error')) return;
    
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : undefined;

    this.log('error', message, { ...metadata, error: errorData });
  }

  /**
   * Log HTTP request/response
   */
  httpRequest(entry: {
    requestId: string;
    method: string;
    path: string;
    status: number;
    duration: number;
    clientIp?: string;
    userAgent?: string;
  }): void {
    const level = entry.status >= 500 ? 'error' : entry.status >= 400 ? 'warn' : 'info';
    this.log(level, `${entry.method} ${entry.path} ${entry.status}`, {
      requestId: entry.requestId,
      method: entry.method,
      path: entry.path,
      status: entry.status,
      duration: entry.duration,
      clientIp: entry.clientIp,
      userAgent: entry.userAgent,
    });
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...metadata,
    };

    const output = this.formatEntry(entry);

    switch (level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'debug':
        console.debug(output);
        break;
      default:
        console.log(output);
    }
  }
}

/**
 * Create a logger instance
 */
export function createLogger(options?: { level?: LogLevel; serviceName?: string }): Logger {
  return new Logger(options);
}
