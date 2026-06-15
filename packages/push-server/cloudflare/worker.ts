/**
 * Cinacoin Push Server — Cloudflare Worker (D1 + KV)
 *
 * Push notification delivery via APNs (iOS) and FCM (Android).
 * Device registration stored in D1, rate limiting via KV.
 *
 * API Routes:
 *   POST   /devices/register  — Register device (platform, token, userId)
 *   DELETE /devices/:id       — Unregister device
 *   GET    /devices/:userId   — Get user device list
 *   POST   /push/send        — Send push notification
 *   POST   /push/batch       — Batch push
 *   GET    /health           — Health check
 *   GET    /metrics          — Metrics endpoint
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Env {
  PUSH_DB: D1Database;
  RATE_LIMITS: KVNamespace;
  PUSH_QUEUE?: Queue;
  API_KEY?: string;
  FCM_PROJECT_ID?: string;
  FCM_SERVICE_ACCOUNT_KEY?: string;
  APNS_KEY_ID?: string;
  APNS_TEAM_ID?: string;
  APNS_BUNDLE_ID?: string;
  APNS_PRIVATE_KEY?: string;
  APNS_PRODUCTION?: string;
  CORS_ORIGINS?: string;
}

interface DeviceRecord {
  id: string;
  user_id: string;
  platform: 'fcm' | 'apns';
  token: string;
  created_at: number;
  updated_at: number;
}

interface PushPayload {
  deviceId?: string;
  userId?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  platform?: 'fcm' | 'apns';
}

interface DeliveryResult {
  deviceId: string;
  success: boolean;
  message: string;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RATE_LIMIT_MAX = 100; // requests per minute per IP
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_BATCH_SIZE = 100;
const MAX_TOKEN_LENGTH = 4096;
const MAX_TITLE_LENGTH = 256;
const MAX_BODY_LENGTH = 4096;

const DEFAULT_CORS_ORIGINS = [
  'https://cinacoin.com',
  'https://dash.cinacoin.com',
  'https://demo.cinacoin.com',
];

const START_TIME = Date.now();
let requestCount = 0;
let errorCount = 0;
let successDeliveryCount = 0;
let failedDeliveryCount = 0;

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function generateId(): string {
  return crypto.randomUUID();
}

function getClientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const aBuf = new TextEncoder().encode(a);
  const bBuf = new TextEncoder().encode(b);
  let result = 0;
  for (let i = 0; i < aBuf.length; i++) result |= aBuf[i] ^ bBuf[i];
  return result === 0;
}

function getCorsOrigins(env: Env): string[] {
  if (env.CORS_ORIGINS) {
    return env.CORS_ORIGINS.split(',').map((s) => s.trim());
  }
  return DEFAULT_CORS_ORIGINS;
}

function isAllowedOrigin(origin: string | null, env: Env): boolean {
  if (!origin) return false;
  return getCorsOrigins(env).includes(origin);
}

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allowed = isAllowedOrigin(origin, env) ? origin : getCorsOrigins(env)[0];
  return {
    'Access-Control-Allow-Origin': allowed || '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  };
}

function jsonOk(data: unknown, origin: string | null, env: Env, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(origin, env), 'Content-Type': 'application/json' },
  });
}

function jsonError(message: string, status: number, origin: string | null, env: Env): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders(origin, env), 'Content-Type': 'application/json' },
  });
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

function verifyApiKey(request: Request, env: Env): boolean {
  const apiKey = env.API_KEY;
  if (!apiKey) return true; // skip if not configured (dev mode)
  const auth = request.headers.get('Authorization');
  if (!auth) return false;
  const expected = `Bearer ${apiKey}`;
  return constantTimeCompare(auth, expected) || constantTimeCompare(auth, apiKey);
}

// ---------------------------------------------------------------------------
// Rate Limiting (KV-backed)
// ---------------------------------------------------------------------------

async function checkRateLimit(ip: string, env: Env): Promise<{ allowed: boolean; retryAfter?: number }> {
  const key = `rate:${ip}`;
  const now = Date.now();

  const raw = await env.RATE_LIMITS.get(key, 'json') as { count: number; resetAt: number } | null;

  if (!raw || now > raw.resetAt) {
    await env.RATE_LIMITS.put(key, JSON.stringify({ count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS }), {
      expirationTtl: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000) + 10,
    });
    return { allowed: true };
  }

  if (raw.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((raw.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  raw.count++;
  await env.RATE_LIMITS.put(key, JSON.stringify(raw), {
    expirationTtl: Math.ceil((raw.resetAt - now) / 1000) + 10,
  });
  return { allowed: true };
}

// ---------------------------------------------------------------------------
// FCM Push (HTTP v1 API via fetch)
// ---------------------------------------------------------------------------

async function sendFcm(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>,
  env?: Env,
): Promise<{ success: boolean; message: string }> {
  // In production, obtain an OAuth2 access token using the service account key
  // and POST to https://fcm.googleapis.com/v1/projects/{projectId}/messages:send
  //
  // For now, we validate config presence and simulate delivery.
  if (!env?.FCM_PROJECT_ID) {
    // Simulated delivery for dev/test
    return {
      success: true,
      message: `FCM notification sent to ${token.slice(0, 8)}...`,
    };
  }

  try {
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${env.FCM_PROJECT_ID}/messages:send`;

    const fcmMessage = {
      message: {
        token,
        notification: { title, body },
        data: data ?? {},
      },
    };

    // In production: get access token from service account
    // const accessToken = await getFcmAccessToken(env);
    const response = await fetch(fcmUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(fcmMessage),
    });

    if (!response.ok) {
      const errBody = await response.text();
      return { success: false, message: `FCM error: ${response.status} ${errBody}` };
    }

    return { success: true, message: `FCM notification sent to ${token.slice(0, 8)}...` };
  } catch (err) {
    return { success: false, message: `FCM delivery failed: ${(err as Error).message}` };
  }
}

// ---------------------------------------------------------------------------
// APNs Push (HTTP/2 via fetch — token-based auth)
// ---------------------------------------------------------------------------

async function sendApns(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>,
  env?: Env,
): Promise<{ success: boolean; message: string }> {
  // In production, build a JWT (ES256) signed with the APNs P8 key,
  // then POST to https://api.push.apple.com/3/device/{token}
  //
  // For now, we validate config presence and simulate delivery.
  if (!env?.APNS_KEY_ID || !env?.APNS_TEAM_ID || !env?.APNS_BUNDLE_ID) {
    // Simulated delivery for dev/test
    return {
      success: true,
      message: `APNs notification sent to ${token.slice(0, 8)}...`,
    };
  }

  try {
    const host = env.APNS_PRODUCTION === 'true'
      ? 'https://api.push.apple.com'
      : 'https://api.sandbox.push.apple.com';

    const apnsUrl = `${host}/3/device/${token}`;

    const payload = {
      aps: {
        alert: { title, body },
        badge: 1,
        sound: 'default',
      },
      data: data ?? {},
    };

    // In production: generate JWT bearer token
    // const jwt = generateApnsJwt(env);
    const response = await fetch(apnsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'authorization': `bearer ${jwt}`,
        'apns-topic': env.APNS_BUNDLE_ID,
        'apns-push-type': 'alert',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errBody = await response.text();
      return { success: false, message: `APNs error: ${response.status} ${errBody}` };
    }

    return { success: true, message: `APNs notification sent to ${token.slice(0, 8)}...` };
  } catch (err) {
    return { success: false, message: `APNs delivery failed: ${(err as Error).message}` };
  }
}

// ---------------------------------------------------------------------------
// Delivery dispatcher
// ---------------------------------------------------------------------------

async function deliverToToken(
  platform: 'fcm' | 'apns',
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>,
  env?: Env,
): Promise<{ success: boolean; message: string }> {
  if (platform === 'fcm') {
    return sendFcm(token, title, body, data, env);
  } else {
    return sendApns(token, title, body, data, env);
  }
}

// ---------------------------------------------------------------------------
// Route Handlers
// ---------------------------------------------------------------------------

/**
 * POST /devices/register
 * Body: { platform: 'fcm' | 'apns', token: string, userId: string }
 */
async function handleRegisterDevice(request: Request, env: Env, origin: string | null): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON', 400, origin, env);
  }

  const req = body as Record<string, unknown>;
  const platform = req.platform as string;
  const token = req.token as string;
  const userId = req.userId as string;

  // Validate
  if (!platform || !token || !userId) {
    return jsonError('Missing required fields: platform, token, userId', 400, origin, env);
  }
  if (platform !== 'fcm' && platform !== 'apns') {
    return jsonError('platform must be "fcm" or "apns"', 400, origin, env);
  }
  if (typeof token !== 'string' || token.length === 0) {
    return jsonError('token must be a non-empty string', 400, origin, env);
  }
  if (token.length > MAX_TOKEN_LENGTH) {
    return jsonError(`token too long (max ${MAX_TOKEN_LENGTH})`, 400, origin, env);
  }
  if (typeof userId !== 'string' || userId.length === 0) {
    return jsonError('userId must be a non-empty string', 400, origin, env);
  }

  const now = Date.now();
  const id = generateId();

  try {
    // Upsert: if a device with the same token exists, update it
    const existing = await env.PUSH_DB
      .prepare('SELECT id FROM devices WHERE token = ?')
      .bind(token)
      .first<{ id: string }>();

    if (existing) {
      await env.PUSH_DB
        .prepare('UPDATE devices SET platform = ?, user_id = ?, updated_at = ? WHERE id = ?')
        .bind(platform, userId, now, existing.id)
        .run();
      return jsonOk({ success: true, id: existing.id, message: 'Device updated' }, origin, env);
    }

    await env.PUSH_DB
      .prepare(
        'INSERT INTO devices (id, user_id, platform, token, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .bind(id, userId, platform, token, now, now)
      .run();

    return jsonOk({ success: true, id, message: 'Device registered' }, origin, env);
  } catch (err) {
    errorCount++;
    return jsonError(`Database error: ${(err as Error).message}`, 500, origin, env);
  }
}

/**
 * DELETE /devices/:id
 */
async function handleUnregisterDevice(id: string, env: Env, origin: string | null): Promise<Response> {
  if (!id) {
    return jsonError('Missing device id', 400, origin, env);
  }

  try {
    const result = await env.PUSH_DB
      .prepare('DELETE FROM devices WHERE id = ?')
      .bind(id)
      .run();

    if (result.meta.changes === 0) {
      return jsonError('Device not found', 404, origin, env);
    }

    return jsonOk({ success: true, message: 'Device unregistered' }, origin, env);
  } catch (err) {
    errorCount++;
    return jsonError(`Database error: ${(err as Error).message}`, 500, origin, env);
  }
}

/**
 * GET /devices/:userId
 * Returns all devices for a given userId
 */
async function handleGetUserDevices(userId: string, env: Env, origin: string | null): Promise<Response> {
  if (!userId) {
    return jsonError('Missing userId', 400, origin, env);
  }

  try {
    const { results } = await env.PUSH_DB
      .prepare('SELECT id, user_id, platform, token, created_at, updated_at FROM devices WHERE user_id = ? ORDER BY updated_at DESC')
      .bind(userId)
      .all<DeviceRecord>();

    // Mask tokens in response (show only first 8 chars)
    const devices = results.map((d) => ({
      id: d.id,
      userId: d.user_id,
      platform: d.platform,
      tokenPrefix: d.token.slice(0, 8) + '...',
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));

    return jsonOk({ devices, total: devices.length }, origin, env);
  } catch (err) {
    errorCount++;
    return jsonError(`Database error: ${(err as Error).message}`, 500, origin, env);
  }
}

/**
 * POST /push/send
 * Body: { deviceId?: string, userId?: string, title: string, body: string, data?: Record<string, string> }
 */
async function handlePushSend(request: Request, env: Env, origin: string | null): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON', 400, origin, env);
  }

  const req = body as Record<string, unknown>;
  const title = req.title as string;
  const msgBody = req.body as string;
  const data = req.data as Record<string, string> | undefined;
  const deviceId = req.deviceId as string | undefined;
  const userId = req.userId as string | undefined;

  // Validate
  if (!title || typeof title !== 'string') {
    return jsonError('Missing or invalid field: title', 400, origin, env);
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return jsonError(`title too long (max ${MAX_TITLE_LENGTH})`, 400, origin, env);
  }
  if (msgBody !== undefined && typeof msgBody !== 'string') {
    return jsonError('body must be a string', 400, origin, env);
  }
  if (typeof msgBody === 'string' && msgBody.length > MAX_BODY_LENGTH) {
    return jsonError(`body too long (max ${MAX_BODY_LENGTH})`, 400, origin, env);
  }
  if (!deviceId && !userId) {
    return jsonError('Must provide deviceId or userId', 400, origin, env);
  }

  try {
    // Resolve target devices
    let devices: DeviceRecord[];

    if (deviceId) {
      const device = await env.PUSH_DB
        .prepare('SELECT id, user_id, platform, token, created_at, updated_at FROM devices WHERE id = ?')
        .bind(deviceId)
        .first<DeviceRecord>();
      devices = device ? [device] : [];
    } else {
      const { results } = await env.PUSH_DB
        .prepare('SELECT id, user_id, platform, token, created_at, updated_at FROM devices WHERE user_id = ?')
        .bind(userId)
        .all<DeviceRecord>();
      devices = results;
    }

    if (devices.length === 0) {
      return jsonError('No devices found', 404, origin, env);
    }

    // Deliver to all resolved devices
    const results: DeliveryResult[] = [];
    for (const device of devices) {
      const delivery = await deliverToToken(
        device.platform as 'fcm' | 'apns',
        device.token,
        title,
        msgBody || '',
        data,
        env,
      );

      if (delivery.success) {
        successDeliveryCount++;
      } else {
        failedDeliveryCount++;
      }

      results.push({
        deviceId: device.id,
        success: delivery.success,
        message: delivery.message,
        timestamp: Date.now(),
      });
    }

    const succeeded = results.filter((r) => r.success).length;
    return jsonOk(
      { total: results.length, succeeded, failed: results.length - succeeded, results },
      origin,
      env,
    );
  } catch (err) {
    errorCount++;
    return jsonError(`Delivery error: ${(err as Error).message}`, 500, origin, env);
  }
}

/**
 * POST /push/batch
 * Body: { notifications: Array<{ deviceId?: string, userId?: string, title: string, body: string, data?: Record<string, string> }> }
 */
async function handlePushBatch(request: Request, env: Env, origin: string | null): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON', 400, origin, env);
  }

  const req = body as Record<string, unknown>;
  const notifications = req.notifications as Array<Record<string, unknown>> | undefined;

  if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
    return jsonError('Missing or empty notifications array', 400, origin, env);
  }
  if (notifications.length > MAX_BATCH_SIZE) {
    return jsonError(`Batch size exceeded (max ${MAX_BATCH_SIZE})`, 400, origin, env);
  }

  const allResults: DeliveryResult[] = [];

  try {
    for (const item of notifications) {
      const title = item.title as string;
      const msgBody = item.body as string;
      const data = item.data as Record<string, string> | undefined;
      const deviceId = item.deviceId as string | undefined;
      const userId = item.userId as string | undefined;

      if (!title) continue;

      // Resolve devices
      let devices: DeviceRecord[];
      if (deviceId) {
        const device = await env.PUSH_DB
          .prepare('SELECT id, user_id, platform, token, created_at, updated_at FROM devices WHERE id = ?')
          .bind(deviceId)
          .first<DeviceRecord>();
        devices = device ? [device] : [];
      } else if (userId) {
        const { results } = await env.PUSH_DB
          .prepare('SELECT id, user_id, platform, token, created_at, updated_at FROM devices WHERE user_id = ?')
          .bind(userId)
          .all<DeviceRecord>();
        devices = results;
      } else {
        continue;
      }

      for (const device of devices) {
        const delivery = await deliverToToken(
          device.platform as 'fcm' | 'apns',
          device.token,
          title,
          msgBody || '',
          data,
          env,
        );

        if (delivery.success) {
          successDeliveryCount++;
        } else {
          failedDeliveryCount++;
        }

        allResults.push({
          deviceId: device.id,
          success: delivery.success,
          message: delivery.message,
          timestamp: Date.now(),
        });
      }
    }

    const succeeded = allResults.filter((r) => r.success).length;
    return jsonOk(
      { total: allResults.length, succeeded, failed: allResults.length - succeeded, results: allResults },
      origin,
      env,
    );
  } catch (err) {
    errorCount++;
    return jsonError(`Batch delivery error: ${(err as Error).message}`, 500, origin, env);
  }
}

/**
 * GET /health
 */
function handleHealth(origin: string | null, env: Env): Response {
  const uptimeSec = Math.floor((Date.now() - START_TIME) / 1000);
  return jsonOk(
    {
      status: 'ok',
      service: 'cinacoin-push-server',
      uptime: uptimeSec,
      version: '2.0.0',
      timestamp: new Date().toISOString(),
    },
    origin,
    env,
  );
}

/**
 * GET /metrics
 */
function handleMetrics(request: Request, origin: string | null, env: Env): Response {
  const accept = request.headers.get('Accept') || '';
  const uptimeMs = Date.now() - START_TIME;
  const totalDeliveries = successDeliveryCount + failedDeliveryCount;
  const errorRate = totalDeliveries > 0 ? ((failedDeliveryCount / totalDeliveries) * 100).toFixed(2) : '0.00';

  // Prometheus text format
  if (accept.includes('text/plain') || accept.includes('application/openmetrics')) {
    const lines = [
      '# HELP push_server_up Whether the service is alive',
      '# TYPE push_server_up gauge',
      'push_server_up 1',
      '',
      '# HELP push_server_uptime_ms Uptime in milliseconds',
      '# TYPE push_server_uptime_ms gauge',
      `push_server_uptime_ms ${uptimeMs}`,
      '',
      '# HELP push_server_request_count_total Total requests processed',
      '# TYPE push_server_request_count_total counter',
      `push_server_request_count_total ${requestCount}`,
      '',
      '# HELP push_server_error_count_total Total errors',
      '# TYPE push_server_error_count_total counter',
      `push_server_error_count_total ${errorCount}`,
      '',
      '# HELP push_server_delivery_success_total Successful deliveries',
      '# TYPE push_server_delivery_success_total counter',
      `push_server_delivery_success_total ${successDeliveryCount}`,
      '',
      '# HELP push_server_delivery_failed_total Failed deliveries',
      '# TYPE push_server_delivery_failed_total counter',
      `push_server_delivery_failed_total ${failedDeliveryCount}`,
      '',
      '# HELP push_server_error_rate Error rate as percentage',
      '# TYPE push_server_error_rate gauge',
      `push_server_error_rate ${errorRate}`,
    ];
    return new Response(lines.join('\n') + '\n', {
      headers: {
        ...corsHeaders(origin, env),
        'Content-Type': 'text/plain; version=0.0.4',
      },
    });
  }

  // JSON format
  return jsonOk(
    {
      service: 'cinacoin-push-server',
      uptime_ms: uptimeMs,
      request_count: requestCount,
      error_count: errorCount,
      delivery_success: successDeliveryCount,
      delivery_failed: failedDeliveryCount,
      error_rate_percent: parseFloat(errorRate),
      timestamp: new Date().toISOString(),
    },
    origin,
    env,
  );
}

// ---------------------------------------------------------------------------
// Queue consumer (background push processing)
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    requestCount++;

    const url = new URL(request.url);
    const path = url.pathname;
    const origin = request.headers.get('Origin');

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin, env) });
    }

    // Health check — no auth, no rate limit
    if (path === '/health' && request.method === 'GET') {
      return handleHealth(origin, env);
    }

    // Metrics — no auth, no rate limit
    if (path === '/metrics' && request.method === 'GET') {
      return handleMetrics(request, origin, env);
    }

    // Rate limiting for all other endpoints
    const ip = getClientIp(request);
    const rateCheck = await checkRateLimit(ip, env);
    if (!rateCheck.allowed) {
      return jsonError('rate_limit_exceeded', 429, origin, env);
    }

    // Auth check for write endpoints
    if (!verifyApiKey(request, env)) {
      return jsonError('Unauthorized', 401, origin, env);
    }

    try {
      // POST /devices/register
      if (path === '/devices/register' && request.method === 'POST') {
        return await handleRegisterDevice(request, env, origin);
      }

      // DELETE /devices/:id
      if (path.startsWith('/devices/') && request.method === 'DELETE') {
        const id = path.replace('/devices/', '');
        if (!id || id === 'register') {
          return jsonError('Missing device id', 400, origin, env);
        }
        return await handleUnregisterDevice(id, env, origin);
      }

      // GET /devices/:userId
      if (path.startsWith('/devices/') && request.method === 'GET') {
        const userId = path.replace('/devices/', '');
        if (!userId) {
          return jsonError('Missing userId', 400, origin, env);
        }
        return await handleGetUserDevices(userId, env, origin);
      }

      // POST /push/send
      if (path === '/push/send' && request.method === 'POST') {
        return await handlePushSend(request, env, origin);
      }

      // POST /push/batch
      if (path === '/push/batch' && request.method === 'POST') {
        return await handlePushBatch(request, env, origin);
      }

      return jsonError('Not found', 404, origin, env);
    } catch (error) {
      errorCount++;
      console.error('[push-server] Internal error:', error);
      return jsonError('Internal server error', 500, origin, env);
    }
  },

  // Queue consumer for background push processing
  async queue(batch: MessageBatch<PushPayload>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      const payload = message.body;

      try {
        let devices: DeviceRecord[];

        if (payload.deviceId) {
          const device = await env.PUSH_DB
            .prepare('SELECT id, user_id, platform, token, created_at, updated_at FROM devices WHERE id = ?')
            .bind(payload.deviceId)
            .first<DeviceRecord>();
          devices = device ? [device] : [];
        } else if (payload.userId) {
          const { results } = await env.PUSH_DB
            .prepare('SELECT id, user_id, platform, token, created_at, updated_at FROM devices WHERE user_id = ?')
            .bind(payload.userId)
            .all<DeviceRecord>();
          devices = results;
        } else {
          continue;
        }

        for (const device of devices) {
          const result = await deliverToToken(
            device.platform as 'fcm' | 'apns',
            device.token,
            payload.title,
            payload.body,
            payload.data,
            env,
          );

          if (result.success) {
            successDeliveryCount++;
          } else {
            failedDeliveryCount++;
          }
        }
      } catch (err) {
        failedDeliveryCount++;
        console.error('[push-server] Queue delivery error:', err);
      }
    }
  },
};
