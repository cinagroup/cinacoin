import { Hono, Context } from 'hono';

type Env = {
  Bindings: {
    ANALYTICS_KV: KVNamespace;
    ALERT_WEBHOOK_URL?: string;
  };
};

interface MetricRecord {
  endpoint: string;
  statusCode: number;
  responseTime: number;
  error: string | null;
  timestamp: number;
}

interface MetricData {
  serviceName: string;
  endpoint: string;
  statusCode: number;
  responseTime: number;
  error?: string;
}

interface AlertRecord {
  type: string;
  severity: 'critical' | 'warning';
  message: string;
  serviceName: string;
  endpoint?: string;
  timestamp: number;
}

const monitoring = new Hono<Env>();

// 记录请求指标
monitoring.post('/monitoring/metrics', async (c) => {
  const { 
    serviceName, 
    endpoint, 
    statusCode, 
    responseTime, 
    error,
    timestamp = Date.now()
  } = await c.req.json();
  
  // 存储到 KV（按日期分组）
  const date = new Date(timestamp).toISOString().split('T')[0];
  const key = `metrics:${serviceName}:${date}`;
  
  const existing = await c.env.ANALYTICS_KV.get(key);
  const metrics = existing ? JSON.parse(existing) : [];
  
  metrics.push({
    endpoint,
    statusCode,
    responseTime,
    error: error || null,
    timestamp,
  });
  
  // 保留最近 10000 条记录
  const trimmed = metrics.slice(-10000);
  
  await c.env.ANALYTICS_KV.put(key, JSON.stringify(trimmed), {
    expirationTtl: 30 * 24 * 60 * 60, // 30 天
  });
  
  // 检查告警条件
  await checkAlerts(c, { serviceName, endpoint, statusCode, responseTime, error });
  
  return c.json({ success: true });
});

// 获取服务指标
monitoring.get('/monitoring/metrics/:serviceName', async (c) => {
  const serviceName = c.req.param('serviceName');
  const hours = Number(c.req.query('hours') || 24);
  
  const results = [];
  
  for (let i = 0; i < hours; i++) {
    const timestamp = Date.now() - i * 60 * 60 * 1000;
    const date = new Date(timestamp).toISOString().split('T')[0];
    const key = `metrics:${serviceName}:${date}`;
    
    const data = await c.env.ANALYTICS_KV.get(key);
    if (data) {
      const metrics: MetricRecord[] = JSON.parse(data);
      const hourMetrics = metrics.filter((m: MetricRecord) => {
        const metricHour = new Date(m.timestamp).getHours();
        return metricHour === new Date(timestamp).getHours();
      });
      
      if (hourMetrics.length > 0) {
        const avgResponseTime = hourMetrics.reduce((sum: number, m: MetricRecord) => sum + m.responseTime, 0) / hourMetrics.length;
        const errorCount = hourMetrics.filter((m: MetricRecord) => m.statusCode >= 400).length;
        const errorRate = (errorCount / hourMetrics.length) * 100;
        
        results.push({
          timestamp: new Date(timestamp).toISOString(),
          requestCount: hourMetrics.length,
          avgResponseTime: Math.round(avgResponseTime),
          errorCount,
          errorRate: Math.round(errorRate * 100) / 100,
        });
      }
    }
  }
  
  return c.json({ metrics: results.reverse() });
});

// 获取告警历史
monitoring.get('/monitoring/alerts', async (c) => {
  const limit = Number(c.req.query('limit') || 50);
  
  const alertsKey = 'alerts:history';
  const data = await c.env.ANALYTICS_KV.get(alertsKey);
  const alerts = data ? JSON.parse(data) : [];
  
  return c.json({ alerts: alerts.slice(-limit).reverse() });
});

// 检查告警条件
async function checkAlerts(c: Context<Env>, data: MetricData) {
  const alerts: AlertRecord[] = [];
  
  // 错误率告警（> 5%）
  if (data.statusCode >= 500) {
    const date = new Date().toISOString().split('T')[0];
    const key = `metrics:${data.serviceName}:${date}`;
    const metricsData = await c.env.ANALYTICS_KV.get(key);
    
    if (metricsData) {
      const metrics: MetricRecord[] = JSON.parse(metricsData);
      const recentMetrics = metrics.filter((m: MetricRecord) => Date.now() - m.timestamp < 5 * 60 * 1000);
      const errorCount = recentMetrics.filter((m: MetricRecord) => m.statusCode >= 500).length;
      const errorRate = (errorCount / recentMetrics.length) * 100;
      
      if (errorRate > 5) {
        alerts.push({
          type: 'high_error_rate',
          severity: 'critical',
          message: `High error rate (${errorRate.toFixed(2)}%) on ${data.serviceName}`,
          serviceName: data.serviceName,
          timestamp: Date.now(),
        });
      }
    }
  }
  
  // 延迟告警（> 2000ms）
  if (data.responseTime > 2000) {
    alerts.push({
      type: 'high_latency',
      severity: 'warning',
      message: `High latency (${data.responseTime}ms) on ${data.serviceName}${data.endpoint}`,
      serviceName: data.serviceName,
      endpoint: data.endpoint,
      timestamp: Date.now(),
    });
  }
  
  // 发送告警
  for (const alert of alerts) {
    await sendAlert(c, alert);
  }
}

async function sendAlert(c: Context<Env>, alert: AlertRecord) {
  // 存储告警记录
  const alertsKey = 'alerts:history';
  const data = await c.env.ANALYTICS_KV.get(alertsKey);
  const alerts = data ? JSON.parse(data) : [];
  
  alerts.push(alert);
  
  // 保留最近 1000 条告警
  const trimmed = alerts.slice(-1000);
  await c.env.ANALYTICS_KV.put(alertsKey, JSON.stringify(trimmed));
  
  // 发送通知（可以集成 Slack/邮件等）
  console.error('ALERT:', alert);
  
  // 如果有配置 webhook，发送通知
  const webhookUrl = c.env.ALERT_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert),
      });
    } catch (error) {
      console.error('Failed to send alert webhook:', error);
    }
  }
}

export default monitoring;
