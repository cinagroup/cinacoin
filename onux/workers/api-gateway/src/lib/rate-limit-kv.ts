export class KVRateLimiter {
  constructor(private kv: KVNamespace) {}

  async checkLimit(key: string, max: number, windowMs: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: number;
  }> {
    const now = Date.now();
    const windowKey = `${key}:${Math.floor(now / windowMs)}`;
    
    const count = parseInt(await this.kv.get(windowKey) || '0');
    
    if (count >= max) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: Math.ceil((Math.floor(now / windowMs) + 1) * windowMs)
      };
    }
    
    await this.kv.put(windowKey, String(count + 1), {
      expirationTtl: Math.ceil(windowMs / 1000) * 2
    });
    
    return {
      allowed: true,
      remaining: max - count - 1,
      resetAt: Math.ceil((Math.floor(now / windowMs) + 1) * windowMs)
    };
  }
}
