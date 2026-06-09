/**
 * Rate Limiter — Per-device, per-address, and per-type rate limiting
 * with daily caps and do-not-disturb support.
 * Uses Cloudflare KV for distributed rate tracking.
 */

export interface RateLimitConfig {
  /** Max notifications per device per minute */
  perDevicePerMinute: number;
  /** Max notifications per address per minute */
  perAddressPerMinute: number;
  /** Max notifications of a specific type per device per hour */
  perTypePerDevicePerHour: number;
  /** Daily notification cap per address */
  dailyCapPerAddress: number;
  /** DND start time (HH:MM UTC) */
  dndStart?: string;
  /** DND end time (HH:MM UTC) */
  dndEnd?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number; // seconds
}

export interface RateLimiterEnv {
  RATE_LIMITS: KVNamespace;
}

export const DEFAULT_CONFIG: RateLimitConfig = {
  perDevicePerMinute: 10,
  perAddressPerMinute: 30,
  perTypePerDevicePerHour: 5,
  dailyCapPerAddress: 200,
};

/**
 * Check if current time falls within DND window.
 */
function isInDndWindow(dndStart?: string, dndEnd?: string): boolean {
  if (!dndStart || !dndEnd) return false;

  const now = new Date();
  const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  const [startH, startM] = dndStart.split(":").map(Number);
  const [endH, endM] = dndEnd.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    // DND within same day: e.g. 22:00 - 07:00 doesn't apply here
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  } else {
    // DND spans midnight: e.g. 22:00 - 07:00
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
}

/**
 * Get or create a rate counter from KV.
 * Key format: rl:<scope>:<key>:<window-start-timestamp>
 */
async function getRateCount(
  kv: KVNamespace,
  key: string,
  windowMs: number
): Promise<{ count: number; resetAt: number }> {
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const kvKey = `rl:${key}:${windowStart}`;

  const raw = await kv.get(kvKey);
  const count = raw ? parseInt(raw, 10) : 0;
  const resetAt = windowStart + windowMs;

  return { count, resetAt };
}

/**
 * Increment a rate counter in KV.
 */
async function incrementRate(
  kv: KVNamespace,
  key: string,
  windowMs: number,
  ttlSeconds: number
): Promise<number> {
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const kvKey = `rl:${key}:${windowStart}`;

  const raw = await kv.get(kvKey);
  const current = raw ? parseInt(raw, 10) : 0;
  const next = current + 1;

  await kv.put(kvKey, String(next), { expirationTtl: ttlSeconds });
  return next;
}

/**
 * Get daily counter for an address.
 * Key format: rl:daily:<address>:<YYYY-MM-DD>
 */
async function getDailyCount(
  kv: KVNamespace,
  address: string
): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const raw = await kv.get(`rl:daily:${address}:${today}`);
  return raw ? parseInt(raw, 10) : 0;
}

async function incrementDailyCount(
  kv: KVNamespace,
  address: string
): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const key = `rl:daily:${address}:${today}`;
  const raw = await kv.get(key);
  const current = raw ? parseInt(raw, 10) : 0;
  const next = current + 1;
  // TTL: 2 days (covers the rest of today + tomorrow)
  await kv.put(key, String(next), { expirationTtl: 86400 * 2 });
  return next;
}

/**
 * RateLimiter — manages all rate limiting logic.
 */
export class RateLimiter {
  private kv: KVNamespace;
  private config: RateLimitConfig;

  constructor(env: RateLimiterEnv, config: Partial<RateLimitConfig> = {}) {
    this.kv = env.RATE_LIMITS;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if a notification should be allowed.
   * Returns { allowed: true } or { allowed: false, reason, retryAfter }.
   */
  async check(
    deviceId: string,
    address: string,
    notificationType: string,
    userDndStart?: string,
    userDndEnd?: string
  ): Promise<RateLimitResult> {
    // 1. Check DND window (user preferences take priority)
    const dndStart = userDndStart ?? this.config.dndStart;
    const dndEnd = userDndEnd ?? this.config.dndEnd;
    if (isInDndWindow(dndStart, dndEnd)) {
      return { allowed: false, reason: "do_not_disturb" };
    }

    // 2. Per-device per-minute limit
    const deviceRate = await getRateCount(this.kv, `device:${deviceId}`, 60_000);
    if (deviceRate.count >= this.config.perDevicePerMinute) {
      const retryAfter = Math.ceil((deviceRate.resetAt - Date.now()) / 1000);
      return { allowed: false, reason: "device_rate_exceeded", retryAfter };
    }

    // 3. Per-address per-minute limit
    const addressRate = await getRateCount(this.kv, `address:${address}`, 60_000);
    if (addressRate.count >= this.config.perAddressPerMinute) {
      const retryAfter = Math.ceil((addressRate.resetAt - Date.now()) / 1000);
      return { allowed: false, reason: "address_rate_exceeded", retryAfter };
    }

    // 4. Per-type per-device per-hour limit
    const typeRate = await getRateCount(this.kv, `type:${notificationType}:${deviceId}`, 3_600_000);
    if (typeRate.count >= this.config.perTypePerDevicePerHour) {
      const retryAfter = Math.ceil((typeRate.resetAt - Date.now()) / 1000);
      return { allowed: false, reason: "type_rate_exceeded", retryAfter };
    }

    // 5. Daily cap per address
    const dailyCount = await getDailyCount(this.kv, address);
    if (dailyCount >= this.config.dailyCapPerAddress) {
      return { allowed: false, reason: "daily_cap_exceeded" };
    }

    return { allowed: true };
  }

  /**
   * Record a notification attempt (call only after check() returns allowed).
   */
  async record(deviceId: string, address: string): Promise<void> {
    // Increment all counters in parallel
    await Promise.all([
      incrementRate(this.kv, `device:${deviceId}`, 60_000, 120),
      incrementRate(this.kv, `address:${address}`, 60_000, 120),
      incrementDailyCount(this.kv, address),
    ]);
  }

  /**
   * Record a type-specific rate hit.
   */
  async recordType(deviceId: string, notificationType: string): Promise<void> {
    await incrementRate(this.kv, `type:${notificationType}:${deviceId}`, 3_600_000, 3700);
  }

  /**
   * Get current rate limit status for a device (for diagnostics).
   */
  async getStatus(deviceId: string, address: string): Promise<{
    devicePerMinute: { count: number; limit: number };
    addressPerMinute: { count: number; limit: number };
    dailyCount: { count: number; limit: number };
  }> {
    const deviceRate = await getRateCount(this.kv, `device:${deviceId}`, 60_000);
    const addressRate = await getRateCount(this.kv, `address:${address}`, 60_000);
    const dailyCount = await getDailyCount(this.kv, address);

    return {
      devicePerMinute: { count: deviceRate.count, limit: this.config.perDevicePerMinute },
      addressPerMinute: { count: addressRate.count, limit: this.config.perAddressPerMinute },
      dailyCount: { count: dailyCount, limit: this.config.dailyCapPerAddress },
    };
  }
}
