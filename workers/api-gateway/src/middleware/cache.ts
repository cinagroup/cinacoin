import { Context, Next } from 'hono';

export async function cacheMiddleware(c: Context, next: Next) {
  const url = new URL(c.req.url);
  const cacheKey = new Request(url.toString(), c.req.raw);
  const cache = caches.default;
  
  // 检查是否在缓存中
  let response = await cache.match(cacheKey);
  
  if (!response) {
    await next();
    response = c.res;
    
    // 缓存 GET 请求（非认证）
    if (c.req.method === 'GET' && !c.req.header('Authorization')) {
      const path = c.req.path;
      let cacheControl = '';
      
      // 静态资源缓存 1 年
      if (path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$/)) {
        cacheControl = 'public, max-age=31536000, immutable';
      }
      // API 响应缓存 5 分钟
      else if (path.startsWith('/api/')) {
        cacheControl = 'public, max-age=300';
      }
      // 页面缓存 1 小时
      else {
        cacheControl = 'public, max-age=3600';
      }
      
      // Create new response with cache headers (avoid immutable headers error)
      const newHeaders = new Headers(response.headers);
      newHeaders.set('Cache-Control', cacheControl);
      response = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
      
      // 存储到 Cloudflare 缓存
      c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
    }
  } else {
    // 添加缓存命中头 - create new response to avoid immutable headers
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-Cache', 'HIT');
    response = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }
  
  c.res = response;
}
