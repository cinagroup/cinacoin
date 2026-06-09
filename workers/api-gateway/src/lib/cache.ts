interface CacheOptions {
  ttl?: number; // 秒
  tags?: string[];
}

export class KVCache {
  constructor(private kv: KVNamespace) {}

  async get<T>(key: string): Promise<T | null> {
    const data = await this.kv.get(`cache:${key}`);
    if (!data) return null;
    
    const parsed = JSON.parse(data);
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      await this.kv.delete(`cache:${key}`);
      return null;
    }
    
    return parsed.value;
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const { ttl = 300, tags = [] } = options; // 默认 5 分钟
    
    const data = {
      value,
      expiresAt: Date.now() + ttl * 1000,
      tags,
    };
    
    await this.kv.put(`cache:${key}`, JSON.stringify(data), {
      expirationTtl: ttl,
    });
    
    // 存储标签索引
    for (const tag of tags) {
      const tagKey = `cache:tag:${tag}`;
      const existing = await this.kv.get(tagKey);
      const keys = existing ? JSON.parse(existing) : [];
      
      if (!keys.includes(key)) {
        keys.push(key);
        await this.kv.put(tagKey, JSON.stringify(keys.slice(-1000)));
      }
    }
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(`cache:${key}`);
  }

  async invalidateTag(tag: string): Promise<void> {
    const tagKey = `cache:tag:${tag}`;
    const keys = await this.kv.get(tagKey);
    
    if (keys) {
      const keyList: string[] = JSON.parse(keys);
      for (const key of keyList) {
        await this.kv.delete(`cache:${key}`);
      }
      await this.kv.delete(tagKey);
    }
  }
}

// 使用示例
export async function cachedQuery<T>(
  kv: KVNamespace,
  key: string,
  queryFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const cache = new KVCache(kv);
  
  const cached = await cache.get<T>(key);
  if (cached) return cached;
  
  const result = await queryFn();
  await cache.set(key, result, options);
  
  return result;
}
