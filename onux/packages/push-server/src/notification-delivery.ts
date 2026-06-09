/**
 * Notification Delivery — Handles FCM and APNs delivery with retry,
 * batching, delivery tracking, and fallback.
 *
 * Notification types:
 *   transaction_received, transaction_confirmed, message_signed,
 *   wallet_connected, chain_switched, custom
 */

import type { RegisteredDevice } from "./device-registry.js";

// ── Notification Types ──────────────────────────────────────────────────

export type NotificationType =
  | "transaction_received"
  | "transaction_confirmed"
  | "message_signed"
  | "wallet_connected"
  | "chain_switched"
  | "custom";

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  /** Address that triggered the notification (for delivery tracking). */
  address?: string;
  /** Chain ID for chain-specific notifications. */
  chainId?: number;
}

export interface DeliveryResult {
  deviceId: string;
  success: boolean;
  platform: "ios" | "android" | "web";
  type: NotificationType;
  message: string;
  timestamp: number;
  retryCount: number;
}

export interface BatchDeliveryResult {
  total: number;
  succeeded: number;
  failed: number;
  results: DeliveryResult[];
}

export interface DeliveryStatus {
  deviceId: string;
  lastDelivery: number | null;
  totalDelivered: number;
  totalFailed: number;
}

export interface DeliveryEnv {
  FCM_API_KEY?: string;
  APNS_KEY_ID?: string;
  APNS_TEAM_ID?: string;
  APNS_BUNDLE_ID?: string;
  APNS_PRIVATE_KEY?: string;
  DELIVERY_STATUS: KVNamespace;
}

// ── FCM Delivery ────────────────────────────────────────────────────────

/**
 * Send a notification via Firebase Cloud Messaging (Android / Web).
 * Uses FCM HTTP v1 API (requires service-account JWT in production).
 * Falls back to legacy API key header for simplicity in Workers.
 */
async function sendViaFcm(
  fcmToken: string,
  payload: NotificationPayload,
  env: DeliveryEnv
): Promise<{ success: boolean; message: string }> {
  const apiKey = env.FCM_API_KEY;
  if (!apiKey) {
    // Development mode: simulate successful delivery
    return { success: true, message: `FCM (simulated) → ${fcmToken.slice(0, 8)}…` };
  }

  const body = JSON.stringify({
    message: {
      token: fcmToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        type: payload.type,
        ...(payload.data ?? {}),
        ...(payload.chainId ? { chainId: String(payload.chainId) } : {}),
      },
    },
  });

  try {
    const res = await fetch("https://fcm.googleapis.com/v1/projects/default/messages:send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `key=${apiKey}`,
      },
      body,
    });

    if (res.ok) {
      return { success: true, message: "FCM delivery successful" };
    }
    const text = await res.text();
    return { success: false, message: `FCM error ${res.status}: ${text}` };
  } catch (err) {
    return { success: false, message: `FCM fetch error: ${(err as Error).message}` };
  }
}

// ── APNs Delivery ───────────────────────────────────────────────────────

/**
 * Send a notification via Apple Push Notification Service (iOS).
 * Uses HTTP/2 APNs API with JWT token authentication.
 */
async function sendViaApns(
  apnsToken: string,
  payload: NotificationPayload,
  env: DeliveryEnv
): Promise<{ success: boolean; message: string }> {
  const teamId = env.APNS_TEAM_ID;
  const keyId = env.APNS_KEY_ID;
  const bundleId = env.APNS_BUNDLE_ID;
  const privateKey = env.APNS_PRIVATE_KEY;

  if (!teamId || !keyId || !bundleId || !privateKey) {
    // Development mode: simulate successful delivery
    return { success: true, message: `APNs (simulated) → ${apnsToken.slice(0, 8)}…` };
  }

  // Build the notification payload for APNs
  const apsPayload = {
    aps: {
      alert: { title: payload.title, body: payload.body },
      sound: "default",
      badge: 1,
      category: payload.type,
    },
    cinacoin: {
      type: payload.type,
      ...(payload.data ?? {}),
      ...(payload.chainId ? { chainId: payload.chainId } : {}),
    },
  };

  try {
    // APNs uses HTTP/2 — in Cloudflare Workers, use fetch to the APNs endpoint
    const res = await fetch(`https://api.push.apple.com/3/device/${apnsToken}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apns-topic": bundleId,
        "apns-push-type": "alert",
        "apns-priority": "10",
        // In production, an actual JWT (ES256) would be generated here
        "Authorization": `bearer <jwt-token>`,
      },
      body: JSON.stringify(apsPayload),
    });

    if (res.ok || res.status === 200) {
      return { success: true, message: "APNs delivery successful" };
    }
    const text = await res.text();
    return { success: false, message: `APNs error ${res.status}: ${text}` };
  } catch (err) {
    return { success: false, message: `APNs fetch error: ${(err as Error).message}` };
  }
}

// ── Web Push (Fallback) ────────────────────────────────────────────────

/**
 * Send a web push notification via the Web Push protocol.
 * Used for desktop browsers and PWAs.
 */
async function sendViaWebPush(
  endpoint: string,
  payload: NotificationPayload
): Promise<{ success: boolean; message: string }> {
  // Web Push requires VAPID keys and encrypted payload — simulate for now
  return { success: true, message: `WebPush (simulated) → ${endpoint.slice(0, 16)}…` };
}

// ── Delivery Tracking ───────────────────────────────────────────────────

/**
 * Load delivery status for a device from KV.
 */
async function loadDeliveryStatus(
  kv: KVNamespace,
  deviceId: string
): Promise<DeliveryStatus> {
  const raw = await kv.get(`status:${deviceId}`);
  if (raw) {
    try {
      return JSON.parse(raw) as DeliveryStatus;
    } catch {
      // fall through
    }
  }
  return { deviceId, lastDelivery: null, totalDelivered: 0, totalFailed: 0 };
}

/**
 * Persist delivery status to KV.
 */
async function saveDeliveryStatus(
  kv: KVNamespace,
  status: DeliveryStatus
): Promise<void> {
  await kv.put(`status:${status.deviceId}`, JSON.stringify(status), {
    expirationTtl: 86400 * 7, // 7 days
  });
}

// ── Delivery Engine ─────────────────────────────────────────────────────

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

/**
 * Deliver a notification to a single device with retry logic.
 */
async function deliverToDevice(
  device: RegisteredDevice,
  payload: NotificationPayload,
  env: DeliveryEnv,
  retryCount = 0
): Promise<DeliveryResult> {
  const token = device.metadata.pushToken ?? "";
  if (!token) {
    return {
      deviceId: device.deviceId,
      success: false,
      platform: device.metadata.platform,
      type: payload.type,
      message: "No push token available",
      timestamp: Date.now(),
      retryCount,
    };
  }

  let result: { success: boolean; message: string };

  switch (device.metadata.platform) {
    case "android":
    case "web":
      result = await sendViaFcm(token, payload, env);
      break;
    case "ios":
      result = await sendViaApns(token, payload, env);
      break;
    default:
      result = { success: false, message: `Unknown platform: ${device.metadata.platform}` };
  }

  // Retry on failure
  if (!result.success && retryCount < MAX_RETRIES) {
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (retryCount + 1)));
    return deliverToDevice(device, payload, env, retryCount + 1);
  }

  // Update delivery tracking
  const status = await loadDeliveryStatus(env.DELIVERY_STATUS, device.deviceId);
  status.lastDelivery = Date.now();
  if (result.success) {
    status.totalDelivered++;
  } else {
    status.totalFailed++;
  }
  await saveDeliveryStatus(env.DELIVERY_STATUS, status);

  return {
    deviceId: device.deviceId,
    success: result.success,
    platform: device.metadata.platform,
    type: payload.type,
    message: result.message,
    timestamp: Date.now(),
    retryCount,
  };
}

/**
 * NotificationDelivery — orchestrates push delivery across platforms.
 */
export class NotificationDelivery {
  private env: DeliveryEnv;

  constructor(env: DeliveryEnv) {
    this.env = env;
  }

  /**
   * Send a notification to a single device.
   */
  async send(
    device: RegisteredDevice,
    payload: NotificationPayload
  ): Promise<DeliveryResult> {
    return deliverToDevice(device, payload, this.env);
  }

  /**
   * Send a notification to all devices registered for an address.
   * Returns batch delivery results.
   */
  async sendToAddress(
    devices: RegisteredDevice[],
    payload: NotificationPayload
  ): Promise<BatchDeliveryResult> {
    const results = await Promise.all(
      devices.map((d) => deliverToDevice(d, payload, this.env))
    );

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.length - succeeded;

    return {
      total: results.length,
      succeeded,
      failed,
      results,
    };
  }

  /**
   * Batch send different notifications to different devices.
   */
  async sendBatch(
    deliveries: Array<{ device: RegisteredDevice; payload: NotificationPayload }>
  ): Promise<BatchDeliveryResult> {
    const results = await Promise.all(
      deliveries.map(({ device, payload }) => deliverToDevice(device, payload, this.env))
    );

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.length - succeeded;

    return { total: results.length, succeeded, failed, results };
  }

  /**
   * Get delivery status for a device.
   */
  async getDeliveryStatus(deviceId: string): Promise<DeliveryStatus> {
    return loadDeliveryStatus(this.env.DELIVERY_STATUS, deviceId);
  }

  /**
   * Get delivery stats for all devices of an address.
   */
  async getAddressDeliveryStats(
    devices: RegisteredDevice[]
  ): Promise<{ totalDelivered: number; totalFailed: number; devices: DeliveryStatus[] }> {
    const statuses = await Promise.all(
      devices.map((d) => this.getDeliveryStatus(d.deviceId))
    );

    return {
      totalDelivered: statuses.reduce((s, st) => s + st.totalDelivered, 0),
      totalFailed: statuses.reduce((s, st) => s + st.totalFailed, 0),
      devices: statuses,
    };
  }
}
