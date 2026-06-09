import { Hono } from 'hono';
import { KVCache, cachedQuery } from '../lib/cache';

interface Env {
  CACHE_KV: KVNamespace;
  DB: D1Database;
}

const users = new Hono<{ Bindings: Env }>();

// 获取用户列表（带缓存）
users.get('/users', async (c) => {
  const cacheKey = 'users:list';
  
  const users = await cachedQuery(
    c.env.CACHE_KV,
    cacheKey,
    async () => {
      const result = await c.env.DB.prepare(
        'SELECT id, email, username, display_name, role, status, created_at FROM users ORDER BY created_at DESC'
      ).all();
      return result.results;
    },
    { ttl: 300, tags: ['users'] } // 缓存 5 分钟
  );
  
  return c.json({ users });
});

// 创建用户后清除缓存
users.post('/users', async (c) => {
  const body = await c.req.json();
  
  // ... 创建用户逻辑
  const result = await c.env.DB.prepare(
    'INSERT INTO users (email, username, display_name) VALUES (?, ?, ?) RETURNING *'
  ).bind(body.email, body.username, body.display_name).first();
  
  // 清除缓存
  const cache = new KVCache(c.env.CACHE_KV);
  await cache.invalidateTag('users');
  
  return c.json({ user: result }, 201);
});

export default users;
