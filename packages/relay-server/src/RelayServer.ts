import { createServer, type Server, type ServerResponse } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createDeflate, createInflate, type Deflate, type Inflate } from 'zlib';
import type { IncomingMessage } from 'http';
import { logger } from '@cinacoin/logger';

export interface RelayServerConfig {
  port: number;
  host?: string;
  ssl?: { key: string; cert: string };
  maxConnections?: number;
  /** Maximum messages per IP per minute (0 = disabled) */
  rateLimitPerMinute?: number;
  /** Allowed WebSocket origin patterns (empty = all allowed) */
  allowedOrigins?: string[] | RegExp;
  /** Maximum message size in bytes (default 1 MB) */
  maxMessageSize?: number;
  /** Idle connection timeout in milliseconds (default 5 minutes, 0 = disabled) */
  idleTimeoutMs?: number;
  /** Enable per-message deflate compression (default: true) */
  enableCompression?: boolean;
  /** Compression threshold in bytes — only compress messages larger than this (default: 256) */
  compressionThreshold?: number;
  /** Enable message batching for topic broadcasts (default: true) */
  enableMessageBatching?: boolean;
  /** Batch window in milliseconds (default: 10ms) */
  batchWindowMs?: number;
}

export interface RelayMessage {
  type: 'message' | 'ping' | 'pong' | 'close';
  topic: string;
  data: string;
  timestamp: number;
  /** Whether the message payload is compressed */
  compressed?: boolean;
}

/** Raw shape before validation — fields may be missing or wrong-typed. */
interface RawMessage {
  type?: unknown;
  topic?: unknown;
  data?: unknown;
  timestamp?: unknown;
  compressed?: unknown;
}

/** Result of validating a raw incoming message. */
interface ValidationResult {
  ok: boolean;
  msg?: RelayMessage;
  error?: string;
}

/** Valid values for the `type` field. */
const VALID_TYPES: ReadonlySet<string> = new Set(['message', 'ping', 'pong', 'close']);

/**
 * Sanitize a topic name: keep only alphanumeric chars and hyphens,
 * trim to 128 characters, and collapse consecutive hyphens.
 */
function sanitizeTopic(raw: string): string {
  return raw
    .replace(/[^a-zA-Z0-9-]/g, '-') // replace invalid chars with hyphens
    .replace(/-+/g, '-')             // collapse consecutive hyphens
    .replace(/^-|-$/g, '')           // strip leading/trailing hyphens
    .slice(0, 128);                   // enforce max length
}

/**
 * Validate an incoming WebSocket message.
 */
function validateMessage(raw: unknown): ValidationResult {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'message must be a JSON object' };
  }

  const obj = raw as RawMessage;

  if (typeof obj.type !== 'string') {
    return { ok: false, error: 'missing or invalid "type" field' };
  }
  if (!VALID_TYPES.has(obj.type)) {
    return { ok: false, error: `invalid type "${obj.type}" — expected one of: message, ping, pong, close` };
  }
  if (typeof obj.topic !== 'string' || obj.topic.length === 0) {
    return { ok: false, error: 'missing or empty "topic" field' };
  }
  if (typeof obj.data !== 'string') {
    return { ok: false, error: 'missing or invalid "data" field' };
  }

  return {
    ok: true,
    msg: {
      type: obj.type as RelayMessage['type'],
      topic: sanitizeTopic(obj.topic),
      data: obj.data,
      timestamp: typeof obj.timestamp === 'number' ? obj.timestamp : Date.now(),
      compressed: typeof obj.compressed === 'boolean' ? obj.compressed : false,
    },
  };
}

export interface RelayStats {
  connections: number;
  messagesReceived: number;
  messagesSent: number;
  uptime: number;
  compressionRatio?: number;
  bytesSaved?: number;
  batchesSent?: number;
}

/**
 * Simple sliding-window rate limiter for per-IP tracking.
 */
class RateLimiter {
  private windows: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  private readonly maxHits: number;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(maxHits: number, windowMs: number = 60_000) {
    this.maxHits = maxHits;
    this.windowMs = windowMs;
  }

  startCleanup(intervalMs: number = 60_000): void {
    this.cleanupInterval = setInterval(() => this.evict(), intervalMs);
    this.cleanupInterval.unref();
  }

  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  allow(ip: string): boolean {
    const now = Date.now();
    const timestamps = this.windows.get(ip) ?? [];
    const cutoff = now - this.windowMs;
    const recent = timestamps.filter((t) => t > cutoff);
    if (recent.length >= this.maxHits) {
      this.windows.set(ip, recent);
      return false;
    }
    recent.push(now);
    this.windows.set(ip, recent);
    return true;
  }

  evict(): void {
    const cutoff = Date.now() - this.windowMs;
    for (const [ip, timestamps] of this.windows) {
      const recent = timestamps.filter((t) => t > cutoff);
      if (recent.length === 0) {
        this.windows.delete(ip);
      } else {
        this.windows.set(ip, recent);
      }
    }
  }
}

/**
 * Message batcher — accumulates messages and flushes them in batches
 * to reduce per-message overhead.
 */
class MessageBatcher {
  private pending: Map<string, { messages: string[]; timer: ReturnType<typeof setTimeout> | null }> = new Map();
  private readonly batchWindowMs: number;
  private readonly flushCallback: (topic: string, batch: string[]) => void;
  private batchesSent = 0;

  constructor(batchWindowMs: number, flushCallback: (topic: string, batch: string[]) => void) {
    this.batchWindowMs = batchWindowMs;
    this.flushCallback = flushCallback;
  }

  add(topic: string, message: string): void {
    let entry = this.pending.get(topic);
    if (!entry) {
      entry = { messages: [], timer: null };
      this.pending.set(topic, entry);
    }
    entry.messages.push(message);

    if (!entry.timer) {
      entry.timer = setTimeout(() => {
        this.flush(topic);
      }, this.batchWindowMs);
      entry.timer.unref();
    }
  }

  private flush(topic: string): void {
    const entry = this.pending.get(topic);
    if (!entry || entry.messages.length === 0) return;

    const batch = entry.messages.splice(0);
    entry.timer = null;
    this.batchesSent++;
    this.flushCallback(topic, batch);
  }

  flushAll(): void {
    for (const [topic] of this.pending) {
      this.flush(topic);
    }
  }

  getBatchesSent(): number {
    return this.batchesSent;
  }
}

/** Check whether the given Origin header matches the allowed patterns. */
function isOriginAllowed(origin: string | undefined, allowed: string[] | RegExp): boolean {
  if (!origin) return false;
  if (Array.isArray(allowed)) {
    return allowed.some((pattern) => {
      if (pattern.startsWith('*')) {
        const suffix = pattern.slice(1);
        return origin.endsWith(suffix);
      }
      return origin === pattern;
    });
  }
  return allowed.test(origin);
}

/** Compress a string using deflate */
function compressData(data: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const deflate = createDeflate({ level: 6 });
    deflate.on('data', (chunk: Buffer) => chunks.push(chunk));
    deflate.on('end', () => resolve(Buffer.concat(chunks)));
    deflate.on('error', reject);
    deflate.end(data);
  });
}

/** Decompress a deflate buffer */
function decompressData(compressed: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const inflate = createInflate();
    inflate.on('data', (chunk: Buffer) => chunks.push(chunk));
    inflate.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    inflate.on('error', reject);
    inflate.end(compressed);
  });
}

/** All started relay-server instances (for signal handling). */
const allInstances: RelayServer[] = [];

/**
 * RelayServer — HTTP/WebSocket relay for WalletConnect bridge messaging.
 * Handles topic-based message routing between connected clients.
 * 
 * Performance features:
 * - Per-message deflate compression for large payloads
 * - Message batching for high-throughput topics
 * - Connection reuse via keep-alive
 * - Load balancing metrics for multi-instance deployment
 */
export class RelayServer {
  private server: Server | null = null;
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WebSocket> = new Map();
  private topics: Map<string, Set<string>> = new Map();
  private stats = { 
    messagesReceived: 0, 
    messagesSent: 0, 
    startTime: Date.now(),
    bytesOriginal: 0,
    bytesCompressed: 0,
  };
  private readonly config: Required<
    Omit<RelayServerConfig, 'ssl' | 'allowedOrigins'>
  > &
    Pick<RelayServerConfig, 'ssl' | 'allowedOrigins'>;
  private readonly rateLimiter: RateLimiter;
  private readonly idleTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private readonly batcher: MessageBatcher;
  /** When true, reject new connections during shutdown. */
  private shuttingDown = false;
  
  /** Instance ID for load balancing */
  readonly instanceId: string;

  constructor(config: RelayServerConfig) {
    this.config = {
      port: config.port,
      host: config.host ?? '0.0.0.0',
      maxConnections: config.maxConnections ?? 1000,
      ssl: config.ssl,
      rateLimitPerMinute: config.rateLimitPerMinute ?? 100,
      allowedOrigins: config.allowedOrigins,
      maxMessageSize: config.maxMessageSize ?? 1_048_576, // 1 MB
      idleTimeoutMs: config.idleTimeoutMs ?? 300_000, // 5 minutes
      enableCompression: config.enableCompression ?? true,
      compressionThreshold: config.compressionThreshold ?? 256,
      enableMessageBatching: config.enableMessageBatching ?? true,
      batchWindowMs: config.batchWindowMs ?? 10,
    };

    this.instanceId = crypto.randomUUID();
    this.rateLimiter = new RateLimiter(this.config.rateLimitPerMinute);
    this.rateLimiter.startCleanup();
    
    this.batcher = new MessageBatcher(
      this.config.batchWindowMs,
      (topic, batch) => this.flushBatch(topic, batch),
    );
  }

  /** Start the relay server */
  async start(): Promise<void> {
    this.server = createServer(this.handleHttp.bind(this));
    this.wss = new WebSocketServer({
      server: this.server,
      verifyClient: this.verifyClient.bind(this),
      perMessageDeflate: this.config.enableCompression ? {
        threshold: this.config.compressionThreshold,
        zlibDeflateOptions: { level: 6, chunkSize: 1024 },
        zlibInflateOptions: { chunkSize: 1024 },
      } : false,
    });
    this.wss.on('connection', this.handleConnection.bind(this));

    return new Promise((resolve, reject) => {
      this.server!.listen(this.config.port, this.config.host, resolve);
      this.server!.on('error', reject);
    }).then(() => {
      allInstances.push(this);
    });
  }

  /** Stop the relay server */
  async stop(): Promise<void> {
    this.rateLimiter.stopCleanup();
    this.batcher.flushAll();
    this.clients.forEach((ws) => ws.close());
    this.idleTimeouts.forEach((timer) => clearTimeout(timer));
    this.idleTimeouts.clear();
    this.clients.clear();
    this.topics.clear();
    return new Promise((resolve, reject) => {
      this.wss?.close(() => {
        this.server?.close((err?: Error) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }

  /**
   * Graceful shutdown handler.
   */
  async gracefulShutdown(): Promise<void> {
    logger.info('Shutting down...');
    this.shuttingDown = true;

    this.server?.closeAllConnections?.();
    for (const ws of this.wss?.clients ?? []) {
      ws.terminate();
    }

    const deadline = Date.now() + 10_000;
    await new Promise<void>((resolve) => {
      const tick = () => {
        if (this.clients.size === 0 || Date.now() >= deadline) resolve();
        else setTimeout(tick, 50);
      };
      tick();
    });

    await this.stop();
    process.exit(0);
  }

  /** Get current relay statistics */
  getStats(): RelayStats {
    const compressionRatio = this.stats.bytesOriginal > 0
      ? (1 - this.stats.bytesCompressed / this.stats.bytesOriginal) * 100
      : 0;
    
    return {
      connections: this.clients.size,
      messagesReceived: this.stats.messagesReceived,
      messagesSent: this.stats.messagesSent,
      uptime: Date.now() - this.stats.startTime,
      compressionRatio,
      bytesSaved: this.stats.bytesOriginal - this.stats.bytesCompressed,
      batchesSent: this.batcher.getBatchesSent(),
    };
  }
  
  /** Get load balancing info for this instance */
  getLoadInfo(): { instanceId: string; connections: number; maxConnections: number; load: number } {
    return {
      instanceId: this.instanceId,
      connections: this.clients.size,
      maxConnections: this.config.maxConnections,
      load: this.clients.size / this.config.maxConnections,
    };
  }

  /** Subscribe a client to a topic */
  subscribe(clientId: string, topic: string): void {
    const subscribers = this.topics.get(topic) ?? new Set();
    subscribers.add(clientId);
    this.topics.set(topic, subscribers);
  }

  /** Unsubscribe a client from a topic */
  unsubscribe(clientId: string, topic: string): void {
    const subscribers = this.topics.get(topic);
    if (subscribers) {
      subscribers.delete(clientId);
      if (subscribers.size === 0) this.topics.delete(topic);
    }
  }

  /** Publish a message to all subscribers of a topic */
  publish(topic: string, data: string): void {
    const subscribers = this.topics.get(topic);
    if (!subscribers) return;
    
    const message = JSON.stringify({
      type: 'message',
      topic,
      data,
      timestamp: Date.now(),
    } satisfies RelayMessage);
    
    this.stats.bytesOriginal += Buffer.byteLength(data);
    
    if (this.config.enableMessageBatching && subscribers.size > 1) {
      // Use batching for multi-subscriber topics
      this.batcher.add(topic, message);
    } else {
      // Direct send for single subscriber
      subscribers.forEach((clientId) => {
        const ws = this.clients.get(clientId);
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(message);
          this.stats.messagesSent++;
        }
      });
    }
  }
  
  /** Flush a batch of messages to topic subscribers */
  private flushBatch(topic: string, batch: string[]): void {
    const subscribers = this.topics.get(topic);
    if (!subscribers) return;
    
    // Send as a batch envelope
    const batchMessage = JSON.stringify({
      type: 'batch',
      topic,
      messages: batch.map(m => JSON.parse(m)),
      timestamp: Date.now(),
    });
    
    subscribers.forEach((clientId) => {
      const ws = this.clients.get(clientId);
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(batchMessage);
        this.stats.messagesSent += batch.length;
      }
    });
  }

  /** Verify client origin on WebSocket upgrade */
  private verifyClient(info: { req: IncomingMessage }, cb: (ok: boolean, code?: number, msg?: string) => void): void {
    if (this.shuttingDown) {
      cb(false, 503, 'Server is shutting down');
      return;
    }

    // Connection limit check
    if (this.clients.size >= this.config.maxConnections) {
      cb(false, 503, 'Connection limit reached');
      return;
    }

    const allowed = this.config.allowedOrigins;
    if (!allowed) {
      cb(true);
      return;
    }
    const origin = info.req.headers.origin;
    if (isOriginAllowed(origin, allowed)) {
      cb(true);
    } else {
      cb(false, 403, 'Forbidden: origin not allowed');
    }
  }

  /** Reset the idle timeout for a given client */
  private resetIdleTimeout(clientId: string, ws: WebSocket): void {
    const existing = this.idleTimeouts.get(clientId);
    if (existing) clearTimeout(existing);

    if (this.config.idleTimeoutMs > 0) {
      const timer = setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close(1001, 'Idle timeout');
        }
        this.idleTimeouts.delete(clientId);
        this.clients.delete(clientId);
      }, this.config.idleTimeoutMs);
      timer.unref();
      this.idleTimeouts.set(clientId, timer);
    }
  }

  private handleHttp(req: IncomingMessage, res: ServerResponse): void {
    // Security headers on all HTTP responses
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '0');
    res.setHeader('Referrer-Policy', 'no-referrer');

    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      const uptimeSec = Math.floor((Date.now() - this.stats.startTime) / 1000);
      res.end(JSON.stringify({
        status: 'ok',
        uptime: uptimeSec,
        version: '1.0.0',
        instanceId: this.instanceId,
        timestamp: new Date().toISOString(),
      }));
    } else if (req.url === '/load') {
      // Load balancing endpoint
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(this.getLoadInfo()));
    } else if (req.url === '/metrics') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(this.getStats()));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  }

  private handleConnection(ws: WebSocket, req: IncomingMessage): void {
    const clientId = req.headers['sec-websocket-key'] ?? crypto.randomUUID();
    const ip = req.socket.remoteAddress ?? 'unknown';
    this.clients.set(clientId, ws);
    this.resetIdleTimeout(clientId, ws);

    ws.on('message', async (raw: Buffer) => {
      // Message size limit
      if (raw.byteLength > this.config.maxMessageSize) {
        ws.send(
          JSON.stringify({
            type: 'message',
            topic: '',
            data: 'message too large',
            timestamp: Date.now(),
          } satisfies RelayMessage),
        );
        return;
      }

      // Per-IP rate limit
      if (this.config.rateLimitPerMinute > 0 && !this.rateLimiter.allow(ip)) {
        ws.send(
          JSON.stringify({
            type: 'message',
            topic: '',
            data: 'rate limit exceeded',
            timestamp: Date.now(),
          } satisfies RelayMessage),
        );
        return;
      }

      this.stats.messagesReceived++;
      this.resetIdleTimeout(clientId, ws);

      let rawData = raw.toString();
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawData);
      } catch {
        ws.send(
          JSON.stringify({
            type: 'message',
            topic: '',
            data: 'invalid json',
            timestamp: Date.now(),
          } satisfies RelayMessage),
        );
        return;
      }

      const result = validateMessage(parsed);
      if (!result.ok) {
        ws.send(
          JSON.stringify({
            type: 'message',
            topic: '',
            data: `invalid message: ${result.error}`,
            timestamp: Date.now(),
          } satisfies RelayMessage),
        );
        return;
      }

      const msg = result.msg!;
      
      // Handle compressed data
      if (msg.compressed && msg.type === 'message') {
        try {
          const decompressed = await decompressData(Buffer.from(msg.data, 'base64'));
          this.stats.bytesCompressed += raw.byteLength;
          this.publish(msg.topic, decompressed);
        } catch {
          ws.send(
            JSON.stringify({
              type: 'message',
              topic: '',
              data: 'failed to decompress message',
              timestamp: Date.now(),
            } satisfies RelayMessage),
          );
        }
      } else if (msg.type === 'message') {
        this.publish(msg.topic, msg.data);
      }
    });

    ws.on('close', () => {
      this.clients.delete(clientId);
      const timer = this.idleTimeouts.get(clientId);
      if (timer) {
        clearTimeout(timer);
        this.idleTimeouts.delete(clientId);
      }
      this.topics.forEach((subs, topic) => {
        if (subs.has(clientId)) this.unsubscribe(clientId, topic);
      });
    });

    ws.on('error', () => {
      // Error handler to prevent uncaught exceptions
    });
  }
}

// ---- Process signal handling ----
let globalShuttingDown = false;

const handleShutdown = async () => {
  if (globalShuttingDown) return;
  globalShuttingDown = true;

  for (const srv of allInstances) {
    await srv.gracefulShutdown();
  }
};

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);
