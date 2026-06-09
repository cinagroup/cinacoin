import { Hono } from 'hono';

interface Env {
  ANALYTICS_KV: KVNamespace;
}

const abTesting = new Hono<{ Bindings: Env }>();

interface Experiment {
  id: string;
  name: string;
  description: string;
  variants: Variant[];
  trafficSplit: number[]; // 百分比，总和为 100
  startDate: string;
  endDate?: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
}

interface Variant {
  id: string;
  name: string;
  value: any;
}

// 获取用户的实验分配
abTesting.get('/ab/experiments', async (c) => {
  const userId = c.req.query('userId') || c.req.header('X-User-ID') || 'anonymous';
  
  // 获取所有运行中的实验
  const experimentsData = await c.env.ANALYTICS_KV.get('ab:experiments');
  const experiments: Experiment[] = experimentsData ? JSON.parse(experimentsData) : [];
  
  const runningExperiments = experiments.filter(exp => exp.status === 'running');
  
  const assignments: Record<string, any> = {};
  
  for (const exp of runningExperiments) {
    // 检查用户是否已分配
    const assignmentKey = `ab:assignment:${exp.id}:${userId}`;
    const existingAssignment = await c.env.ANALYTICS_KV.get(assignmentKey);
    
    if (existingAssignment) {
      assignments[exp.id] = JSON.parse(existingAssignment);
      continue;
    }
    
    // 新分配：基于用户 ID 哈希确定变体
    const hash = hashCode(userId + exp.id);
    const normalizedHash = Math.abs(hash) % 100;
    
    let cumulative = 0;
    let assignedVariant = exp.variants[0];
    
    for (let i = 0; i < exp.trafficSplit.length; i++) {
      cumulative += exp.trafficSplit[i];
      if (normalizedHash < cumulative) {
        assignedVariant = exp.variants[i];
        break;
      }
    }
    
    const assignment = {
      experimentId: exp.id,
      variantId: assignedVariant.id,
      variantName: assignedVariant.name,
      value: assignedVariant.value,
      assignedAt: Date.now(),
    };
    
    // 存储分配（7 天过期）
    await c.env.ANALYTICS_KV.put(assignmentKey, JSON.stringify(assignment), {
      expirationTtl: 7 * 24 * 60 * 60,
    });
    
    // 记录分配事件
    await trackEvent(c, {
      type: 'assignment',
      experimentId: exp.id,
      variantId: assignedVariant.id,
      userId,
      timestamp: Date.now(),
    });
    
    assignments[exp.id] = assignment;
  }
  
  return c.json({ assignments });
});

// 追踪转化事件
abTesting.post('/ab/track', async (c) => {
  const { eventName, userId, experimentId, variantId, metadata } = await c.req.json();
  
  await trackEvent(c, {
    type: 'conversion',
    eventName,
    experimentId,
    variantId,
    userId: userId || 'anonymous',
    metadata,
    timestamp: Date.now(),
  });
  
  return c.json({ success: true });
});

// 获取实验结果
abTesting.get('/ab/results/:experimentId', async (c) => {
  const experimentId = c.req.param('experimentId');
  
  // 获取实验配置
  const experimentsData = await c.env.ANALYTICS_KV.get('ab:experiments');
  const experiments: Experiment[] = experimentsData ? JSON.parse(experimentsData) : [];
  const experiment = experiments.find(exp => exp.id === experimentId);
  
  if (!experiment) {
    return c.json({ error: 'Experiment not found' }, 404);
  }
  
  // 获取结果数据
  const resultsKey = `ab:results:${experimentId}`;
  const resultsData = await c.env.ANALYTICS_KV.get(resultsKey);
  const results = resultsData ? JSON.parse(resultsData) : { assignments: {}, conversions: {} };
  
  // 计算统计
  const stats = experiment.variants.map(variant => {
    const assignments = results.assignments[variant.id] || 0;
    const conversions = results.conversions[variant.id] || 0;
    const conversionRate = assignments > 0 ? (conversions / assignments) * 100 : 0;
    
    return {
      variantId: variant.id,
      variantName: variant.name,
      assignments,
      conversions,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  });
  
  return c.json({ experiment, stats });
});

// 管理端：获取所有实验
abTesting.get('/ab/admin/experiments', async (c) => {
  const experimentsData = await c.env.ANALYTICS_KV.get('ab:experiments');
  const experiments: Experiment[] = experimentsData ? JSON.parse(experimentsData) : [];
  
  return c.json({ experiments });
});

// 管理端：创建/更新实验
abTesting.post('/ab/admin/experiments', async (c) => {
  const data = await c.req.json();
  
  const experimentsData = await c.env.ANALYTICS_KV.get('ab:experiments');
  const experiments: Experiment[] = experimentsData ? JSON.parse(experimentsData) : [];
  
  const existingIndex = experiments.findIndex(exp => exp.id === data.id);
  
  if (existingIndex >= 0) {
    experiments[existingIndex] = { ...experiments[existingIndex], ...data };
  } else {
    experiments.push(data);
  }
  
  await c.env.ANALYTICS_KV.put('ab:experiments', JSON.stringify(experiments));
  
  return c.json({ success: true });
});

// 辅助函数
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

async function trackEvent(c: any, event: any) {
  const date = new Date().toISOString().split('T')[0];
  const key = `ab:events:${date}`;
  
  const existing = await c.env.ANALYTICS_KV.get(key);
  const events = existing ? JSON.parse(existing) : [];
  
  events.push(event);
  
  // 保留最近 10000 条事件
  const trimmed = events.slice(-10000);
  
  await c.env.ANALYTICS_KV.put(key, JSON.stringify(trimmed), {
    expirationTtl: 90 * 24 * 60 * 60,
  });
  
  // 更新结果聚合
  if (event.type === 'assignment') {
    const resultsKey = `ab:results:${event.experimentId}`;
    const resultsData = await c.env.ANALYTICS_KV.get(resultsKey);
    const results = resultsData ? JSON.parse(resultsData) : { assignments: {}, conversions: {} };
    
    results.assignments[event.variantId] = (results.assignments[event.variantId] || 0) + 1;
    
    await c.env.ANALYTICS_KV.put(resultsKey, JSON.stringify(results));
  } else if (event.type === 'conversion') {
    const resultsKey = `ab:results:${event.experimentId}`;
    const resultsData = await c.env.ANALYTICS_KV.get(resultsKey);
    const results = resultsData ? JSON.parse(resultsData) : { assignments: {}, conversions: {} };
    
    results.conversions[event.variantId] = (results.conversions[event.variantId] || 0) + 1;
    
    await c.env.ANALYTICS_KV.put(resultsKey, JSON.stringify(results));
  }
}

export default abTesting;
