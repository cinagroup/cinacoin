/**
 * Cinacoin Relay Server — Cloudflare Workers + Durable Objects
 *
 * Architecture:
 * - Worker: HTTP routes, CORS, rate limiting, WebSocket upgrade routing
 * - RelayConnection DO: One per WebSocket client connection. Terminates the
 *   WebSocket, handles the relay protocol (subscribe/unsubscribe/publish/ping),
 *   and communicates with topic DOs for message routing.
 * - RelayTopic DO: One per topic (auto-sharded). Maintains subscriber list
 *   (connection DO IDs) and fans out published messages to all subscribers.
 *
 * Protocol (compatible with core-sdk RelayTransport & CloudRelay):
 *   Client → Server: { type: 'subscribe'|'unsubscribe'|'publish'|'ping', topic?, payload?, timestamp }
 *   Server → Client: { type: 'message'|'pong'|'ack'|'error'|'subscription_ack', topic?, payload?, timestamp }
 *
 * RelayMessage compatibility: { type, topic, data, timestamp, compressed? }
 *   Outgoing messages include both `payload` (client protocol) and `data` (RelayMessage compat).
 */

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

interface Env {
  RELAY_CONNECTION: DurableObjectNamespace;
  RELAY_TOPIC: DurableObjectNamespace;
  RELAY_CACHE: KVNamespace;
  API_KEY?: string;
}

/** Client → Server message types */
type ClientMessageType = 'subscribe' | 'unsubscribe' | 'publish' | 'ping';

/** Server → Client message types */
type ServerMessageType = 'message' | 'pong' | 'ack' | 'error' | 'subscription_ack';

/** Message from client */
interface ClientMessage {
  type: ClientMessageType;
  topic?: string;
  payload?: string;
  data?: string; // RelayMessage compat
  timestamp: number;
  compressed?: boolean;
}

/** Message to client (includes both `payload` and `data` for compat) */
interface ServerMessage {
  type: ServerMessageType;
  topic: string;
  payload: string;
  data: string; // RelayMessage compat alias for payload
  timestamp: number;
  compressed?: boolean;
  message?: string; // For error type
}

/** Internal message format for DO-to-DO communication */

interface TopicSubscribeRequest {
  action: 'subscribe';
  connectionId: string;
}

interface TopicUnsubscribeRequest {
  action: 'unsubscribe';
  connectionId: string;
}

interface TopicPublishRequest {
  action: 'publish';
  message: ServerMessage;
  senderConnectionId: string;
}

type TopicAction = TopicSubscribeRequest | TopicUnsubscribeRequest | TopicPublishRequest;

/** Connection DO internal actions */
interface ConnectionDeliverRequest {
  action: 'deliver';
  message: ServerMessage;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CORS_ALLOWED_ORIGINS = [
  'https://cinacoin.com',
  'https://dash.cinacoin.com',
  'https://demo.cinacoin.com',
  'https://docs.cinacoin.com',
  'https://status.cinacoin.com',
  'https://wallet.cinacoin.com',
  'https://bridge.cinacoin.com',
  // Dev origins (uncomment as needed):
  // 'http://localhost:3000',
  // 'http://localhost:5173',
];

const RATE_LIMIT_PER_MINUTE = 100;
const MAX_MESSAGE_SIZE = 1_048_576; // 1 MB
const MAX_CONNECTIONS_PER_TOPIC = 200;
const WS_IDLE_TIMEOUT_MS = 300_000; // 5 minutes

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

function getClientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return CORS_ALLOWED_ORIGINS.includes(origin);
}

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = isAllowedOrigin(origin) ? origin : CORS_ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-Id',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function securityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '0',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  };
}

function jsonResponse(
  data: unknown,
  status = 200,
  origin: string | null = null,
): Response {
  const headers: Record<string, string> = {
    ...corsHeaders(origin),
    ...securityHeaders(),
    'Content-Type': 'application/json',
  };
  return new Response(JSON.stringify(data), { status, headers });
}

/** Build a ServerMessage with both `payload` and `data` fields for compat */
function buildServerMessage(
  type: ServerMessageType,
  topic: string,
  payload: string,
  extra?: { compressed?: boolean; message?: string },
): ServerMessage {
  return {
    type,
    topic,
    payload,
    data: payload, // RelayMessage compat
    timestamp: Date.now(),
    ...(extra?.compressed !== undefined ? { compressed: extra.compressed } : {}),
    ...(extra?.message !== undefined ? { message: extra.message } : {}),
  };
}

/** Sanitize topic: keep alphanumeric + hyphens, max 128 chars */
function sanitizeTopic(raw: string): string {
  return raw
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 128);
}

/** Validate incoming client message */
function validateClientMessage(raw: unknown): { ok: boolean; msg?: ClientMessage; error?: string } {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'message must be a JSON object' };
  }

  const obj = raw as Record<string, unknown>;
  const validTypes: string[] = ['subscribe', 'unsubscribe', 'publish', 'ping'];

  if (typeof obj.type !== 'string' || !validTypes.includes(obj.type)) {
    return { ok: false, error: `invalid type "${obj.type}" — expected: subscribe, unsubscribe, publish, ping` };
  }

  // ping doesn't require topic
  if (obj.type !== 'ping') {
    if (typeof obj.topic !== 'string' || obj.topic.length === 0) {
      return { ok: false, error: 'missing or empty "topic" field' };
    }
  }

  // publish requires payload/data
  if (obj.type === 'publish') {
    if (typeof obj.payload !== 'string' && typeof obj.data !== 'string') {
      return { ok: false, error: 'missing "payload" or "data" field' };
    }
  }

  return {
    ok: true,
    msg: {
      type: obj.type as ClientMessageType,
      topic: typeof obj.topic === 'string' ? sanitizeTopic(obj.topic) : '',
      payload: (typeof obj.payload === 'string' ? obj.payload : typeof obj.data === 'string' ? obj.data : '') as string,
      timestamp: typeof obj.timestamp === 'number' ? obj.timestamp : Date.now(),
      compressed: typeof obj.compressed === 'boolean' ? obj.compressed : false,
    },
  };
}

// ---------------------------------------------------------------------------
// Rate Limiter (per-IP, fixed window, stored in Worker isolate memory)
// ---------------------------------------------------------------------------

interface RateEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateEntry>();

function checkRateLimit(ip: string, limit: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

// ---------------------------------------------------------------------------
// Metrics (Worker-level, in-memory)
// ---------------------------------------------------------------------------

interface WorkerMetrics {
  requestCount: number;
  wsConnections: number;
  messagesReceived: number;
  messagesSent: number;
  errors: number;
  startTime: number;
}

const workerMetrics: WorkerMetrics = {
  requestCount: 0,
  wsConnections: 0,
  messagesReceived: 0,
  messagesSent: 0,
  errors: 0,
  startTime: Date.now(),
};

// ---------------------------------------------------------------------------
// Worker Entry Point
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    workerMetrics.requestCount++;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    // Rate limiting (skip for health)
    if (url.pathname !== '/health') {
      const ip = getClientIp(request);
      if (!checkRateLimit(ip, RATE_LIMIT_PER_MINUTE)) {
        return jsonResponse({ error: 'rate_limit_exceeded' }, 429, origin);
      }
    }

    // --- HTTP Routes ---

    // Health check
    if (url.pathname === '/health') {
      return jsonResponse(
        {
          status: 'ok',
          service: 'cinacoin-relay-server',
          uptime: Math.floor((Date.now() - workerMetrics.startTime) / 1000),
          connections: workerMetrics.wsConnections,
          timestamp: new Date().toISOString(),
        },
        200,
        origin,
      );
    }

    // Metrics
    if (url.pathname === '/metrics') {
      return jsonResponse(
        {
          service: 'cinacoin-relay-server',
          uptime_ms: Date.now() - workerMetrics.startTime,
          request_count: workerMetrics.requestCount,
          ws_connections: workerMetrics.wsConnections,
          messages_received: workerMetrics.messagesReceived,
          messages_sent: workerMetrics.messagesSent,
          errors: workerMetrics.errors,
          timestamp: new Date().toISOString(),
        },
        200,
        origin,
      );
    }

    // KV message store (REST API for offline message persistence)
    if (url.pathname === '/api/v1/messages' && request.method === 'POST') {
      return handleStoreMessage(request, env, origin);
    }

    if (url.pathname.startsWith('/api/v1/messages/')) {
      return handleRetrieveMessage(url, env, origin);
    }

    // --- WebSocket Upgrade ---
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader?.toLowerCase() === 'websocket') {
      // Origin check
      if (!isAllowedOrigin(origin)) {
        return jsonResponse({ error: 'origin_not_allowed' }, 403, origin);
      }

      // Route to a RelayConnection DO
      // Each connection gets a unique DO instance
      const connectionId = crypto.randomUUID();
      const connectionDOId = env.RELAY_CONNECTION.idFromName(connectionId);
      const connectionStub = env.RELAY_CONNECTION.get(connectionDOId);

      // Forward the original request to the DO with metadata headers.
      // The DO will create the WebSocketPair, acceptWebSocket(server),
      // and return a 101 response with webSocket: client — which we
      // pass through verbatim to the browser.
      const doHeaders = new Headers(request.headers);
      doHeaders.set('X-Connection-Id', connectionId);
      doHeaders.set('X-Client-Ip', getClientIp(request));
      doHeaders.set('X-Client-Origin', origin || '');

      const doRequest = new Request(request.url, {
        method: request.method,
        headers: doHeaders,
      });

      return connectionStub.fetch(doRequest);
    }

    // Root path info
    if (url.pathname === '/' || url.pathname === '/ws') {
      return jsonResponse(
        {
          service: 'cinacoin-relay-server',
          protocol: 'cinacoin-relay-v1',
          ws_endpoint: `wss://${url.host}/`,
          version: '2.0.0',
          timestamp: new Date().toISOString(),
        },
        200,
        origin,
      );
    }

    return jsonResponse({ error: 'Not found' }, 404, origin);
  },
};

// ---------------------------------------------------------------------------
// KV Message Store/Retrieve (offline message persistence)
// ---------------------------------------------------------------------------

async function handleStoreMessage(request: Request, env: Env, origin: string | null): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400, origin);
  }

  const parsed = body as Record<string, unknown>;
  const topic = parsed.topic;
  const messageId = parsed.messageId;

  if (typeof topic !== 'string' || topic.length === 0) {
    return jsonResponse({ error: 'Missing or invalid topic' }, 400, origin);
  }
  if (typeof messageId !== 'string' || messageId.length === 0) {
    return jsonResponse({ error: 'Missing or invalid messageId' }, 400, origin);
  }

  const key = `msg:${topic}:${messageId}`;
  const ttl = typeof parsed.ttl === 'number'
    ? Math.min(Math.max(parsed.ttl, 1), 3600)
    : 300;

  await env.RELAY_CACHE.put(key, JSON.stringify(body), { expirationTtl: ttl });
  return jsonResponse({ stored: true }, 201, origin);
}

async function handleRetrieveMessage(url: URL, env: Env, origin: string | null): Promise<Response> {
  const messageId = url.pathname.split('/').pop();
  if (!messageId || messageId.length === 0) {
    return jsonResponse({ error: 'Missing messageId' }, 400, origin);
  }

  const msg = await env.RELAY_CACHE.get(messageId);
  if (msg) {
    return jsonResponse(JSON.parse(msg), 200, origin);
  }
  return jsonResponse({ error: 'Not found' }, 404, origin);
}

// ---------------------------------------------------------------------------
// RelayConnection Durable Object
// ---------------------------------------------------------------------------
// One instance per WebSocket client connection.
// Terminates the WebSocket, handles relay protocol, coordinates with topic DOs.

export class RelayConnection {
  private state: DurableObjectState;
  private env: Env;
  private connectionId: string = '';
  private clientIp: string = '';
  private clientOrigin: string = '';
  private ws: WebSocket | null = null;
  private subscribedTopics: Set<string> = new Set();
  private messageCount: number = 0;
  private connectedAt: number = 0;
  private closed: boolean = false;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // --- Internal: deliver message from Topic DO ---
    if (url.pathname === '/internal/deliver' && request.method === 'POST') {
      return this.handleInternalDeliver(request);
    }

    // --- Internal: get connection info ---
    if (url.pathname === '/internal/info' && request.method === 'GET') {
      return jsonResponse({
        connectionId: this.connectionId,
        subscribedTopics: Array.from(this.subscribedTopics),
        messageCount: this.messageCount,
        connectedAt: this.connectedAt,
        alive: this.ws?.readyState === WebSocket.OPEN,
      });
    }

    // --- WebSocket Upgrade ---
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return jsonResponse({ error: 'Expected WebSocket upgrade' }, 400);
    }

    // Extract metadata
    this.connectionId = request.headers.get('X-Connection-Id') || crypto.randomUUID();
    this.clientIp = request.headers.get('X-Client-Ip') || 'unknown';
    this.clientOrigin = request.headers.get('X-Client-Origin') || '';
    this.connectedAt = Date.now();

    // Create WebSocket pair
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];

    this.ws = server;

    // Set up WebSocket event handlers
    server.addEventListener('message', (event: MessageEvent) => this.handleMessage(event));
    server.addEventListener('close', () => this.handleClose());
    server.addEventListener('error', () => this.handleClose());

    // Accept the server WebSocket via hibernation API
    this.state.acceptWebSocket(server);

    workerMetrics.wsConnections++;

    // Return the client WebSocket to the caller (propagates to browser)
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  // --- Hibernation API handlers ---

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (this.closed) return;

    this.messageCount++;
    workerMetrics.messagesReceived++;

    // Check message size
    const size = typeof message === 'string' ? message.length : message.byteLength;
    if (size > MAX_MESSAGE_SIZE) {
      this.sendToClient(buildServerMessage('error', '', '', { message: 'message too large' }));
      return;
    }

    // Convert to string
    const rawData = typeof message === 'string' ? message : new TextDecoder().decode(message);

    // Parse JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawData);
    } catch {
      this.sendToClient(buildServerMessage('error', '', '', { message: 'invalid JSON' }));
      return;
    }

    // Validate
    const validation = validateClientMessage(parsed);
    if (!validation.ok) {
      this.sendToClient(buildServerMessage('error', '', '', { message: validation.error }));
      return;
    }

    const msg = validation.msg!;

    // Handle by type
    switch (msg.type) {
      case 'ping':
        this.sendToClient(buildServerMessage('pong', '', ''));
        break;

      case 'subscribe':
        await this.handleSubscribe(msg.topic!);
        break;

      case 'unsubscribe':
        await this.handleUnsubscribe(msg.topic!);
        break;

      case 'publish':
        await this.handlePublish(msg);
        break;
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): Promise<void> {
    this.handleClose();
  }

  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    this.handleClose();
  }

  // --- Protocol handlers ---

  private async handleMessage(event: MessageEvent): Promise<void> {
    // This handles the non-hibernation path (event listeners)
    // The hibernation API (webSocketMessage) is preferred
    await this.webSocketMessage(this.ws!, event.data);
  }

  private async handleSubscribe(topic: string): Promise<void> {
    // Add to local subscriptions
    this.subscribedTopics.add(topic);

    // Tell the Topic DO about this subscription
    const topicStub = this.getTopicStub(topic);
    try {
      await topicStub.fetch('http://internal/topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe',
          connectionId: this.connectionId,
        } satisfies TopicSubscribeRequest),
      });
    } catch (err) {
      workerMetrics.errors++;
      this.sendToClient(buildServerMessage('error', topic, '', {
        message: `failed to subscribe: ${err instanceof Error ? err.message : 'unknown error'}`,
      }));
      return;
    }

    // Acknowledge subscription
    this.sendToClient(buildServerMessage('subscription_ack', topic, ''));
  }

  private async handleUnsubscribe(topic: string): Promise<void> {
    this.subscribedTopics.delete(topic);

    // Tell the Topic DO
    const topicStub = this.getTopicStub(topic);
    try {
      await topicStub.fetch('http://internal/topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'unsubscribe',
          connectionId: this.connectionId,
        } satisfies TopicUnsubscribeRequest),
      });
    } catch {
      // Best effort — ignore errors on unsubscribe
    }

    // Acknowledge
    this.sendToClient(buildServerMessage('ack', topic, ''));
  }

  private async handlePublish(msg: ClientMessage): Promise<void> {
    const topic = msg.topic!;
    const payload = msg.payload || msg.data || '';

    // Build the server message that will be broadcast to subscribers
    const serverMsg = buildServerMessage('message', topic, payload, {
      compressed: msg.compressed,
    });

    // Send to Topic DO for fan-out
    const topicStub = this.getTopicStub(topic);
    try {
      await topicStub.fetch('http://internal/topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'publish',
          message: serverMsg,
          senderConnectionId: this.connectionId,
        } satisfies TopicPublishRequest),
      });
    } catch (err) {
      workerMetrics.errors++;
      this.sendToClient(buildServerMessage('error', topic, '', {
        message: `publish failed: ${err instanceof Error ? err.message : 'unknown error'}`,
      }));
      return;
    }

    // ACK to sender
    this.sendToClient(buildServerMessage('ack', topic, ''));
    workerMetrics.messagesSent++;
  }

  private async handleInternalDeliver(request: Request): Promise<Response> {
    let delivery: ConnectionDeliverRequest;
    try {
      delivery = await request.json() as ConnectionDeliverRequest;
    } catch {
      return jsonResponse({ error: 'invalid delivery payload' }, 400);
    }

    if (delivery.action === 'deliver') {
      this.sendToClient(delivery.message);
      workerMetrics.messagesSent++;
    }

    return jsonResponse({ ok: true });
  }

  private sendToClient(msg: ServerMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && !this.closed) {
      try {
        this.ws.send(JSON.stringify(msg));
      } catch {
        // Connection may have closed
      }
    }
  }

  private getTopicStub(topic: string): DurableObjectStub {
    const topicId = this.env.RELAY_TOPIC.idFromName(topic);
    return this.env.RELAY_TOPIC.get(topicId);
  }

  private handleClose(): void {
    if (this.closed) return;
    this.closed = true;

    // Unsubscribe from all topics (best effort)
    for (const topic of this.subscribedTopics) {
      const topicStub = this.getTopicStub(topic);
      topicStub.fetch('http://internal/topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'unsubscribe',
          connectionId: this.connectionId,
        } satisfies TopicUnsubscribeRequest),
      }).catch(() => {}); // fire and forget
    }
    this.subscribedTopics.clear();
    this.ws = null;
    workerMetrics.wsConnections = Math.max(0, workerMetrics.wsConnections - 1);
  }
}

// ---------------------------------------------------------------------------
// RelayTopic Durable Object
// ---------------------------------------------------------------------------
// One instance per topic. Manages subscriber list and message fan-out.
// Subscribers are identified by their connectionId (which is also the
// RelayConnection DO name).

export class RelayTopic {
  private state: DurableObjectState;
  private env: Env;
  private subscribers: Set<string> = new Set(); // connectionIds
  private messageHistory: ServerMessage[] = [];
  private readonly MAX_HISTORY = 50;
  private readonly MAX_SUBSCRIBERS = MAX_CONNECTIONS_PER_TOPIC;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;

    // Restore persisted state
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<string[]>('subscribers');
      if (stored) this.subscribers = new Set(stored);
    });
  }

  async fetch(request: Request): Promise<Response> {
    let body: TopicAction;
    try {
      body = await request.json() as TopicAction;
    } catch {
      return jsonResponse({ error: 'invalid JSON body' }, 400);
    }

    switch (body.action) {
      case 'subscribe':
        return this.handleSubscribe(body);
      case 'unsubscribe':
        return this.handleUnsubscribe(body);
      case 'publish':
        return this.handlePublish(body);
      default:
        return jsonResponse({ error: 'unknown action' }, 400);
    }
  }

  private async handleSubscribe(body: TopicSubscribeRequest): Promise<Response> {
    const { connectionId } = body;

    if (this.subscribers.size >= this.MAX_SUBSCRIBERS) {
      return jsonResponse({ error: 'topic subscriber limit reached' }, 503);
    }

    this.subscribers.add(connectionId);
    await this.state.storage.put('subscribers', Array.from(this.subscribers));

    return jsonResponse({ ok: true, subscriberCount: this.subscribers.size });
  }

  private async handleUnsubscribe(body: TopicUnsubscribeRequest): Promise<Response> {
    this.subscribers.delete(body.connectionId);
    await this.state.storage.put('subscribers', Array.from(this.subscribers));

    return jsonResponse({ ok: true, subscriberCount: this.subscribers.size });
  }

  private async handlePublish(body: TopicPublishRequest): Promise<Response> {
    const { message, senderConnectionId } = body;

    // Store in history
    this.messageHistory.push(message);
    if (this.messageHistory.length > this.MAX_HISTORY) {
      this.messageHistory.shift();
    }

    // Fan out to all subscribers except sender
    const deliveryPromises: Promise<Response>[] = [];

    for (const connId of this.subscribers) {
      if (connId === senderConnectionId) continue;

      deliveryPromises.push(
        this.deliverToConnection(connId, message).catch((err) => {
          // Remove dead subscribers on delivery failure
          this.subscribers.delete(connId);
          return new Response(null, { status: 500 });
        }),
      );
    }

    // Wait for all deliveries (with timeout)
    if (deliveryPromises.length > 0) {
      this.state.waitUntil(
        Promise.allSettled(deliveryPromises).then(() =>
          this.state.storage.put('subscribers', Array.from(this.subscribers)),
        ),
      );
    }

    return jsonResponse({
      ok: true,
      delivered: deliveryPromises.length,
      totalSubscribers: this.subscribers.size,
    });
  }

  private async deliverToConnection(connectionId: string, message: ServerMessage): Promise<Response> {
    const connDOId = this.env.RELAY_CONNECTION.idFromName(connectionId);
    const connStub = this.env.RELAY_CONNECTION.get(connDOId);

    return connStub.fetch('http://internal/deliver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'deliver',
        message,
      } satisfies ConnectionDeliverRequest),
    });
  }
}
