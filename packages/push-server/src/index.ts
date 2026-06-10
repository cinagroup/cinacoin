/**
 * Cinacoin Push Network — Cloudflare Worker
 *
 * Self-hosted push notification service with:
 * - Device registration with FCM/APNs token management
 * - Notification delivery: transaction, signing, connection events
 * - Rate limiting per device/address with DND support
 * - Auth via API key, CORS headers
 *
 * Endpoints:
 *   POST /register         — register device
 *   POST /unregister       — unregister device
 *   POST /send             — send notification (from backend)
 *   POST /send-batch       — batch send
 *   GET  /status/:deviceId — delivery status
 *   POST /preferences      — update notification preferences
 *   GET  /health           — health check
 */

import { DeviceRegistry } from "./device-registry.js";
import { NotificationDelivery } from "./notification-delivery.js";
import { RateLimiter, type RateLimitConfig } from "./rate-limiter.js";

// ── Env Interface ────────────────────────────────────────────────────────

interface Env {
  DEVICE_TOKENS: KVNamespace;
  RATE_LIMITS: KVNamespace;
  DELIVERY_STATUS: KVNamespace;
  API_KEY?: string;
  FCM_API_KEY?: string;
  APNS_KEY_ID?: string;
  APNS_TEAM_ID?: string;
  APNS_BUNDLE_ID?: string;
  APNS_PRIVATE_KEY?: string;
  RATE_PER_DEVICE?: string;
  RATE_PER_ADDRESS?: string;
  RATE_PER_TYPE?: string;
  RATE_DAILY_CAP?: string;
  DND_START?: string;
  DND_END?: string;
}

// ── CORS ─────────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
  "https://cinacoin.com",
  "https://dash.cinacoin.com",
  "https://demo.cinacoin.com",
];

function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-device-id",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  };
  // Only set Access-Control-Allow-Origin if the origin is explicitly allowed
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function jsonResponse(data: unknown, origin: string | null, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

function jsonError(message: string, status: number, origin: string | null): Response {
  return jsonResponse({ error: message }, origin, status);
}

// ── Auth ─────────────────────────────────────────────────────────────────

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const aBuf = new TextEncoder().encode(a);
  const bBuf = new TextEncoder().encode(b);
  let result = 0;
  for (let i = 0; i < aBuf.length; i++) result |= aBuf[i] ^ bBuf[i];
  return result === 0;
}

function verifyApiKey(request: Request, env: Env): boolean {
  const apiKey = env.API_KEY;
  if (!apiKey) return true; // skip in dev
  const auth = request.headers.get("Authorization");
  if (!auth) return false;
  return constantTimeCompare(auth, `Bearer ${apiKey}`) || constantTimeCompare(auth, apiKey);
}

// ── Handlers ─────────────────────────────────────────────────────────────

async function handleRegister(request: Request, env: Env): Promise<Response> {
  const registry = new DeviceRegistry(env);
  const origin = request.headers.get("Origin");

  let body: unknown;
  try { body = await request.json(); } catch {
    return jsonError("Invalid JSON", 400, origin);
  }

  const req = body as Record<string, unknown>;
  const { address, platform, pushToken, appVersion, locale, deviceModel } = req as {
    address?: string; platform?: string; pushToken?: string;
    appVersion?: string; locale?: string; deviceModel?: string;
  };

  if (!address || !platform || !pushToken) {
    return jsonError("Missing required fields: address, platform, pushToken", 400, origin);
  }
  if (!["ios", "android", "web"].includes(platform)) {
    return jsonError('platform must be "ios", "android", or "web"', 400, origin);
  }
  if (pushToken.length > 4096) {
    return jsonError("pushToken too long (max 4096)", 400, origin);
  }

  const device = await registry.register({
    address,
    platform: platform as "ios" | "android" | "web",
    pushToken,
    appVersion,
    locale,
    deviceModel,
  });

  return jsonResponse({ success: true, deviceId: device.deviceId, message: "Device registered" }, origin);
}

async function handleUnregister(request: Request, env: Env): Promise<Response> {
  const registry = new DeviceRegistry(env);
  const origin = request.headers.get("Origin");

  let body: unknown;
  try { body = await request.json(); } catch {
    return jsonError("Invalid JSON", 400, origin);
  }

  const { deviceId, address } = (body as Record<string, unknown>) as { deviceId?: string; address?: string };

  if (deviceId) {
    const result = await registry.unregister(deviceId);
    return jsonResponse(result, origin, result.success ? 200 : 404);
  }

  if (address) {
    const result = await registry.unregisterAllForAddress(address);
    return jsonResponse({ success: true, ...result }, origin);
  }

  return jsonError("Provide deviceId or address", 400, origin);
}

async function handleSend(request: Request, env: Env): Promise<Response> {
  const registry = new DeviceRegistry(env);
  const delivery = new NotificationDelivery(env);
  const rateConfig: Partial<RateLimitConfig> = {
    perDevicePerMinute: env.RATE_PER_DEVICE ? parseInt(env.RATE_PER_DEVICE) : undefined,
    perAddressPerMinute: env.RATE_PER_ADDRESS ? parseInt(env.RATE_PER_ADDRESS) : undefined,
    perTypePerDevicePerHour: env.RATE_PER_TYPE ? parseInt(env.RATE_PER_TYPE) : undefined,
    dailyCapPerAddress: env.RATE_DAILY_CAP ? parseInt(env.RATE_DAILY_CAP) : undefined,
    dndStart: env.DND_START,
    dndEnd: env.DND_END,
  };
  const limiter = new RateLimiter(env, rateConfig);
  const origin = request.headers.get("Origin");

  let body: unknown;
  try { body = await request.json(); } catch {
    return jsonError("Invalid JSON", 400, origin);
  }

  const raw = body as Record<string, unknown>;

  if (!raw.address || !raw.type || !raw.title || !raw.body) {
    return jsonError("Missing required fields: address, type, title, body", 400, origin);
  }

  const address = String(raw.address);
  const type = String(raw.type);
  const title = String(raw.title);
  const msgBody = String(raw.body);
  const data = raw.data;
  const chainId = raw.chainId;

  const devices = await registry.getAllDevicesForAddress(address);
  if (devices.length === 0) {
    return jsonError("No devices registered for address", 404, origin);
  }

  const results = [];
  for (const device of devices) {
    const prefs = device.preferences;
    // Check user preferences for notification type
    if (type in prefs && !(prefs as unknown as Record<string, boolean>)[type]) {
      results.push({ deviceId: device.deviceId, success: false, message: "Notifications disabled for this type", skipped: true });
      continue;
    }

    // Check rate limits
    const rateCheck = await limiter.check(
      device.deviceId,
      address,
      type,
      prefs.doNotDisturbStart,
      prefs.doNotDisturbEnd
    );
    if (!rateCheck.allowed) {
      results.push({ deviceId: device.deviceId, success: false, reason: rateCheck.reason, retryAfter: rateCheck.retryAfter });
      continue;
    }

    // Record rate limit hit
    await limiter.record(device.deviceId, address);
    await limiter.recordType(device.deviceId, type);

    // Deliver
    const result = await delivery.send(device, {
      type: type as unknown,
      title,
      body: msgBody,
      data: data as Record<string, string> | undefined,
      chainId: chainId as number | undefined,
      address,
    });
    results.push(result);
  }

  const succeeded = results.filter((r: any) => r.success).length;
  return jsonResponse({ total: results.length, succeeded, failed: results.length - succeeded, results }, origin);
}

async function handleSendBatch(request: Request, env: Env): Promise<Response> {
  const registry = new DeviceRegistry(env);
  const delivery = new NotificationDelivery(env);
  const origin = request.headers.get("Origin");

  let body: unknown;
  try { body = await request.json(); } catch {
    return jsonError("Invalid JSON", 400, origin);
  }

  const req = body as Record<string, unknown>;
  const notifications = req.notifications as Array<Record<string, unknown>> | undefined;
  if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
    return jsonError("Missing or empty notifications array", 400, origin);
  }
  if (notifications.length > 100) {
    return jsonError("Batch size exceeded (max 100)", 400, origin);
  }

  const results = [];
  for (const item of notifications) {
    const it = item as Record<string, unknown>;
    if (!it.address || !it.type || !it.title || !it.body) continue;

    const address = String(it.address);
    const type = String(it.type);
    const title = String(it.title);
    const msgBody = String(it.body);
    const data = it.data;
    const chainId = it.chainId;

    const devices = await registry.getAllDevicesForAddress(address);
    for (const device of devices) {
      const result = await delivery.send(device, {
        type: type as unknown,
        title,
        body: msgBody,
        data: data as Record<string, string> | undefined,
        chainId: chainId as number | undefined,
        address,
      });
      results.push(result);
    }
  }

  const succeeded = results.filter((r) => r.success).length;
  return jsonResponse({ total: results.length, succeeded, failed: results.length - succeeded, results }, origin);
}

async function handleStatus(deviceId: string, env: Env): Promise<Response> {
  const delivery = new NotificationDelivery(env);
  const status = await delivery.getDeliveryStatus(deviceId);
  return jsonResponse(status, null);
}

async function handlePreferences(request: Request, env: Env): Promise<Response> {
  const registry = new DeviceRegistry(env);
  const origin = request.headers.get("Origin");

  let body: unknown;
  try { body = await request.json(); } catch {
    return jsonError("Invalid JSON", 400, origin);
  }

  const { deviceId, preferences } = body as Record<string, unknown>;
  if (!deviceId || !preferences || typeof preferences !== "object") {
    return jsonError("Missing deviceId or preferences", 400, origin);
  }

  const result = await registry.updatePreferences(String(deviceId), preferences as unknown as Parameters<typeof registry.updatePreferences>[1]);
  return jsonResponse(result, origin, result.success ? 200 : 404);
}

// ── Worker Entry Point ───────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const origin = request.headers.get("Origin");

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    // Health check (no auth)
    if (path === "/health") {
      return jsonResponse({ status: "ok", service: "cinacoin-push", timestamp: Date.now() }, origin);
    }

    // All other endpoints require API key auth
    if (!verifyApiKey(request, env)) {
      return jsonError("Unauthorized", 401, origin);
    }

    try {
      // POST /register
      if (path === "/register" && request.method === "POST") {
        return handleRegister(request, env);
      }

      // POST /unregister
      if (path === "/unregister" && request.method === "POST") {
        return handleUnregister(request, env);
      }

      // POST /send
      if (path === "/send" && request.method === "POST") {
        return handleSend(request, env);
      }

      // POST /send-batch
      if (path === "/send-batch" && request.method === "POST") {
        return handleSendBatch(request, env);
      }

      // GET /status/:deviceId
      if (path.startsWith("/status/") && request.method === "GET") {
        const deviceId = path.split("/status/")[1];
        if (!deviceId) return jsonError("Missing deviceId", 400, origin);
        return handleStatus(deviceId, env);
      }

      // POST /preferences
      if (path === "/preferences" && request.method === "POST") {
        return handlePreferences(request, env);
      }

      return jsonError("Not found", 404, origin);
    } catch (error) {
      console.error("[push-server] Internal error:", error);
      return jsonError("Internal server error", 500, origin);
    }
  },
};

// ── Library Re-exports ───────────────────────────────────────────────────

export { DeviceRegistry } from "./device-registry.js";
export { NotificationDelivery } from "./notification-delivery.js";
export { RateLimiter } from "./rate-limiter.js";
export { PushServer } from "./PushServer.js";

export type {
  DeviceMetadata, RegisteredDevice, NotificationPreferences,
  RegisterDeviceRequest, DeviceRegistryEnv,
} from "./device-registry.js";

export type {
  NotificationType, NotificationPayload, DeliveryResult,
  BatchDeliveryResult, DeliveryStatus, DeliveryEnv,
} from "./notification-delivery.js";

export type {
  RateLimitConfig, RateLimitResult, RateLimiterEnv,
} from "./rate-limiter.js";

export type {
  PushServerConfig, PushNotification,
  DeliveryResult as LegacyDeliveryResult,
} from "./PushServer.js";
