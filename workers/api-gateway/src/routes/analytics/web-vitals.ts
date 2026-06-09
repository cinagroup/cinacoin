import { Hono } from 'hono';

type Env = {
  Bindings: {
    ANALYTICS_KV: KVNamespace;
  };
};

const webVitals = new Hono<Env>();

webVitals.post('/analytics/web-vitals', async (c) => {
  const data = await c.req.json();
  
  // 存储到 KV（按日期分组）
  const date = new Date().toISOString().split('T')[0];
  const key = `web-vitals:${date}:${data.name}`;
  
  // 获取现有数据
  const existing = await c.env.ANALYTICS_KV.get(key);
  const metrics = existing ? JSON.parse(existing) : [];
  
  metrics.push({
    value: data.value,
    rating: data.rating,
    url: data.url,
    timestamp: data.timestamp,
  });
  
  // 保留最近 1000 条记录
  const trimmed = metrics.slice(-1000);
  
  await c.env.ANALYTICS_KV.put(key, JSON.stringify(trimmed), {
    expirationTtl: 30 * 24 * 60 * 60, // 30 天
  });
  
  // 检查是否需要告警
  await checkAlerts(c, data);
  
  return c.json({ success: true });
});

// 错误收集端点
webVitals.post('/analytics/errors', async (c) => {
  const data = await c.req.json();
  
  const key = `errors:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  
  await c.env.ANALYTICS_KV.put(key, JSON.stringify(data), {
    expirationTtl: 90 * 24 * 60 * 60, // 90 天
  });
  
  console.error('Client Error:', data.message, data.url);
  
  return c.json({ success: true });
});

// 获取性能指标
webVitals.get('/analytics/performance', async (c) => {
  const days = Number(c.req.query('days') || 7);
  const metric = c.req.query('metric'); // CLS, FID, LCP, FCP, TTFB
  
  const results: Record<string, Array<{ date: string; avg: number; good: number; count: number }>> = {};
  
  for (let i = 0; i < days; i++) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const metrics = ['CLS', 'INP', 'LCP', 'FCP', 'TTFB'];
    
    for (const m of metrics) {
      if (metric && m !== metric) continue;
      
      const key = `web-vitals:${date}:${m}`;
      const data = await c.env.ANALYTICS_KV.get(key);
      
      if (data) {
        const records = JSON.parse(data);
        const avg = records.reduce((sum: number, r: { value: number }) => sum + r.value, 0) / records.length;
        const good = records.filter((r: { rating: string }) => r.rating === 'good').length;
        
        if (!results[m]) results[m] = [];
        results[m].push({
          date,
          avg: Math.round(avg * 100) / 100,
          good: Math.round((good / records.length) * 100),
          count: records.length,
        });
      }
    }
  }
  
  return c.json({ results });
});

// 检查告警条件
async function checkAlerts(c: any, data: any) {
  const thresholds: Record<string, number> = {
    CLS: 0.1,
    INP: 200,
    LCP: 2500,
    FCP: 1800,
    TTFB: 800,
  };
  
  const threshold = thresholds[data.name];
  if (!threshold) return;
  
  // 如果指标超过阈值的 2 倍，发送告警
  if (data.value > threshold * 2) {
    await sendAlert(c, {
      metric: data.name,
      value: data.value,
      threshold,
      url: data.url,
      severity: data.value > threshold * 3 ? 'critical' : 'warning',
    });
  }
}

async function sendAlert(c: any, alert: any) {
  // 发送到 Slack/邮件等
  console.error('Performance Alert:', alert);
  
  // 存储告警记录
  const key = `alerts:${Date.now()}`;
  await c.env.ANALYTICS_KV.put(key, JSON.stringify(alert), {
    expirationTtl: 90 * 24 * 60 * 60, // 90 天
  });
}

export default webVitals;
