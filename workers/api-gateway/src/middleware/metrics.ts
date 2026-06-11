import { Context, Next } from 'hono';

export async function metricsMiddleware(c: Context, next: Next) {
  // Skip metrics for WebSocket upgrade requests
  const upgradeHeader = c.req.header('Upgrade');
  if (upgradeHeader?.toLowerCase() === 'websocket' || c.req.path.startsWith('/ws')) {
    await next();
    return;
  }

  const startTime = Date.now();
  
  await next();
  
  const responseTime = Date.now() - startTime;
  const serviceName = c.req.header('X-Service-Name') || 'api-gateway';
  const endpoint = c.req.path;
  const statusCode = c.res.status;
  
  // 异步发送指标（不阻塞响应）
  // Derive the metrics URL from the incoming request to avoid hardcoding
  const reqUrl = new URL(c.req.url);
  const metricsUrl = `${reqUrl.origin}/monitoring/metrics`;
  c.executionCtx.waitUntil(
    fetch(metricsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceName,
        endpoint,
        statusCode,
        responseTime,
        timestamp: Date.now(),
      }),
    }).catch(console.error)
  );
}
