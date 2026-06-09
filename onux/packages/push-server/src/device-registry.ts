/**
 * Device Registry — Manages device tokens, platform mapping, and metadata.
 * One address can have multiple devices (iOS + Android + web).
 * Uses Cloudflare KV for persistent storage.
 */

export interface DeviceMetadata {
  platform: "ios" | "android" | "web";
  appVersion?: string;
  locale?: string;
  deviceModel?: string;
  pushToken?: string; // FCM token or APNs device token
  registeredAt: number;
  lastActive: number;
}

export interface RegisteredDevice {
  deviceId: string;
  address: string;
  metadata: DeviceMetadata;
  preferences: NotificationPreferences;
}

export interface NotificationPreferences {
  transaction_received: boolean;
  transaction_confirmed: boolean;
  message_signed: boolean;
  wallet_connected: boolean;
  chain_switched: boolean;
  custom: boolean;
  doNotDisturbStart?: string; // HH:MM UTC, e.g. "22:00"
  doNotDisturbEnd?: string; // HH:MM UTC, e.g. "07:00"
}

export interface RegisterDeviceRequest {
  address: string;
  platform: "ios" | "android" | "web";
  pushToken: string;
  appVersion?: string;
  locale?: string;
  deviceModel?: string;
}

export interface DeviceRegistryEnv {
  DEVICE_TOKENS: KVNamespace;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  transaction_received: true,
  transaction_confirmed: true,
  message_signed: true,
  wallet_connected: true,
  chain_switched: true,
  custom: true,
};

/**
 * Generate a deterministic device ID from address + pushToken.
 */
async function generateDeviceId(address: string, pushToken: string): Promise<string> {
  const data = new TextEncoder().encode(`${address}:${pushToken}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const hex = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
  return hex;
}

/**
 * Parse a device record from KV JSON.
 */
function parseDevice(raw: string | null): RegisteredDevice | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RegisteredDevice;
  } catch {
    return null;
  }
}

/**
 * DeviceRegistry — CRUD for device registrations backed by Cloudflare KV.
 */
export class DeviceRegistry {
  private kv: KVNamespace;
  private cache: Map<string, RegisteredDevice> = new Map();
  private cacheTtl = 60_000; // 60s
  private cacheTimestamps: Map<string, number> = new Map();

  constructor(env: DeviceRegistryEnv) {
    this.kv = env.DEVICE_TOKENS;
  }

  /**
   * Register or update a device for an address.
   * One address → multiple devices is supported.
   */
  async register(req: RegisterDeviceRequest): Promise<RegisteredDevice> {
    const deviceId = await generateDeviceId(req.address, req.pushToken);
    const now = Date.now();

    const existing = await this.getDevice(deviceId);
    const metadata: DeviceMetadata = {
      platform: req.platform,
      pushToken: req.pushToken,
      appVersion: req.appVersion,
      locale: req.locale,
      deviceModel: req.deviceModel,
      registeredAt: existing?.metadata.registeredAt ?? now,
      lastActive: now,
    };

    const device: RegisteredDevice = {
      deviceId,
      address: req.address,
      metadata,
      preferences: existing?.preferences ?? { ...DEFAULT_PREFERENCES },
    };

    await this.kv.put(`device:${deviceId}`, JSON.stringify(device), {
      expirationTtl: 86400 * 30, // 30 days
    });

    // Update address index: "addr:<address>" → JSON array of deviceIds
    const addrKey = `addr:${req.address}`;
    const existingDevices = await this.getDevicesByAddress(req.address);
    const deviceIds = [...new Set([...existingDevices, deviceId])];
    await this.kv.put(addrKey, JSON.stringify(deviceIds), {
      expirationTtl: 86400 * 30,
    });

    this.cache.set(deviceId, device);
    this.cacheTimestamps.set(deviceId, now);
    return device;
  }

  /**
   * Get a device by its ID.
   */
  async getDevice(deviceId: string): Promise<RegisteredDevice | null> {
    // Check cache
    const cached = this.cache.get(deviceId);
    const ts = this.cacheTimestamps.get(deviceId);
    if (cached && ts && Date.now() - ts < this.cacheTtl) {
      return cached;
    }

    const raw = await this.kv.get(`device:${deviceId}`);
    const device = parseDevice(raw);
    if (device) {
      this.cache.set(deviceId, device);
      this.cacheTimestamps.set(deviceId, Date.now());
    }
    return device;
  }

  /**
   * Get all device IDs for a given address.
   */
  async getDevicesByAddress(address: string): Promise<string[]> {
    const raw = await this.kv.get(`addr:${address}`);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  }

  /**
   * Get all registered devices for an address (full records).
   */
  async getAllDevicesForAddress(address: string): Promise<RegisteredDevice[]> {
    const deviceIds = await this.getDevicesByAddress(address);
    const devices = await Promise.all(
      deviceIds.map((id) => this.getDevice(id))
    );
    return devices.filter((d): d is RegisteredDevice => d !== null);
  }

  /**
   * Unregister a device by its ID.
   */
  async unregister(deviceId: string): Promise<{ success: boolean; message: string }> {
    const device = await this.getDevice(deviceId);
    if (!device) {
      return { success: false, message: "Device not found" };
    }

    await this.kv.delete(`device:${deviceId}`);
    this.cache.delete(deviceId);
    this.cacheTimestamps.delete(deviceId);

    // Remove from address index
    const addrKey = `addr:${device.address}`;
    const existing = await this.getDevicesByAddress(device.address);
    const updated = existing.filter((id) => id !== deviceId);
    if (updated.length === 0) {
      await this.kv.delete(addrKey);
    } else {
      await this.kv.put(addrKey, JSON.stringify(updated), {
        expirationTtl: 86400 * 30,
      });
    }

    return { success: true, message: "Device unregistered" };
  }

  /**
   * Unregister all devices for an address.
   */
  async unregisterAllForAddress(address: string): Promise<{ count: number }> {
    const deviceIds = await this.getDevicesByAddress(address);
    for (const id of deviceIds) {
      await this.kv.delete(`device:${id}`);
      this.cache.delete(id);
      this.cacheTimestamps.delete(id);
    }
    await this.kv.delete(`addr:${address}`);
    return { count: deviceIds.length };
  }

  /**
   * Update notification preferences for a device.
   */
  async updatePreferences(
    deviceId: string,
    prefs: Partial<NotificationPreferences>
  ): Promise<{ success: boolean; message: string }> {
    const device = await this.getDevice(deviceId);
    if (!device) {
      return { success: false, message: "Device not found" };
    }

    device.preferences = { ...device.preferences, ...prefs };
    await this.kv.put(`device:${deviceId}`, JSON.stringify(device), {
      expirationTtl: 86400 * 30,
    });
    this.cache.set(deviceId, device);
    this.cacheTimestamps.set(deviceId, Date.now());

    return { success: true, message: "Preferences updated" };
  }

  /**
   * Count total registered devices.
   */
  async count(): Promise<number> {
    const keys = await this.kv.list({ prefix: "device:" });
    return keys.keys.length;
  }
}
