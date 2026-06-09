# 性能优化指南

## 缓存策略

### 1. 浏览器缓存

静态资源（JS/CSS/图片）：
```
Cache-Control: public, max-age=31536000, immutable
```

API 响应：
```
Cache-Control: public, max-age=300
```

### 2. CDN 边缘缓存

Cloudflare 自动缓存静态资源，可以通过 Page Rules 配置：
- 静态资源：1 年
- API 响应：5 分钟
- 页面：1 小时

详见 [Cloudflare Page Rules 配置](./cloudflare-page-rules.md)

### 3. KV 缓存

对于频繁查询的数据库数据，使用 KV 缓存：

```typescript
import { cachedQuery } from './lib/cache';

const users = await cachedQuery(
  c.env.CACHE_KV,
  'users:list',
  async () => {
    return await c.env.DB.prepare('SELECT * FROM users').all();
  },
  { ttl: 300, tags: ['users'] }
);
```

#### KV 缓存特性

- **TTL 过期**：默认 5 分钟，可自定义
- **标签失效**：支持按标签批量清除缓存
- **自动清理**：过期数据自动删除

#### 缓存失效策略

```typescript
import { KVCache } from './lib/cache';

const cache = new KVCache(c.env.CACHE_KV);

// 清除单个缓存
await cache.delete('users:list');

// 按标签清除（清除所有 users 相关缓存）
await cache.invalidateTag('users');
```

### 4. Cloudflare Cache API（边缘缓存）

API Gateway 使用 `cacheMiddleware` 自动缓存 GET 请求：

| 资源类型 | 缓存时间 | 说明 |
|----------|----------|------|
| 静态资源 (.js/.css/.png 等) | 1 年 | immutable，永不过期 |
| API 响应 (/api/*) | 5 分钟 | 短缓存，保证数据新鲜度 |
| 页面响应 | 1 小时 | 平衡性能和新鲜度 |

**缓存条件：**
- 仅 GET 请求
- 无 Authorization 头
- 非 POST/PUT/DELETE

**缓存头信息：**
- `X-Cache: HIT` — 缓存命中
- `Cache-Control` — 缓存策略

## 性能指标

### Web Vitals 目标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| LCP | < 2.5s | 最大内容绘制 |
| FID | < 100ms | 首次输入延迟 |
| CLS | < 0.1 | 累积布局偏移 |
| FCP | < 1.8s | 首次内容绘制 |
| TTFB | < 800ms | 首字节时间 |

### 监控

访问 `backend.cinacoin.com/monitoring` 查看实时性能指标。

### 缓存命中率监控

```bash
# 检查边缘缓存状态
curl -I https://api.cinacoin.com/health
# 查看 X-Cache 头: HIT 或 MISS
```

## 优化建议

### 前端

1. **代码分割**：使用 Next.js 动态导入
2. **图片优化**：使用 WebP 格式和懒加载
3. **字体优化**：使用 `next/font` 自动优化
4. **Bundle 分析**：定期运行 `npm run analyze`

### 后端

1. **数据库索引**：确保查询有合适的索引
2. **缓存策略**：使用 KV 缓存频繁查询
3. **批量操作**：避免 N+1 查询问题
4. **异步处理**：使用 `waitUntil` 异步发送日志

### CDN

1. **压缩**：启用 Brotli/Gzip 压缩
2. **HTTP/2**：确保启用 HTTP/2
3. **Early Hints**：使用 103 Early Hints 预加载资源

## 架构概览

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Browser   │────▶│  Cloudflare CDN  │────▶│  API Gateway    │
│             │     │  (Edge Cache)    │     │  (Cache API)    │
└─────────────┘     └──────────────────┘     └────────┬────────┘
                                                       │
                              ┌────────────────────────┼──────────────────┐
                              │                        │                  │
                     ┌────────▼──────┐  ┌─────────────▼───┐  ┌─────────▼──────┐
                     │  Auth Service │  │  User Service   │  │  CACHE_KV      │
                     │               │  │  (with CACHE)   │  │  (KV Cache)    │
                     └───────────────┘  └─────────────────┘  └────────────────┘
```

### 缓存层级

1. **浏览器缓存** — `Cache-Control` 头控制
2. **CDN 边缘缓存** — Cloudflare Page Rules 配置
3. **Cache API 边缘缓存** — `cacheMiddleware` 自动管理
4. **KV 应用缓存** — `KVCache` 类手动管理
