# Phase 3: 监控 / 安全 / 性能 / 测试 — 详细技术规划

> **目标**: 建立生产级可观测性、安全防护、性能优化和全面测试体系，确保 Cinacoin 平台达到企业级 SLA 标准  
> **时间**: M4-M6（与智能账户/支付集成并行推进）  
> **产出物**: 监控看板、安全基线、性能基准、自动化测试套件、告警体系、运维手册

---

## 目录

1. [监控方向](#1-监控方向)
2. [安全方向](#2-安全方向)
3. [性能方向](#3-性能方向)
4. [测试方向](#4-测试方向)
5. [优先级排序与时间线](#5-优先级排序与时间线)
6. [资源需求评估](#6-资源需求评估)
7. [风险评估与缓解策略](#7-风险评估与缓解策略)
8. [验收标准](#8-验收标准)

---

## 1. 监控方向

### 1.1 架构概览

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Cinacoin 可观测性体系                          │
│                                                                      │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐              │
│  │   Metrics     │   │    Logs      │   │   Traces     │              │
│  │ (Prometheus)  │   │  (ELK Stack) │   │  (Sentry)    │              │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘              │
│         │                  │                   │                      │
│         └──────────────────┼───────────────────┘                      │
│                            │                                          │
│                   ┌────────┴────────┐                                 │
│                   │    Grafana      │  ← 统一看板                     │
│                   │  (可视化层)      │                                 │
│                   └────────┬────────┘                                 │
│                            │                                          │
│              ┌─────────────┼─────────────┐                            │
│              │             │             │                            │
│     ┌────────▼──────┐ ┌───▼────┐ ┌──────▼───────┐                    │
│     │  PagerDuty    │ │ Slack  │ │  Runbook     │                    │
│     │  (告警路由)    │ │(通知)   │ │  (自动修复)   │                    │
│     └───────────────┘ └────────┘ └──────────────┘                    │
└──────────────────────────────────────────────────────────────────────┘
```

### 1.2 日志收集 — Cloudflare Logs + ELK Stack

#### 1.2.1 数据源

| 数据源 | 采集方式 | 日志类型 | 预估量/天 |
|--------|---------|---------|----------|
| Cloudflare Workers | Logpush → S3 → Logstash | Access / HTTP / Error | ~500K 条 |
| Relay Server | Filebeat → Logstash | WebSocket / Connection | ~2M 条 |
| RPC Proxy | Filebeat → Logstash | Request / Cache / Error | ~1M 条 |
| Bundler | Filebeat → Logstash | UserOp / Gas / Submission | ~200K 条 |
| Paymaster | Filebeat → Logstash | Sponsor / Validation | ~100K 条 |
| Frontend Apps | Sentry SDK → Sentry | Client Error / Performance | ~300K 条 |
| K8s Cluster | Fluent Bit → Logstash | Pod / Event / Audit | ~800K 条 |

#### 1.2.2 ELK Stack 部署

```yaml
# Elasticsearch 集群配置
elasticsearch:
  replicas: 3
  resources:
    requests:
      cpu: "1000m"
      memory: "4Gi"
    limits:
      cpu: "2000m"
      memory: "8Gi"
  storage:
    size: 500Gi
    storageClass: gp3-encrypted
  config:
    # ILM 策略
    indexLifecyclePolicy:
      hot: 7d    # 热存储 7 天
      warm: 30d  # 温存储 30 天 (降采样)
      cold: 90d  # 冷存储 90 天
      delete: 180d  # 180 天后删除

# Logstash Pipeline
logstash:
  pipelines:
    - id: cloudflare
      input: s3 → cloudflare logpush bucket
      filter: json parse + geoip + ua parse
      output: elasticsearch [cinacoin-cf-*]
    - id: relay
      input: beats (filebeat from relay pods)
      filter: grok + mutate
      output: elasticsearch [cinacoin-relay-*]
    - id: rpc-proxy
      input: beats (filebeat from rpc pods)
      filter: json + rate calc
      output: elasticsearch [cinacoin-rpc-*]
    - id: k8s
      input: beats (fluent-bit daemonset)
      filter: kubernetes enrich
      output: elasticsearch [cinacoin-k8s-*]

# Kibana
kibana:
  replicas: 2
  dashboards:
    - relay-overview
    - rpc-proxy-analytics
    - error-rate-tracker
    - user-operation-flow
    - security-audit
```

#### 1.2.3 日志规范

```typescript
// 统一日志格式 (所有服务)
interface StructuredLog {
  timestamp: string;        // ISO 8601
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  service: string;          // relay | rpc-proxy | bundler | paymaster | frontend
  region: string;           // us-east-1 | eu-central-1 | ap-southeast-1
  traceId: string;          // 分布式追踪 ID
  spanId?: string;          // Span ID
  userId?: string;          // 脱敏用户标识
  sessionId?: string;       // 会话 ID
  chainId?: number;         // 链 ID
  method?: string;          // API 方法
  duration?: number;        // 耗时 (ms)
  statusCode?: number;      // HTTP/RPC 状态码
  errorMessage?: string;    // 错误信息
  metadata?: Record<string, unknown>;
}
```

### 1.3 性能监控 — Grafana + Prometheus

#### 1.3.1 Prometheus 采集目标

```yaml
# prometheus.yml
scrape_configs:
  # Relay Server 指标
  - job_name: 'relay-server'
    kubernetes_sd_configs:
      - role: pod
        namespaces: [cinacoin]
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        regex: relay-server
        action: keep
    scrape_interval: 15s
    metrics_path: /metrics

  # RPC Proxy 指标
  - job_name: 'rpc-proxy'
    kubernetes_sd_configs:
      - role: pod
    scrape_interval: 15s

  # Bundler 指标
  - job_name: 'bundler'
    kubernetes_sd_configs:
      - role: pod
    scrape_interval: 10s

  # Paymaster 指标
  - job_name: 'paymaster'
    kubernetes_sd_configs:
      - role: pod
    scrape_interval: 10s

  # Node Exporter (主机指标)
  - job_name: 'node-exporter'
    kubernetes_sd_configs:
      - role: node
    scrape_interval: 30s

  # Redis 指标
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  # NATS 指标
  - job_name: 'nats'
    static_configs:
      - targets: ['nats-exporter:7777']
```

#### 1.3.2 核心指标定义

```typescript
// Relay Server 指标
const relayMetrics = {
  // 连接指标
  active_connections: 'Gauge — 当前活跃 WebSocket 连接数',
  connection_rate: 'Counter — 每秒新建连接数',
  connection_errors: 'Counter — 连接失败数 (按类型分)',
  connection_duration: 'Histogram — 连接持续时间分布',

  // 消息指标
  messages_received: 'Counter — 接收消息总数',
  messages_sent: 'Counter — 发送消息总数',
  messages_dropped: 'Counter — 丢弃消息数 (队列满)',
  message_size: 'Histogram — 消息大小分布',
  message_latency: 'Histogram — 消息端到端延迟',

  // 路由指标
  route_lookup_duration: 'Histogram — 路由查找耗时',
  topic_subscribers: 'Gauge — 每个 topic 的订阅者数量',
};

// RPC Proxy 指标
const rpcProxyMetrics = {
  // 请求指标
  requests_total: 'Counter — 总请求数 (按 method/chain 分)',
  request_duration: 'Histogram — 请求耗时分布',
  request_errors: 'Counter — 错误数 (按类型分)',

  // 缓存指标
  cache_hits: 'Counter — 缓存命中数',
  cache_misses: 'Counter — 缓存未命中数',
  cache_hit_ratio: 'Gauge — 缓存命中率 (滑动窗口)',
  cache_size: 'Gauge — 当前缓存条目数',
  cache_evictions: 'Counter — 缓存淘汰数',

  // 上游指标
  upstream_requests: 'Counter — 转发到上游 RPC 的请求数',
  upstream_latency: 'Histogram — 上游响应延迟',
  upstream_errors: 'Counter — 上游错误数 (按 provider 分)',
  upstream_rate_limits: 'Counter — 触发限速次数',
};

// Bundler 指标
const bundlerMetrics = {
  userops_received: 'Counter — 收到的 UserOp 数',
  userops_submitted: 'Counter — 提交到链上的 UserOp 数',
  userops_failed: 'Counter — 失败的 UserOp 数',
  userop_gas_used: 'Histogram — Gas 消耗分布',
  userop_latency: 'Histogram — UserOp 提交到确认延迟',
  mempool_size: 'Gauge — 当前 Mempool 中 UserOp 数',
  bundle_size: 'Histogram — 每次 bundle 包含的 UserOp 数',
};

// 业务指标
const businessMetrics = {
  active_users: 'Gauge — 日活跃用户数 (滑动 24h)',
  auth_success_rate: 'Gauge — 认证成功率',
  wallet_connections: 'Counter — 钱包连接总数 (按类型分)',
  api_calls_by_client: 'Counter — 按 client_id 统计 API 调用',
  chains_usage: 'Counter — 各链使用频率',
};
```

#### 1.3.3 Grafana 看板规划

| 看板名称 | 核心面板 | 刷新频率 | 受众 |
|---------|---------|---------|------|
| **Executive Overview** | 系统健康度评分、SLA 达标率、关键错误率、DAU | 1min | 管理层 |
| **Relay Operations** | 连接数、消息吞吐、延迟 P50/P95/P99、错误率 | 15s | SRE |
| **RPC Proxy Analytics** | 请求量、缓存命中率、上游延迟、按链分布 | 15s | SRE |
| **Smart Account Monitor** | UserOp 吞吐、Gas 消耗、Bundler 健康、Paymaster 余额 | 10s | SRE + 财务 |
| **Security Dashboard** | 异常请求、WAF 拦截、暴力破解尝试、IP 黑名单 | 30s | 安全团队 |
| **Business Metrics** | 用户增长、认证漏斗、API 调用排行、收入指标 | 5min | 产品 + 商务 |
| **Cost Analytics** | 基础设施成本、RPC 调用成本、单用户成本 | 1h | 财务 + 运维 |

### 1.4 错误追踪 — Sentry 集成

#### 1.4.1 集成范围

```yaml
sentry_integration:
  # 前端项目
  frontend:
    - project: cinacoin-website
      dsn: https://xxx@sentry.io/cinacoin-website
      sampleRate: 0.1       # 10% 采样
      tracesSampleRate: 0.01 # 1% 性能追踪
    - project: cinacoin-cloud
      dsn: https://xxx@sentry.io/cinacoin-cloud
      sampleRate: 0.2
      tracesSampleRate: 0.05
    - project: cinacoin-demo
      dsn: https://xxx@sentry.io/cinacoin-demo
      sampleRate: 0.1
    - project: cinacoin-react-demo
      dsn: https://xxx@sentry.io/cinacoin-react-demo
      sampleRate: 0.1

  # 后端服务
  backend:
    - project: relay-server
      dsn: https://xxx@sentry.io/relay-server
      sampleRate: 1.0        # 100% 采样
    - project: rpc-proxy
      dsn: https://xxx@sentry.io/rpc-proxy
      sampleRate: 1.0
    - project: bundler
      dsn: https://xxx@sentry.io/bundler
      sampleRate: 1.0
    - project: paymaster
      dsn: https://xxx@sentry.io/paymaster
      sampleRate: 1.0

  # SDK (开发者使用追踪)
  sdk:
    - project: cinacoin-sdk
      dsn: https://xxx@sentry.io/cinacoin-sdk
      sampleRate: 0.01       # 1% 采样 (用户量大)
```

#### 1.4.2 Sentry 配置最佳实践

```typescript
// sentry.client.config.ts — 前端统一配置
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
  release: `cinacoin@${process.env.NEXT_PUBLIC_VERSION}`,

  // 错误过滤
  ignoreErrors: [
    'NetworkError',           // 网络波动
    'Failed to fetch',        // 浏览器网络错误
    'Load failed',            // Safari 加载错误
    'User rejected',          // 用户拒绝钱包签名 (非错误)
    'Non-Error promise rejection', // 非关键 Promise 拒绝
  ],

  // 数据脱敏
  beforeSend(event) {
    // 移除 PII
    if (event.request?.headers) {
      delete event.request.headers['Authorization'];
      delete event.request.headers['Cookie'];
    }
    // 移除钱包地址 (可选)
    if (event.user?.id) {
      event.user.id = hashAddress(event.user.id);
    }
    return event;
  },

  // 性能追踪
  tracesSampler(samplingContext) {
    // 对关键路径提高采样率
    if (samplingContext.transactionContext.name?.includes('/api/auth')) {
      return 0.1;
    }
    if (samplingContext.transactionContext.name?.includes('/api/pay')) {
      return 0.2;
    }
    return 0.01;
  },

  // Session Replay (用户行为回放)
  replaysSessionSampleRate: 0.001,  // 0.1% 会话
  replaysOnErrorSampleRate: 1.0,     // 错误时 100% 录制
});
```

### 1.5 业务指标监控

#### 1.5.1 核心业务 KPI

```yaml
business_kpis:
  # 用户活跃度
  user_activity:
    dau: "日活跃用户数 (有至少 1 次 API 调用)"
    wau: "周活跃用户数"
    mau: "月活跃用户数"
    retention_d1: "次日留存率"
    retention_d7: "7 日留存率"
    retention_d30: "30 日留存率"
    avg_sessions_per_user: "平均每用户会话数/天"

  # 认证成功率
  authentication:
    auth_success_rate: "认证成功率 (成功/总尝试)"
    auth_by_method: "按认证方式分布 (SIWE/Passkey/Social/Email)"
    auth_by_chain: "按链分布 (EVM/Solana/BTC/...)"
    auth_latency_p50: "认证耗时 P50"
    auth_latency_p99: "认证耗时 P99"
    auth_error_breakdown: "认证错误分类 (超时/签名拒绝/网络/...)"

  # API 调用量
  api_usage:
    total_api_calls: "总 API 调用量/天"
    api_calls_by_endpoint: "按端点分布"
    api_calls_by_client: "按 client_id / 开发者分布"
    api_calls_by_chain: "按链分布"
    api_error_rate: "API 错误率"
    api_latency_p50: "API 延迟 P50"
    api_latency_p99: "API 延迟 P99"

  # 智能账户
  smart_account:
    accounts_created: "新创建智能账户数/天"
    userops_submitted: "提交的 UserOp 数/天"
    userops_success_rate: "UserOp 成功率"
    gas_sponsored_total: "Gas 赞助总额/天"
    gas_sponsored_per_user: "平均每用户 Gas 赞助"
    paymaster_balance: "Paymaster 余额 (按链)"

  # 支付
  payments:
    swap_volume_usd: "Swap 交易量 (USD)/天"
    swap_count: "Swap 笔数/天"
    onramp_volume_usd: "On-Ramp 法币入金量/天"
    avg_swap_value: "平均 Swap 金额"
```

### 1.6 告警系统 — PagerDuty + Slack

#### 1.6.1 告警规则

```yaml
# alerting-rules.yaml
groups:
  - name: relay-critical
    rules:
      - alert: RelayHighErrorRate
        expr: rate(relay_errors_total[5m]) / rate(relay_requests_total[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
          team: backend
        annotations:
          summary: "Relay 错误率超过 5%"
          runbook: "https://runbook.cinacoin.com/relay-high-error-rate"

      - alert: RelayConnectionDrop
        expr: relay_active_connections < relay_active_connections offset 5m * 0.5
        for: 1m
        labels:
          severity: critical
          team: backend
        annotations:
          summary: "Relay 连接数骤降 50%+"

      - alert: RelayHighLatency
        expr: histogram_quantile(0.99, relay_message_latency_bucket) > 500
        for: 5m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "Relay P99 延迟超过 500ms"

  - name: rpc-proxy-critical
    rules:
      - alert: RPCCacheHitRateLow
        expr: rpc_cache_hits / (rpc_cache_hits + rpc_cache_misses) < 0.6
        for: 10m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "RPC 缓存命中率低于 60%"

      - alert: RPCUpstreamAllDown
        expr: sum(rate(rpc_upstream_requests_total[5m])) == 0
        for: 1m
        labels:
          severity: critical
          team: backend
        annotations:
          summary: "所有上游 RPC 不可用"

  - name: bundler-critical
    rules:
      - alert: BundlerMempoolBacklog
        expr: bundler_mempool_size > 1000
        for: 5m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "Bundler Mempool 积压超过 1000"

      - alert: PaymasterBalanceLow
        expr: paymaster_balance_eth < 0.5
        for: 1m
        labels:
          severity: critical
          team: finance
        annotations:
          summary: "Paymaster ETH 余额低于 0.5"

  - name: business-alerts
    rules:
      - alert: AuthSuccessRateDrop
        expr: rate(auth_success_total[15m]) / rate(auth_attempts_total[15m]) < 0.85
        for: 10m
        labels:
          severity: warning
          team: product
        annotations:
          summary: "认证成功率低于 85%"

      - alert: APICallSpike
        expr: rate(api_calls_total[5m]) > rate(api_calls_total[5m] offset 1h) * 5
        for: 2m
        labels:
          severity: warning
          team: security
        annotations:
          summary: "API 调用量突增 5 倍+ (可能是攻击)"
```

#### 1.6.2 告警路由

```yaml
# alertmanager.yml
route:
  receiver: default-slack
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  routes:
    # Critical → PagerDuty + Slack #alerts-critical
    - match:
        severity: critical
      receiver: pagerduty-critical
      repeat_interval: 15m
      continue: true

    # Critical → Slack
    - match:
        severity: critical
      receiver: slack-critical

    # Warning → Slack #alerts-warning
    - match:
        severity: warning
      receiver: slack-warning
      repeat_interval: 1h

    # Finance → Slack #finance-alerts
    - match:
        team: finance
      receiver: slack-finance

receivers:
  - name: pagerduty-critical
    pagerduty_configs:
      - service_key: <PAGERDUTY_SERVICE_KEY>
        severity: '{{ .CommonLabels.severity }}'
        description: '{{ .CommonAnnotations.summary }}'

  - name: slack-critical
    slack_configs:
      - api_url: <SLACK_WEBHOOK>
        channel: '#alerts-critical'
        title: '🚨 Critical Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}\n{{ end }}'

  - name: slack-warning
    slack_configs:
      - api_url: <SLACK_WEBHOOK>
        channel: '#alerts-warning'
        title: '⚠️ Warning Alert'

  - name: slack-finance
    slack_configs:
      - api_url: <SLACK_WEBHOOK>
        channel: '#finance-alerts'
        title: '💰 Finance Alert'
```

#### 1.6.3 告警分级与响应 SLA

| 级别 | 响应时间 | 解决时间 | 通知方式 | 示例 |
|------|---------|---------|---------|------|
| **P0 — Critical** | 5 min | 30 min | PagerDuty + Phone + Slack | 全链路不可用、资金安全风险 |
| **P1 — High** | 15 min | 2h | PagerDuty + Slack | 单服务不可用、缓存全部失效 |
| **P2 — Warning** | 1h | 8h | Slack | 性能下降、缓存命中率低 |
| **P3 — Info** | 4h | 24h | Slack (工作时间) | 非核心指标异常 |

---

## 2. 安全方向

### 2.1 安全架构概览

```
┌──────────────────────────────────────────────────────────────────────┐
│                     Cinacoin 纵深防御体系                             │
│                                                                      │
│  Layer 1: 边缘安全 (Cloudflare)                                      │
│  ┌────────────────────────────────────────────────────────────┐      │
│  │  WAF Rules │ DDoS Protection │ Bot Management │ IP Rules  │      │
│  └────────────────────────┬───────────────────────────────────┘      │
│                           │                                          │
│  Layer 2: 应用安全                                                 │
│  ┌────────────────────────▼───────────────────────────────────┐      │
│  │  Rate Limiting │ AuthN/AuthZ │ Input Validation │ CORS     │      │
│  └────────────────────────┬───────────────────────────────────┘      │
│                           │                                          │
│  Layer 3: 数据安全                                                   │
│  ┌────────────────────────▼───────────────────────────────────┐      │
│  │  TLS 1.3 │ AES-256 at Rest │ Key Rotation │ PII Masking   │      │
│  └────────────────────────┬───────────────────────────────────┘      │
│                           │                                          │
│  Layer 4: 基础设施安全                                                │
│  ┌────────────────────────▼───────────────────────────────────┐      │
│  │  Network Policy │ Pod Security │ Secret Management │ Audit │      │
│  └────────────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 WAF 配置 — Cloudflare WAF 规则

#### 2.2.1 Managed Rules

```yaml
cloudflare_waf:
  managed_rules:
    # OWASP Core Rule Set
    - name: "OWASP Core Rules"
      enabled: true
      action: block
      sensitivity: high

    # Cloudflare 自有规则
    - name: "Cloudflare Managed Rules"
      enabled: true
      action: block
      sensitivity: medium

    # 自定义规则集
    custom_rules:
      # 阻止已知攻击模式
      - name: "Block SQL Injection"
        expression: >
          http.request.uri.path contains "'" or
          http.request.uri.query contains "UNION SELECT" or
          http.request.uri.query contains "DROP TABLE" or
          http.request.uri.query matches "(?i)(union\\s+select|insert\\s+into|delete\\s+from)"
        action: block
        priority: 1

      - name: "Block XSS Attempts"
        expression: >
          http.request.body.raw matches "(?i)<script[^>]*>" or
          http.request.uri.query matches "(?i)(javascript:|on\\w+\\s*=)" or
          http.request.headers["content-type"] contains "text/html"
        action: block
        priority: 2

      - name: "Block Path Traversal"
        expression: >
          http.request.uri.path contains "../" or
          http.request.uri.path contains "..%2f" or
          http.request.uri.path contains "%2e%2e"
        action: block
        priority: 3

      # API 特定规则
      - name: "API - Require JSON Content-Type"
        expression: >
          http.request.uri.path starts with "/api/" and
          http.request.method in {"POST", "PUT", "PATCH"} and
          not http.request.headers["content-type"] contains "application/json"
        action: block
        priority: 10

      - name: "API - Block Oversized Payloads"
        expression: http.request.body.size > 1048576  # 1MB
        action: block
        priority: 11

      # RPC 端点保护
      - name: "RPC - Allow Only POST"
        expression: >
          http.request.uri.path contains "/rpc" and
          http.request.method != "POST"
        action: block
        priority: 20

      - name: "RPC - Validate JSON-RPC Format"
        expression: >
          http.request.uri.path contains "/rpc" and
          not http.request.body.raw matches "\\{.*\"jsonrpc\".*\"2\\.0\".*\\}"
        action: challenge
        priority: 21
```

#### 2.2.2 WAF 例外规则

```yaml
waf_exceptions:
  # 允许特定来源的 WebSocket 升级
  - name: "Allow WebSocket Upgrade"
    expression: >
      http.request.headers["upgrade"] eq "websocket" and
      http.request.uri.path starts with "/relay/"
    action: skip
    rules_to_skip: ["body-inspection"]

  # 允许健康检查
  - name: "Allow Health Checks"
    expression: http.request.uri.path eq "/health"
    action: skip
    rules_to_skip: ["all"]

  # 允许 Cloudflare 内部通信
  - name: "Allow Internal Traffic"
    expression: ip.src in {internal_ip_ranges}
    action: skip
    rules_to_skip: ["all"]
```

### 2.3 DDoS 防护

#### 2.3.1 Cloudflare DDoS 配置

```yaml
ddos_protection:
  # Layer 3/4 DDoS (Cloudflare 自动)
  layer3_4:
    always_on: true
    auto_adjust: true

  # Layer 7 DDoS (需要配置)
  layer7:
    # 速率限制
    rate_limiting:
      - name: "Global API Rate Limit"
        path: "/api/*"
        rate: 100/10s     # 每 IP 每 10 秒 100 次
        action: block
        duration: 60s

      - name: "Auth Endpoint Rate Limit"
        path: "/api/auth/*"
        rate: 10/60s      # 每 IP 每分钟 10 次
        action: block
        duration: 300s

      - name: "RPC Endpoint Rate Limit"
        path: "/rpc/*"
        rate: 50/10s      # 每 IP 每 10 秒 50 次
        action: challenge
        duration: 120s

      - name: "WebSocket Connection Rate"
        path: "/relay/*"
        rate: 5/10s       # 每 IP 每 10 秒 5 个新连接
        action: challenge
        duration: 60s

    # 挑战模式
    challenge:
      # 自动挑战可疑流量
      automatic_challenge:
        enabled: true
        sensitivity: medium
        modes: ["managed-challenge"]

      # 对国家/地区启用挑战 (可选)
      country_challenge:
        enabled: false  # 按需开启
        countries: []
        mode: "managed-challenge"

    # Under Attack Mode
    under_attack:
      auto_trigger:
        enabled: true
        threshold: "当请求量超过基线 10x 时自动触发"
      manual_trigger: "通过 API/Dashboard 手动触发"
```

#### 2.3.2 应用层防护

```typescript
// 自适应速率限制 (服务端实现)
interface AdaptiveRateLimiter {
  /**
   * 基于用户行为评分的动态限速
   * - 正常用户: 100 req/10s
   * - 可疑用户: 20 req/10s + Challenge
   * - 恶意用户: 0 req (Block)
   */
  evaluate(request: Request): RateLimitDecision;
}

// 基于信誉的分级
enum ClientReputation {
  TRUSTED = 'trusted',     // 已知合法客户 → 宽松限制
  NORMAL = 'normal',       // 普通用户 → 标准限制
  SUSPICIOUS = 'suspicious', // 可疑行为 → 严格限制 + Challenge
  MALICIOUS = 'malicious',   // 确认恶意 → 封禁
}

// 请求评分因子
const reputationFactors = {
  requestFrequency: 0.3,     // 请求频率异常
  errorRate: 0.2,            // 错误率异常
  geoConsistency: 0.1,       // 地理位置一致性
  userAgentValidity: 0.1,    // UA 合法性
  tlsFingerprint: 0.1,       // TLS 指纹
  requestPattern: 0.2,       // 请求模式 (是否像机器人)
};
```

### 2.4 API 安全

#### 2.4.1 多层速率限制

```typescript
// Rate Limiting 配置
interface RateLimitConfig {
  // 全局限制
  global: {
    windowMs: 60_000;       // 1 分钟窗口
    maxRequests: 60;         // 每窗口最大请求
    keyGenerator: (req) => req.ip;
  };

  // 按端点限制
  endpoints: {
    '/api/auth/nonce': {
      windowMs: 60_000,
      maxRequests: 10,
      skipSuccessfulRequests: false,
    };
    '/api/auth/verify': {
      windowMs: 60_000,
      maxRequests: 20,
      skipSuccessfulRequests: false,
    };
    '/api/rpc/*': {
      windowMs: 10_000,
      maxRequests: 50,
      skipSuccessfulRequests: false,
    };
    '/api/pay/swap': {
      windowMs: 60_000,
      maxRequests: 10,
      skipSuccessfulRequests: true,  // 成功交易不计入限制
    };
  };

  // 按 API Key 限制 (开发者)
  apiKey: {
    windowMs: 86_400_000,   // 24 小时窗口
    maxRequests: 100_000,    // 每天 10 万次
    burstLimit: 100,         // 突发 100 次/秒
  };
}

// 响应头
const rateLimitHeaders = {
  'X-RateLimit-Limit': '60',
  'X-RateLimit-Remaining': '45',
  'X-RateLimit-Reset': '1717862400',
  'Retry-After': '30',  // 仅在被限制时返回
};
```

#### 2.4.2 IP 白名单

```typescript
// IP 白名单管理
interface IPWhitelist {
  // 管理员 IP 白名单 (强制)
  admin: string[];

  // API Key 级别白名单 (可选)
  apiKeyWhitelist: Map<string, string[]>;

  // 内部服务 IP 段
  internal: string[];

  // Cloudflare IP 段 (自动更新)
  cloudflare: string[];
}

// 验证逻辑
function validateIPAccess(ip: string, context: RequestContext): boolean {
  // 1. 检查是否在黑名单
  if (ipBlacklist.has(ip)) return false;

  // 2. 管理员端点 — 必须白名单
  if (context.isAdminEndpoint) {
    return adminIPWhitelist.includes(ip);
  }

  // 3. 内部端点 — 必须内部 IP
  if (context.isInternalEndpoint) {
    return internalRanges.some(range => ipInRange(ip, range));
  }

  // 4. 其他端点 — 正常速率限制
  return true;
}
```

#### 2.4.3 Bot 检测

```typescript
// Bot 检测策略
interface BotDetection {
  // 被动检测 (无感)
  passive: {
    // TLS 指纹 (JA3/JA4)
    tlsFingerprinting: true;
    // HTTP/2 指纹
    http2Fingerprinting: true;
    // 请求时序分析
    timingAnalysis: true;
    // 行为模式分析
    behaviorAnalysis: true;
  };

  // 主动检测 (有挑战)
  active: {
    // JavaScript Challenge
    jsChallenge: {
      enabled: true;
      triggerOn: 'suspicious';  // 可疑时触发
    };
    // Turnstile (Cloudflare 无感验证)
    turnstile: {
      enabled: true;
      triggerOn: ['auth', 'payment'];  // 关键操作时触发
      mode: 'managed';
    };
    // CAPTCHA (最后手段)
    captcha: {
      enabled: true;
      triggerOn: 'confirmed-bot';
      provider: 'cloudflare-turnstile';
    };
  };

  // 已知 Bot 处理
  knownBots: {
    // 允许搜索引擎爬虫
    allowSearchEngines: true;
    // 允许监控服务
    allowMonitors: ['uptime-kuma', 'pingdom'];
    // 阻止其他已知 bot
    blockOthers: true;
  };
}
```

### 2.5 数据加密

#### 2.5.1 传输加密

```yaml
transport_encryption:
  # 外部通信 (用户 → Cloudflare)
  external:
    tls_version: "1.3"       # 仅 TLS 1.3
    min_tls_version: "1.2"   # 最低 TLS 1.2
    cipher_suites:
      - TLS_AES_256_GCM_SHA384
      - TLS_CHACHA20_POLY1305_SHA256
      - TLS_AES_128_GCM_SHA256
    hsts:
      enabled: true
      max_age: 31536000       # 1 年
      include_subdomains: true
      preload: true
    certificate:
      provider: cloudflare    # Cloudflare 通用证书 / 自定义
      key_type: ECDSA_P256

  # 内部通信 (服务间)
  internal:
    mtls:
      enabled: true           # 双向 TLS
      ca: "cinacoin-internal-ca"
      cert_rotation: "30d"
    # 服务网格 (如使用 Istio)
    service_mesh:
      provider: istio
      mtls_mode: STRICT

  # WebSocket 加密
  websocket:
    protocol: "wss://"        # 强制 WSS
    certificate: "same as external"
```

#### 2.5.2 静态加密

```yaml
storage_encryption:
  # 数据库
  database:
    encryption_at_rest: true
    algorithm: AES-256-GCM
    key_management:
      provider: AWS KMS       # 或 HashiCorp Vault
      key_rotation: "90d"
    # 字段级加密 (敏感字段)
    field_level_encryption:
      - table: users
        columns: [email, phone]
        algorithm: AES-256-GCM
      - table: wallets
        columns: [private_key_encrypted, seed_phrase_encrypted]
        algorithm: AES-256-GCM
      - table: api_keys
        columns: [key_hash, key_encrypted]
        algorithm: AES-256-GCM

  # Redis
  redis:
    encryption_at_rest: true
    encryption_in_transit: true  # TLS
    auth: ACL + password

  # 对象存储 (S3)
  s3:
    encryption: SSE-KMS
    bucket_key_enabled: true

  # 密钥管理
  key_management:
    primary: AWS KMS
    fallback: HashiCorp Vault
    key_hierarchy:
      master_key: "CMK (Customer Master Key)"
      data_keys: "DEK (Data Encryption Key) per service"
      rotation: "90 days automatic"
    backup:
      encrypted_backup: true
      backup_key: "separate KMS key in different region"
```

### 2.6 安全审计

#### 2.6.1 定期安全扫描

```yaml
security_scanning:
  # SAST — 静态代码分析
  sast:
    tool: Semgrep + CodeQL
    schedule: "every PR + nightly full scan"
    languages: [typescript, rust, solidity]
    severity_threshold: medium  # Medium+ 必须修复
    gates:
      pr_block: [critical, high]
      warning: [medium]

  # DAST — 动态应用测试
  dast:
    tool: OWASP ZAP
    schedule: "weekly + after each deployment"
    targets:
      - https://cinacoin.com
      - https://cloud.cinacoin.com
      - https://relay.cinacoin.com
      - https://rpc.cinacoin.com
    scan_profiles:
      - baseline  # 快速基线扫描
      - full      # 完整扫描 (weekly)
      - api       # API 专项扫描

  # SCA — 依赖组件分析
  sca:
    tool: Snyk + Dependabot
    schedule: "continuous"
    actions:
      vulnerability: "auto-create PR for fix"
      license: "flag non-compatible licenses"
    severity_threshold: high

  # 容器扫描
  container:
    tool: Trivy
    schedule: "every image build"
    gates:
      block_deploy: [critical, high]
    base_images: "distroless / alpine (minimal attack surface)"

  # 基础设施扫描
  infrastructure:
    tool: Checkov + tfsec
    schedule: "every PR to infra/ directory"
    targets: [terraform, kubernetes, helm]

  # 渗透测试
  penetration_test:
    frequency: "quarterly"
    provider: "外部安全公司 (推荐: Trail of Bits / OpenZeppelin)"
    scope:
      - Web 应用 (所有前端)
      - API (所有后端)
      - WebSocket (Relay)
      - 智能合约 (Bundler/Paymaster)
    report: "内部安全报告 + 修复计划"
```

#### 2.6.2 安全合规检查清单

```yaml
security_checklist:
  # OWASP Top 10 (2021)
  owasp_top_10:
    A01_broken_access_control:
      status: "implementing"
      measures: ["RBAC", "API Key scopes", "CORS policy"]
    A02_cryptographic_failures:
      status: "implemented"
      measures: ["TLS 1.3", "AES-256", "KMS key rotation"]
    A03_injection:
      status: "implemented"
      measures: ["Parameterized queries", "Input validation", "WAF"]
    A04_insecure_design:
      status: "implementing"
      measures: ["Threat modeling", "Security review in PR"]
    A05_security_misconfiguration:
      status: "implementing"
      measures: ["Hardened K8s", "CIS benchmarks", "Automated scanning"]
    A06_vulnerable_components:
      status: "implemented"
      measures: ["Snyk", "Dependabot", "Container scanning"]
    A07_auth_failures:
      status: "implemented"
      measures: ["Multi-factor", "Rate limiting", "Session management"]
    A08_data_integrity:
      status: "implementing"
      measures: ["Signed deployments", "SBOM", "Image verification"]
    A09_logging_monitoring:
      status: "implementing"
      measures: ["ELK", "Sentry", "Prometheus", "Alerting"]
    A10_ssrf:
      status: "implemented"
      measures: ["URL allowlist", "Network policies", "DNS filtering"]

  # SOC 2 Type II (如需要)
  soc2:
    readiness: "phase 3 为准备阶段"
    target_audit: "M8-M9"
```

---

## 3. 性能方向

### 3.1 缓存策略 — Redis 缓存层

#### 3.1.1 缓存架构

```
┌──────────────────────────────────────────────────────────────┐
│                    Redis 缓存层架构                           │
│                                                              │
│  ┌─────────────┐     ┌─────────────────────────────┐        │
│  │   Client    │────►│     L1: 本地缓存 (LRU)       │        │
│  │  Request    │     │     容量: 1000 entries       │        │
│  └─────────────┘     │     TTL: 30s                │        │
│                      └──────────────┬──────────────┘        │
│                                     │ miss                   │
│                      ┌──────────────▼──────────────┐        │
│                      │     L2: Redis Cluster        │        │
│                      │     3 主 + 3 从              │        │
│                      │     总容量: ~30GB             │        │
│                      └──────────────┬──────────────┘        │
│                                     │ miss                   │
│                      ┌──────────────▼──────────────┐        │
│                      │     Origin (RPC / DB)        │        │
│                      └─────────────────────────────┘        │
│                                                              │
│  目标缓存命中率: >85%                                        │
└──────────────────────────────────────────────────────────────┘
```

#### 3.1.2 缓存键设计

```typescript
// 缓存键命名规范
const cacheKeyPatterns = {
  // RPC 响应缓存
  rpc: {
    // eth_blockNumber — 短 TTL (实时性要求高)
    blockNumber: (chainId: number) => `rpc:${chainId}:blockNumber`,
    // eth_getBalance — 按 block 缓存
    balance: (chainId: number, addr: string, block: string) =>
      `rpc:${chainId}:balance:${addr}:${block}`,
    // eth_call — 按 block + data 缓存
    call: (chainId: number, to: string, data: string, block: string) =>
      `rpc:${chainId}:call:${to}:${hash(data)}:${block}`,
    // eth_chainId — 长 TTL (不变)
    chainId: (chainId: number) => `rpc:${chainId}:chainId`,
    // net_version — 长 TTL (不变)
    netVersion: (chainId: number) => `rpc:${chainId}:netVersion`,
  },

  // 认证缓存
  auth: {
    nonce: (sessionId: string) => `auth:nonce:${sessionId}`,
    session: (sessionId: string) => `auth:session:${sessionId}`,
    userInfo: (userId: string) => `auth:user:${userId}`,
  },

  // 链数据缓存
  chain: {
    tokenMetadata: (chainId: number, token: string) =>
      `chain:${chainId}:token:${token}`,
    tokenPrice: (tokenId: string) => `chain:price:${tokenId}`,
    gasPrice: (chainId: number) => `chain:${chainId}:gasPrice`,
    ensName: (address: string) => `chain:ens:${address}`,
  },

  // Relay 缓存
  relay: {
    session: (topic: string) => `relay:session:${topic}`,
    subscriber: (topic: string) => `relay:subs:${topic}`,
  },
};

// TTL 策略
const ttlStrategy = {
  // 实时数据 (秒级)
  blockNumber: 2,           // 2 秒
  gasPrice: 5,              // 5 秒

  // 准实时数据 (分钟级)
  balance: 60,              // 1 分钟 (最终确认的 block)
  tokenPrice: 30,           // 30 秒
  call_latest: 30,          // 30 秒 (latest block)

  // 稳定数据 (小时级)
  call_historical: 86400,   // 24 小时 (历史 block)
  chainId: 604800,          // 7 天
  netVersion: 604800,       // 7 天
  tokenMetadata: 86400,     // 24 小时

  // 会话数据
  nonce: 300,               // 5 分钟
  session: 3600,            // 1 小时
  userInfo: 600,            // 10 分钟
};
```

#### 3.1.3 Redis Cluster 配置

```yaml
redis_cluster:
  topology:
    masters: 3
    replicas_per_master: 1
    total_nodes: 6
    hash_slots: 16384

  resources:
    per_node:
      cpu: "500m"
      memory: "8Gi"       # maxmemory 6Gi + overhead
      storage: "50Gi"     # AOF + RDB

  persistence:
    rdb:
      enabled: true
      save_intervals:
        - "900 1"     # 15 分钟内有 1 次写入
        - "300 100"   # 5 分钟内有 100 次写入
        - "60 10000"  # 1 分钟内有 10000 次写入
    aof:
      enabled: true
      fsync: "everysec"
      rewrite_threshold: "100%"

  eviction:
    policy: "allkeys-lfu"   # Least Frequently Used
    maxmemory: "6gb"
    maxmemory_samples: 10

  security:
    tls: true
    auth: ACL
    rename_dangerous_commands:
      - FLUSHDB
      - FLUSHALL
      - DEBUG
      - CONFIG  # 限制 CONFIG 命令

  monitoring:
    slow_log_threshold: 10ms  # 慢查询阈值
    latency_monitor: true
    export_metrics: true      # redis_exporter for Prometheus
```

### 3.2 数据库优化

#### 3.2.1 索引优化

```sql
-- 核心表索引策略

-- 1. 用户表
CREATE INDEX idx_users_email_hash ON users (email_hash);
CREATE INDEX idx_users_created_at ON users (created_at DESC);
CREATE INDEX idx_users_last_active ON users (last_active_at DESC);
-- 复合索引: 按状态 + 创建时间查询
CREATE INDEX idx_users_status_created ON users (status, created_at DESC);

-- 2. 钱包表
CREATE INDEX idx_wallets_user_id ON wallets (user_id);
CREATE INDEX idx_wallets_address ON wallets (address_hash);
CREATE INDEX idx_wallets_chain_id ON wallets (chain_id);
-- 复合索引: 按用户 + 链查询
CREATE INDEX idx_wallets_user_chain ON wallets (user_id, chain_id);

-- 3. 会话表 (高频读写)
CREATE INDEX idx_sessions_user_id ON sessions (user_id);
CREATE INDEX idx_sessions_expires ON sessions (expires_at);
-- 部分索引: 仅活跃会话
CREATE INDEX idx_sessions_active ON sessions (user_id)
  WHERE status = 'active' AND expires_at > NOW();

-- 4. API 调用日志 (大表)
CREATE INDEX idx_api_logs_client_id ON api_logs (client_id, created_at DESC);
CREATE INDEX idx_api_logs_endpoint ON api_logs (endpoint, created_at DESC);
-- 分区表: 按月分区
CREATE TABLE api_logs (
  id UUID,
  client_id UUID,
  endpoint TEXT,
  status_code INT,
  duration_ms INT,
  created_at TIMESTAMPTZ
) PARTITION BY RANGE (created_at);

-- 5. UserOp 记录
CREATE INDEX idx_userops_sender ON user_operations (sender);
CREATE INDEX idx_userops_status ON user_operations (status, created_at DESC);
CREATE INDEX idx_userops_bundler ON user_operations (bundler_id, submitted_at DESC);
-- GIN 索引: JSONB 字段搜索
CREATE INDEX idx_userops_metadata ON user_operations USING GIN (metadata);

-- 6. 支付/交易记录
CREATE INDEX idx_transactions_user ON transactions (user_id, created_at DESC);
CREATE INDEX idx_transactions_tx_hash ON transactions (tx_hash) WHERE tx_hash IS NOT NULL;
CREATE INDEX idx_transactions_status ON transactions (status) WHERE status != 'completed';
```

#### 3.2.2 查询优化

```typescript
// 查询优化最佳实践
const queryOptimizations = {
  // 1. 分页优化 — 使用游标代替 OFFSET
  pagination: {
    // ❌ 慢: OFFSET 性能随页码线性下降
    bad: `SELECT * FROM api_logs ORDER BY created_at DESC LIMIT 20 OFFSET 10000`,

    // ✅ 快: 基于游标的分页
    good: `SELECT * FROM api_logs
           WHERE created_at < $1
           ORDER BY created_at DESC
           LIMIT 20`,
    // 参数: $1 = 上一页最后一条的 created_at
  },

  // 2. 批量查询 — 减少 round-trip
  batch: {
    // ❌ N+1 查询
    bad: `wallets.forEach(w => db.query('SELECT * FROM tokens WHERE owner = $1', [w.address]))`,

    // ✅ 批量查询
    good: `SELECT * FROM tokens WHERE owner = ANY($1)`,
    // 参数: $1 = address[]
  },

  // 3. 部分字段查询 — 减少数据传输
  selectFields: {
    // ❌ 查询所有字段
    bad: `SELECT * FROM users WHERE id = $1`,

    // ✅ 仅查询需要的字段
    good: `SELECT id, display_name, avatar_url FROM users WHERE id = $1`,
  },

  // 4. EXPLAIN ANALYZE — 慢查询分析
  monitoring: {
    // 自动记录超过 100ms 的查询
    slowQueryLog: true,
    threshold: '100ms',
    // 每周分析 Top 10 慢查询
    weeklyAnalysis: true,
  },
};
```

#### 3.2.3 连接池配置

```typescript
// 连接池配置 (以 Node.js pg-pool 为例)
const poolConfig = {
  // 基础配置
  host: process.env.DB_HOST,
  port: 5432,
  database: 'cinacoin',
  ssl: { rejectUnauthorized: true },

  // 连接池配置
  pool: {
    min: 5,               // 最小连接数
    max: 20,              // 最大连接数 (per pod)
    idleTimeoutMs: 30_000, // 空闲连接 30s 回收
    connectionTimeoutMs: 5_000, // 获取连接超时 5s
    maxUses: 7500,         // 连接最大使用次数后回收 (防内存泄漏)
  },

  // 按服务调整
  perService: {
    'relay-server': { min: 3, max: 10 },    // 低频 DB 访问
    'rpc-proxy': { min: 5, max: 30 },       // 高频缓存查询
    'bundler': { min: 3, max: 15 },         // 中频写入
    'paymaster': { min: 2, max: 10 },       // 低频但关键
    'backend-dashboard': { min: 2, max: 20 }, // 用户驱动查询
  },
};

// PgBouncer 配置 (如使用)
const pgbouncerConfig = {
  poolMode: 'transaction',  // 事务级连接复用
  maxClientConn: 1000,      // 最大客户端连接
  defaultPoolSize: 25,      // 每用户默认连接数
  minPoolSize: 5,
  reservePoolSize: 5,       // 突发备用连接
  reservePoolTimeout: 3,    // 3s 后使用备用连接
};
```

### 3.3 CDN 优化

#### 3.3.1 Cloudflare CDN 配置

```yaml
cdn_optimization:
  # 页面规则
  page_rules:
    # 静态资源 — 最大缓存
    - url: "cinacoin.com/assets/*"
      settings:
        cache_level: "cache_everything"
        edge_cache_ttl: 31536000  # 1 年
        browser_cache_ttl: 31536000
        cache_key_fields:
          - "uri"
        minify:
          html: "on"
          css: "on"
          js: "on"
        brotli: true

    # Next.js 静态文件
    - url: "cloud.cinacoin.com/_next/static/*"
      settings:
        cache_level: "cache_everything"
        edge_cache_ttl: 31536000
        browser_cache_ttl: 31536000

    # API — 不缓存
    - url: "cinacoin.com/api/*"
      settings:
        cache_level: "bypass"
        security_level: "high"

    # 文档站
    - url: "docs.cinacoin.com/*"
      settings:
        cache_level: "cache_everything"
        edge_cache_ttl: 3600  # 1 小时
        browser_cache_ttl: 300

  # 缓存清除策略
  cache_purge:
    on_deploy: "selective"  # 部署时按 tag 清除
    api: true               # 通过 API 精确清除
    tags:
      - "v:{version}"       # 按版本号
      - "path:{url_path}"   # 按路径

  # 资源压缩
  compression:
    brotli:
      enabled: true
      level: 4              # 平衡压缩率和速度
    # 图片优化
    images:
      format: "auto"        # WebP/AVIF 自动选择
      resize: true
      lazy_load: true
```

#### 3.3.2 边缘缓存策略

```typescript
// Cloudflare Workers — 边缘缓存逻辑
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const cache = caches.default;

    // 可缓存的请求类型
    const cacheablePaths = [
      '/api/chains',           // 链列表 (变化少)
      '/api/tokens/prices',    // 代币价格 (短 TTL)
      '/api/ens/resolve/',     // ENS 解析
    ];

    if (cacheablePaths.some(p => url.pathname.startsWith(p))) {
      // 尝试从缓存获取
      let response = await cache.match(request);

      if (!response) {
        // 缓存未命中 — 请求源站
        response = await fetch(request);

        // 设置缓存头
        const ttl = getCacheTTL(url.pathname);
        response = new Response(response.body, {
          ...response,
          headers: {
            ...response.headers,
            'Cache-Control': `public, max-age=${ttl}`,
            'CDN-Cache-Control': `max-age=${ttl}`,
            'Vary': 'Accept-Encoding, Accept-Language',
          },
        });

        // 存入边缘缓存
        request.headers.set('Accept-Encoding', 'br, gzip');
        await cache.put(request, response.clone());
      }

      return response;
    }

    // 非缓存请求 — 直接转发
    return fetch(request);
  },
};

function getCacheTTL(path: string): number {
  if (path.startsWith('/api/chains')) return 3600;       // 1h
  if (path.startsWith('/api/tokens/prices')) return 60;  // 1min
  if (path.startsWith('/api/ens/')) return 300;          // 5min
  return 60;
}
```

### 3.4 API 优化

#### 3.4.1 响应压缩

```typescript
// 压缩中间件配置
const compressionConfig = {
  // 压缩阈值 — 小于此大小不压缩
  threshold: 1024,  // 1KB

  // 压缩级别
  level: 6,         // 1-11 (Brotli) / 1-9 (gzip)

  // 压缩算法优先级
  algorithms: ['br', 'gzip', 'deflate'],

  // 可压缩类型
  mimeTypes: [
    'text/html',
    'text/css',
    'text/plain',
    'text/xml',
    'application/json',
    'application/javascript',
    'application/xml',
    'application/rss+xml',
    'image/svg+xml',
  ],

  // 预期压缩率
  expectedSavings: {
    json: '60-80%',
    html: '70-85%',
    css: '75-90%',
    js: '50-70%',
  },
};
```

#### 3.4.2 分页优化

```typescript
// 游标分页实现
interface CursorPaginationParams {
  first?: number;      // 前 N 条
  last?: number;       // 后 N 条
  after?: string;      // 游标: 在此之后
  before?: string;     // 游标: 在此之前
  orderBy?: string;    // 排序字段
  orderDirection?: 'asc' | 'desc';
}

interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string;
  endCursor: string;
  totalCount: number;  // 可选: 可能影响性能
}

// GraphQL Relay 风格分页
const paginationResolver = async (
  args: CursorPaginationParams,
  query: QueryBuilder
): Promise<{ edges: Edge[]; pageInfo: PageInfo }> => {
  const limit = Math.min(args.first || args.last || 20, 100); // 最大 100

  if (args.after) {
    const cursor = decodeCursor(args.after);
    query.where('created_at', '<', cursor.value);
  }

  if (args.before) {
    const cursor = decodeCursor(args.before);
    query.where('created_at', '>', cursor.value);
  }

  query.orderBy(args.orderBy || 'created_at', args.orderDirection || 'desc');
  query.limit(limit + 1); // 多取 1 条判断是否有下一页

  const results = await query.execute();
  const hasNextPage = results.length > limit;
  const edges = results.slice(0, limit).map(node => ({
    node,
    cursor: encodeCursor({ value: node.created_at, id: node.id }),
  }));

  return {
    edges,
    pageInfo: {
      hasNextPage,
      hasPreviousPage: !!args.after,
      startCursor: edges[0]?.cursor,
      endCursor: edges[edges.length - 1]?.cursor,
      totalCount: -1, // 不计算总数以提升性能
    },
  };
};
```

#### 3.4.3 批量操作

```typescript
// 批量 RPC 请求处理
interface BatchRPCRequest {
  jsonrpc: '2.0';
  method: string;
  params: unknown[];
  id: number;
}

// 批量请求合并优化
class BatchOptimizer {
  private pendingRequests: Map<string, BatchRPCRequest[]> = new Map();
  private flushInterval: number = 50; // 50ms 合并窗口

  /**
   * 合并策略:
   * 1. 相同 method + 相同 params 前缀 → 合并为单次批量调用
   * 2. eth_getBalance 多个地址 → 单次 multicall
   * 3. eth_call 同一合约不同方法 → 单次 multicall
   */
  async addRequest(request: BatchRPCRequest): Promise<Promise<unknown>> {
    const key = `${request.method}:${this.getChainId(request)}`;

    if (!this.pendingRequests.has(key)) {
      this.pendingRequests.set(key, []);
      // 设置 flush 定时器
      setTimeout(() => this.flush(key), this.flushInterval);
    }

    this.pendingRequests.get(key)!.push(request);

    return new Promise((resolve, reject) => {
      request._resolve = resolve;
      request._reject = reject;
    });
  }

  private async flush(key: string): Promise<void> {
    const requests = this.pendingRequests.get(key);
    if (!requests?.length) return;

    this.pendingRequests.delete(key);

    try {
      // 尝试合并为 multicall
      const results = await this.executeBatch(requests);

      // 分发结果
      requests.forEach((req, i) => req._resolve(results[i]));
    } catch (error) {
      requests.forEach(req => req._reject(error));
    }
  }
}
```

### 3.5 前端优化

#### 3.5.1 代码分割

```typescript
// Next.js 动态导入策略
import dynamic from 'next/dynamic';

// 1. 路由级代码分割 (自动)
// Next.js App Router 自动按路由分割

// 2. 组件级代码分割 (手动)
const WalletModal = dynamic(
  () => import('@/components/wallet/WalletModal'),
  {
    loading: () => <WalletModalSkeleton />,
    ssr: false,  // 客户端组件不需要 SSR
  }
);

const ChainSelector = dynamic(
  () => import('@/components/chain/ChainSelector'),
  { loading: () => <ChainSelectorSkeleton /> }
);

// 3. 条件加载 — 按链适配器
const loadAdapter = async (chain: string) => {
  switch (chain) {
    case 'ethereum':
      return import('@cinacoin/adapter-evm');
    case 'solana':
      return import('@cinacoin/adapter-solana');
    case 'bitcoin':
      return import('@cinacoin/adapter-bitcoin');
    default:
      return import(`@cinacoin/adapter-${chain}`);
  }
};

// 4. 第三方库按需加载
const loadQrScanner = () => import('html5-qrcode');
const loadLottie = () => import('lottie-react');
```

#### 3.5.2 懒加载策略

```typescript
// 图片懒加载
interface ImageOptimization {
  // 原生懒加载
  nativeLazyLoading: {
    loading: 'lazy' as const;
    decoding: 'async' as const;
  };

  // Intersection Observer (高级)
  intersectionObserver: {
    rootMargin: '200px';  // 提前 200px 开始加载
    threshold: 0.01,
  };

  // 响应式图片
  responsiveImages: {
    sizes: [320, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    formats: ['avif', 'webp', 'original'],
    quality: 80,
  };
}

// 数据懒加载
const dataLazyLoading = {
  // 钱包列表 — 虚拟滚动
  walletList: {
    component: 'VirtualizedList',
    itemHeight: 72,
    overscan: 5,
    totalItems: 'dynamic',
  },

  // 交易历史 — 无限滚动
  transactionHistory: {
    component: 'InfiniteScroll',
    pageSize: 20,
    prefetchDistance: 5,  // 距底部 5 条时预加载
  },

  // 链列表 — 按使用频率排序, 其余懒加载
  chainList: {
    initialLoad: 10,       // 首屏加载 Top 10
    lazyLoad: 'on-scroll', // 滚动加载更多
  },
};
```

#### 3.5.3 预加载策略

```typescript
// 预加载关键资源
const preloadStrategy = {
  // DNS 预解析
  dnsPrefetch: [
    '//relay.cinacoin.com',
    '//rpc.cinacoin.com',
    '//api.cinacoin.com',
  ],

  // 预连接 (DNS + TCP + TLS)
  preconnect: [
    { href: 'https://relay.cinacoin.com', crossOrigin: 'anonymous' },
    { href: 'https://rpc.cinacoin.com', crossOrigin: 'anonymous' },
  ],

  // 预加载关键 JS
  preload: [
    { href: '/assets/core-sdk.js', as: 'script' },
    { href: '/assets/evm-adapter.js', as: 'script' },
  ],

  // 预渲染 (猜测用户下一步)
  prefetch: {
    // 鼠标悬停链接时预取对应路由
    linkHover: true,
    // 视口中可见的 Link 组件自动预取
    viewportLinks: true,
    // 预测性预取 (基于用户行为模型)
    predictive: false,  // Phase 5 考虑
  },

  // Service Worker 预缓存
  serviceWorker: {
    precache: [
      '/',
      '/dashboard',
      '/assets/logo.png',
      '/assets/fonts/inter.woff2',
    ],
    runtimeCache: [
      { pattern: '/api/chains', strategy: 'stale-while-revalidate' },
      { pattern: '/api/tokens/*', strategy: 'cache-first', maxAge: '1h' },
    ],
  },
};
```

#### 3.5.4 性能预算

```yaml
performance_budget:
  # Core Web Vitals 目标
  core_web_vitals:
    LCP: "< 2.5s"        # Largest Contentful Paint
    INP: "< 200ms"       # Interaction to Next Paint
    CLS: "< 0.1"         # Cumulative Layout Shift
    FCP: "< 1.8s"        # First Contentful Paint
    TTFB: "< 600ms"      # Time to First Byte

  # Bundle 大小限制
  bundle_size:
    initial_js: "< 200KB"      # gzip 后
    initial_css: "< 50KB"      # gzip 后
    total_js: "< 500KB"        # gzip 后
    total_css: "< 100KB"       # gzip 后
    max_chunk: "< 100KB"       # 单个 chunk
    max_asset: "< 500KB"       # 单个资源 (图片/字体)

  # 页面指标
  page_metrics:
    total_page_weight: "< 2MB"     # 总页面大小
    total_requests: "< 50"         # 总请求数
    dom_nodes: "< 1500"            # DOM 节点数
    js_execution_time: "< 200ms"   # JS 执行时间

  # 监控工具
  monitoring:
    - tool: Lighthouse CI
      schedule: "every PR"
      thresholds:
        performance: 90
        accessibility: 95
        best_practices: 90
        seo: 90
    - tool: Web Vitals (RUM)
      schedule: "continuous"
      sample_rate: 0.1
```

---

## 4. 测试方向

### 4.1 测试架构概览

```
┌──────────────────────────────────────────────────────────────────────┐
│                      Cinacoin 测试金字塔                              │
│                                                                      │
│                        ╱╲                                            │
│                       ╱  ╲     E2E Tests (Playwright)                │
│                      ╱ E2E╲    ~50 关键路径                          │
│                     ╱──────╲                                         │
│                    ╱        ╲    Integration Tests                   │
│                   ╱Integration╲   API + Worker + DB                  │
│                  ╱────────────╲                                      │
│                 ╱              ╲   Unit Tests (Vitest)               │
│                ╱   Unit Tests   ╲  ~500+ 测试用例                    │
│               ╱──────────────────╲                                   │
│              ╱                    ╲  Performance Tests (k6)          │
│             ╱   Performance Tests  ╲  负载 + 压力 + 耐久            │
│            ╱────────────────────────╲                                │
│           ╱                          ╲ Security Tests (ZAP)         │
│          ╱     Security Tests         ╲  DAST + SAST               │
│         ╱──────────────────────────────╲                            │
│        ╱                                ╲ Chaos Tests              │
│       ╱         Chaos Tests             ╲  故障注入 + 恢复         │
│      ╱────────────────────────────────────╲                        │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.2 单元测试 — Vitest + React Testing Library

#### 4.2.1 测试配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'packages/*/src/**/*.{test,spec}.{ts,tsx}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        // 核心模块更高要求
        'src/core/**': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        'src/test/',
      ],
    },
    // 并行执行
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
      },
    },
    // 重试失败测试
    retry: 2,
    // 超时
    testTimeout: 10_000,
  },
});
```

#### 4.2.2 测试分类与覆盖目标

```yaml
unit_test_coverage:
  # 核心 SDK
  core_sdk:
    target: 90%
    modules:
      - wallet-connection    # 钱包连接逻辑
      - encryption           # 加密/解密
      - session-management   # 会话管理
      - chain-adapters       # 链适配器接口
      - error-handling       # 错误处理
    test_examples:
      - "should establish WebSocket connection to relay"
      - "should encrypt payload with X25519 key exchange"
      - "should handle session expiry gracefully"
      - "should retry failed connections with exponential backoff"
      - "should validate chain ID before sending transaction"

  # React 组件
  react_components:
    target: 85%
    modules:
      - wallet-modal         # 钱包选择弹窗
      - chain-selector       # 链选择器
      - connect-button       # 连接按钮
      - account-display      # 账户显示
      - transaction-status   # 交易状态
    test_examples:
      - "should render wallet list on modal open"
      - "should show loading state during connection"
      - "should display connected address after success"
      - "should handle user rejection gracefully"
      - "should update UI on account change"
      - "should be keyboard accessible (a11y)"

  # RPC Proxy
  rpc_proxy:
    target: 85%
    modules:
      - request-router       # 请求路由
      - cache-manager        # 缓存管理
      - rate-limiter         # 速率限制
      - response-validator   # 响应验证
    test_examples:
      - "should route eth_call to appropriate upstream"
      - "should return cached response for cacheable methods"
      - "should enforce rate limits per IP"
      - "should validate JSON-RPC response format"
      - "should fallback to secondary provider on failure"

  # Bundler
  bundler:
    target: 85%
    modules:
      - userop-validator     # UserOp 验证
      - gas-estimator        # Gas 估算
      - mempool              # Mempool 管理
      - bundle-builder       # Bundle 构建
    test_examples:
      - "should validate UserOp signature"
      - "should estimate gas with 20% buffer"
      - "should order UserOps by gas price"
      - "should handle bundle submission failure"
      - "should reject UserOp with insufficient stake"

  # 工具函数
  utilities:
    target: 95%
    modules:
      - address-utils        # 地址处理
      - encoding             # 编解码
      - validation           # 数据验证
      - formatters           # 格式化工具
```

#### 4.2.3 测试示例

```typescript
// __tests__/core/wallet-connection.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WalletConnector } from '@/core/wallet-connection';
import { MockRelayServer } from '@/test/mocks/relay-server';

describe('WalletConnector', () => {
  let connector: WalletConnector;
  let mockRelay: MockRelayServer;

  beforeEach(() => {
    mockRelay = new MockRelayServer();
    connector = new WalletConnector({
      relayUrl: mockRelay.url,
      projectId: 'test-project',
      chains: [1, 137, 56],
    });
  });

  describe('connect', () => {
    it('should establish connection and return account', async () => {
      mockRelay.on('pairing:request', (topic) => {
        mockRelay.simulateWalletApprove(topic, {
          accounts: ['0x1234...5678'],
          chains: [1],
        });
      });

      const result = await connector.connect();

      expect(result.accounts).toHaveLength(1);
      expect(result.accounts[0]).toMatch(/^0x[0-9a-f]{40}$/i);
      expect(result.chains).toContain(1);
    });

    it('should throw when user rejects connection', async () => {
      mockRelay.on('pairing:request', (topic) => {
        mockRelay.simulateWalletReject(topic, 'User rejected');
      });

      await expect(connector.connect())
        .rejects.toThrow('User rejected connection');
    });

    it('should timeout after configured duration', async () => {
      vi.useFakeTimers();

      const connectPromise = connector.connect({ timeout: 5000 });
      vi.advanceTimersByTime(5000);

      await expect(connectPromise)
        .rejects.toThrow('Connection timeout after 5000ms');

      vi.useRealTimers();
    });
  });

  describe('signMessage', () => {
    it('should send sign request and return signature', async () => {
      const mockSignature = '0xabcdef...';
      mockRelay.on('request:sign', (req) => {
        mockRelay.respond(req.id, mockSignature);
      });

      const sig = await connector.signMessage({
        message: 'Hello, Cinacoin!',
        account: '0x1234...5678',
      });

      expect(sig).toBe(mockSignature);
    });
  });
});
```

### 4.3 集成测试 — Playwright E2E

#### 4.3.1 Playwright 配置

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['list'],
  ],

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // 模拟钱包
    storageState: './e2e/.auth/wallet-connected.json',
  },

  projects: [
    // 桌面浏览器
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // 移动端
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  // 测试服务
  webServer: [
    {
      command: 'pnpm dev',
      port: 3000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

#### 4.3.2 E2E 测试场景

```yaml
e2e_test_scenarios:
  # 核心用户流程
  critical_flows:
    - name: "钱包连接完整流程"
      priority: P0
      steps:
        - "访问首页"
        - "点击连接钱包按钮"
        - "选择 MetaMask"
        - "确认连接 (模拟)"
        - "验证显示钱包地址"
        - "验证显示正确的链"
      assertions:
        - "地址格式正确"
        - "余额显示 (或 loading)"
        - "链选择器可用"

    - name: "跨链切换"
      priority: P0
      steps:
        - "连接钱包 (Ethereum)"
        - "打开链选择器"
        - "切换到 Polygon"
        - "验证地址不变"
        - "验证链信息更新"
      assertions:
        - "chainId 更新"
        - "余额刷新"
        - "无报错"

    - name: "签名消息"
      priority: P0
      steps:
        - "连接钱包"
        - "触发签名请求"
        - "确认签名 (模拟)"
        - "验证签名结果"
      assertions:
        - "签名格式正确 (0x + 130 hex chars)"
        - "签名可验证"

    - name: "发送交易"
      priority: P0
      steps:
        - "连接钱包"
        - "填写交易信息"
        - "确认交易 (模拟)"
        - "等待交易确认"
        - "验证交易状态"
      assertions:
        - "返回交易哈希"
        - "状态变为 confirmed"
        - "Gas 消耗合理"

  # 智能账户流程
  smart_account_flows:
    - name: "创建智能账户"
      priority: P0
      steps:
        - "连接 EOA 钱包"
        - "点击创建智能账户"
        - "确认部署交易"
        - "验证智能账户地址"
      assertions:
        - "返回有效合约地址"
        - "账户显示为 Smart Account"

    - name: "Gas 赞助交易"
      priority: P1
      steps:
        - "连接智能账户"
        - "发起 Gas 赞助交易"
        - "验证用户无需支付 Gas"
        - "验证 Paymaster 代付"
      assertions:
        - "用户余额不变"
        - "交易成功"
        - "Paymaster 余额减少"

  # 异常场景
  error_flows:
    - name: "用户拒绝连接"
      priority: P1
      steps:
        - "点击连接钱包"
        - "选择 MetaMask"
        - "拒绝连接 (模拟)"
      assertions:
        - "显示友好错误信息"
        - "可重新尝试连接"

    - name: "网络断开恢复"
      priority: P1
      steps:
        - "连接钱包"
        - "模拟网络断开"
        - "等待 10 秒"
        - "恢复网络"
      assertions:
        - "自动重连"
        - "显示重连状态"
        - "数据恢复一致"

    - name: "RPC 超时处理"
      priority: P2
      steps:
        - "连接钱包"
        - "模拟 RPC 超时"
      assertions:
        - "显示超时提示"
        - "提供重试选项"
        - "不卡死 UI"
```

### 4.4 性能测试 — k6 负载测试

#### 4.4.1 k6 测试配置

```javascript
// k6-config.js
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// 自定义指标
const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency', true);
const wsConnections = new Counter('ws_connections');

// 测试阶段
export const options = {
  stages: [
    // 1. 预热 (Ramp Up)
    { duration: '2m', target: 50 },
    // 2. 正常负载
    { duration: '5m', target: 100 },
    // 3. 峰值负载
    { duration: '3m', target: 500 },
    // 4. 持续峰值
    { duration: '5m', target: 500 },
    // 5. 降压
    { duration: '3m', target: 100 },
    // 6. 恢复
    { duration: '2m', target: 0 },
  ],

  thresholds: {
    // HTTP 请求
    http_req_duration: ['p(95)<500', 'p(99)<2000'],
    http_req_failed: ['rate<0.01'],  // 错误率 < 1%

    // 自定义指标
    errors: ['rate<0.05'],
    api_latency: ['p(95)<300', 'p(99)<1000'],

    // WebSocket
    ws_connections: ['count>0'],
    ws_session_duration: ['p(95)<60000'],
  },

  // 负载分布
  scenarios: {
    // 场景 1: 普通浏览
    browsing: {
      executor: 'ramping-vus',
      exec: 'browsing',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 80 },
        { duration: '10m', target: 80 },
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },

    // 场景 2: 钱包连接
    wallet_connect: {
      executor: 'ramping-arrival-rate',
      exec: 'walletConnect',
      startRate: 1,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 200,
      stages: [
        { duration: '2m', target: 10 },   // 10 连接/秒
        { duration: '10m', target: 50 },  // 50 连接/秒
        { duration: '2m', target: 0 },
      ],
    },

    // 场景 3: RPC 调用
    rpc_calls: {
      executor: 'constant-arrival-rate',
      exec: 'rpcCall',
      rate: 200,           // 200 请求/秒
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 500,
      duration: '14m',
    },

    // 场景 4: WebSocket 持久连接
    websocket: {
      executor: 'per-vu-iterations',
      exec: 'websocketSession',
      vus: 50,
      iterations: 1,
      maxDuration: '15m',
    },
  },
};

// 场景实现
export function browsing() {
  group('Browsing', () => {
    // 首页
    let res = http.get(`${BASE_URL}/`);
    check(res, { 'homepage 200': (r) => r.status === 200 });
    apiLatency.add(res.timings.duration);
    sleep(Math.random() * 3 + 1);

    // Dashboard
    res = http.get(`${BASE_URL}/dashboard`);
    check(res, { 'dashboard 200': (r) => r.status === 200 });
    apiLatency.add(res.timings.duration);
    sleep(Math.random() * 5 + 2);
  });
}

export function walletConnect() {
  group('Wallet Connect', () => {
    // 获取 nonce
    let res = http.post(`${API_URL}/auth/nonce`, JSON.stringify({
      address: `0x${randomHex(40)}`,
    }), { headers: { 'Content-Type': 'application/json' } });
    check(res, { 'nonce 200': (r) => r.status === 200 });
    sleep(0.5);

    // 验证签名
    res = http.post(`${API_URL}/auth/verify`, JSON.stringify({
      address: `0x${randomHex(40)}`,
      signature: `0x${randomHex(130)}`,
      nonce: res.json('nonce'),
    }), { headers: { 'Content-Type': 'application/json' } });
    check(res, { 'verify 200': (r) => r.status === 200 });
    sleep(1);
  });
}

export function rpcCall() {
  group('RPC Call', () => {
    const methods = [
      { method: 'eth_blockNumber', params: [] },
      { method: 'eth_getBalance', params: [`0x${randomHex(40)}`, 'latest'] },
      { method: 'eth_chainId', params: [] },
      { method: 'eth_gasPrice', params: [] },
      { method: 'eth_call', params: [{ to: `0x${randomHex(40)}`, data: '0x' }, 'latest'] },
    ];

    const randomMethod = methods[Math.floor(Math.random() * methods.length)];

    const res = http.post(`${RPC_URL}/rpc/1`, JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      ...randomMethod,
    }), { headers: { 'Content-Type': 'application/json' } });

    check(res, { 'rpc 200': (r) => r.status === 200 });
    check(res, { 'rpc no error': (r) => !r.json('error') });
    apiLatency.add(res.timings.duration);
  });
}

export function websocketSession() {
  const wsUrl = `${RELAY_WS_URL}/relay?projectId=test`;

  const ws = new WebSocket(wsUrl);
  wsConnections.add(1);

  ws.onopen = () => {
    // 发送订阅
    ws.send(JSON.stringify({
      type: 'subscribe',
      topic: `test-${randomHex(16)}`,
    }));

    // 持续发送心跳
    const heartbeat = setInterval(() => {
      ws.send(JSON.stringify({ type: 'ping' }));
    }, 30000);

    // 5 分钟后关闭
    setTimeout(() => {
      clearInterval(heartbeat);
      ws.close();
    }, 300000);
  };

  ws.onmessage = (event) => {
    // 处理消息
  };

  ws.onerror = (error) => {
    errorRate.add(1);
  };
}
```

#### 4.4.2 性能基准

```yaml
performance_benchmarks:
  # 负载测试目标
  load_test:
    concurrent_users: 500       # 500 并发用户
    requests_per_second: 1000   # 1000 RPS
    duration: "15 minutes"
    pass_criteria:
      p95_latency: "< 500ms"
      p99_latency: "< 2000ms"
      error_rate: "< 1%"

  # 压力测试目标
  stress_test:
    ramp_to: 2000               # 逐步增加到 2000 并发
    duration: "30 minutes"
    pass_criteria:
      breaking_point: "> 1500 concurrent"
      recovery_time: "< 2 minutes"
      data_loss: "none"

  # 耐久测试目标
  soak_test:
    concurrent_users: 200       # 200 持续并发
    duration: "4 hours"
    pass_criteria:
      memory_leak: "none"       # 无内存泄漏
      latency_drift: "< 10%"    # 延迟漂移 < 10%
      error_rate: "< 0.5%"

  # 峰值测试
  spike_test:
    normal_load: 100
    spike_to: 1000              # 瞬间 10x
    spike_duration: "2 minutes"
    pass_criteria:
      no_crash: true
      recovery_time: "< 5 minutes"
      error_rate_during_spike: "< 5%"
```

### 4.5 安全测试 — OWASP ZAP

#### 4.5.1 ZAP 自动化配置

```yaml
zap_configuration:
  # 基线扫描 (CI 集成)
  baseline_scan:
    tool: "zap-baseline.py"
    target: "https://staging.cinacoin.com"
    schedule: "every PR to main"
    parameters:
      -t: "https://staging.cinacoin.com"
      -c: "config-baseline.conf"  # 告警配置
      -r: "report-baseline.html"
      -J: "report-baseline.json"
      -l: "MEDIUM"                # 最低报告级别
    fail_on:
      - alert_level: HIGH
        count: "> 0"
      - alert_level: MEDIUM
        count: "> 5"

  # 完整扫描
  full_scan:
    tool: "zap-full-scan.py"
    target: "https://staging.cinacoin.com"
    schedule: "weekly (Sunday 02:00 UTC)"
    parameters:
      -t: "https://staging.cinacoin.com"
      -c: "config-full.conf"
      -r: "report-full.html"
      -T: "60"                    # 超时 60 分钟
      -I: true                    # 忽略警告
    active_scan:
      policy: "API"
      strength: "HIGH"
      thread_per_host: 5

  # API 扫描
  api_scan:
    tool: "zap-api-scan.py"
    target: "openapi-spec.yaml"
    format: "openapi"
    schedule: "every deployment"
    parameters:
      -t: "openapi-spec.yaml"
      -f: "openapi"
      -r: "report-api.html"

  # 告警配置 (config-baseline.conf)
  alert_config:
    # 必须修复
    - id: 10011  # Cookie Without Secure Flag
      action: "FAIL"
    - id: 10015  # Incomplete or No Cache-control Header
      action: "WARN"
    - id: 10035  # Strict-Transport-Security Header
      action: "FAIL"
    - id: 10202  # Absence of Anti-CSRF Tokens
      action: "WARN"  # API 使用 token auth, 不需要 CSRF

    # 可接受
    - id: 10020  # X-Frame-Options Header
      action: "WARN"
    - id: 10036  # Server Leaks Version Information
      action: "WARN"
```

#### 4.5.2 安全测试范围

```yaml
security_test_scope:
  # 测试目标
  targets:
    - url: "https://cinacoin.com"
      type: "website"
      auth: "none"
    - url: "https://cloud.cinacoin.com"
      type: "webapp"
      auth: "session-based"
    - url: "https://relay.cinacoin.com"
      type: "websocket"
      auth: "api-key"
    - url: "https://rpc.cinacoin.com"
      type: "api"
      auth: "api-key"

  # 测试类型
  test_types:
    - injection:
        - SQL Injection
        - XSS (Reflected + Stored + DOM)
        - Command Injection
        - LDAP Injection
        - XML Injection
    - authentication:
        - Brute Force
        - Session Fixation
        - Cookie Security
        - Authentication Bypass
    - authorization:
        - IDOR (Insecure Direct Object Reference)
        - Privilege Escalation
        - Path Traversal
    - configuration:
        - Security Headers
        - CORS Misconfiguration
        - SSL/TLS Configuration
        - Information Disclosure
    - business_logic:
        - Rate Limiting Bypass
        - Parameter Tampering
        - API Abuse
```

### 4.6 混沌测试 — 故障注入

#### 4.6.1 混沌工程框架

```yaml
chaos_engineering:
  framework: LitmusChaos  # 或 Chaos Mesh
  environment: staging      # 仅在 staging 环境执行
  schedule: "bi-weekly (Wednesday 10:00 UTC)"

  # 实验分类
  experiments:
    # 基础设施故障
    infrastructure:
      - name: "pod-kill"
        description: "随机终止 Pod"
        target: relay-server, rpc-proxy
        duration: "5 minutes"
        expected_recovery: "< 30 seconds"
        blast_radius: 1  # 影响 1 个 Pod

      - name: "node-drain"
        description: "排空 K8s 节点"
        target: worker nodes
        duration: "10 minutes"
        expected_recovery: "< 2 minutes"
        blast_radius: 1

      - name: "network-partition"
        description: "网络分区 (Region 间)"
        target: us-east-1 ↔ eu-central-1
        duration: "5 minutes"
        expected_recovery: "partition 解除后立即恢复"
        blast_radius: 1 region pair

      - name: "disk-pressure"
        description: "磁盘空间耗尽"
        target: Redis pods
        disk_fill_percent: 95
        duration: "5 minutes"
        expected_recovery: "< 1 minute after release"

    # 依赖故障
    dependencies:
      - name: "redis-failure"
        description: "Redis 主节点故障"
        target: Redis master
        duration: "3 minutes"
        expected_behavior: "自动 failover 到 replica"
        expected_recovery: "< 30 seconds"

      - name: "nats-partition"
        description: "NATS 集群分区"
        target: NATS cluster
        duration: "5 minutes"
        expected_behavior: "消息延迟增加但不丢失"

      - name: "upstream-rpc-down"
        description: "上游 RPC Provider 全部不可用"
        target: All upstream RPCs
        duration: "5 minutes"
        expected_behavior: "返回缓存数据 + 友好错误"

    # 应用故障
    application:
      - name: "high-cpu"
        description: "CPU 压力测试"
        target: bundler
        cpu_stress_percent: 90
        duration: "10 minutes"
        expected_behavior: "HPA 扩容 + 请求排队"

      - name: "memory-leak-simulation"
        description: "内存压力 (大量分配)"
        target: rpc-proxy
        memory_stress_mb: 1024
        duration: "10 minutes"
        expected_behavior: "GC 正常 + OOMKill 保护"

      - name: "clock-skew"
        description: "时钟偏移"
        target: relay-server
        skew_seconds: 30
        duration: "5 minutes"
        expected_behavior: "NTP 同步 + 时间戳验证容错"
```

#### 4.6.2 GameDay 计划

```yaml
gameday:
  frequency: "monthly"
  duration: "2 hours"
  participants:
    - SRE team
    - Backend developers
    - On-call engineer

  format:
    - name: "计划阶段 (15 min)"
      activities:
        - "选择 2-3 个混沌实验"
        - "确认回滚方案"
        - "通知相关团队"

    - name: "执行阶段 (60 min)"
      activities:
        - "依次执行混沌实验"
        - "记录系统行为"
        - "观察监控看板"
        - "记录响应时间"

    - name: "回顾阶段 (45 min)"
      activities:
        - "分析系统表现"
        - "识别改进点"
        - "创建 Action Items"
        - "更新 Runbook"

  success_criteria:
    - "所有服务在预期时间内恢复"
    - "无数据丢失"
    - "告警正确触发"
    - "Runbook 步骤有效"
    - "团队响应流程顺畅"
```

---

## 5. 优先级排序与时间线

### 5.1 总体时间线 (M4-M6)

```
M4 (Week 1-4): 基础建设
├── Week 1-2: 监控基础设施
│   ├── [P0] Prometheus + Grafana 部署
│   ├── [P0] ELK Stack 部署
│   ├── [P0] Sentry 集成 (前端)
│   └── [P1] 结构化日志规范实施
│
├── Week 3-4: 安全基线
│   ├── [P0] Cloudflare WAF 规则配置
│   ├── [P0] TLS 1.3 + HSTS 强制
│   ├── [P0] 速率限制实施
│   ├── [P1] SAST 集成 (CI/CD)
│   └── [P1] 依赖扫描 (Snyk)
│
M5 (Week 5-8): 核心能力
├── Week 5-6: 性能优化
│   ├── [P0] Redis 缓存层实施
│   ├── [P0] 数据库索引优化
│   ├── [P1] CDN 缓存规则优化
│   ├── [P1] API 响应压缩
│   └── [P2] 前端代码分割
│
├── Week 7-8: 测试体系
│   ├── [P0] Vitest 单元测试框架
│   ├── [P0] 核心模块测试覆盖 (>80%)
│   ├── [P1] Playwright E2E 框架
│   ├── [P1] 关键路径 E2E 测试
│   └── [P2] k6 性能测试脚本
│
M6 (Week 9-12): 完善与验证
├── Week 9-10: 高级安全
│   ├── [P1] OWASP ZAP 自动化扫描
│   ├── [P1] 渗透测试 (外部)
│   ├── [P2] 混沌测试框架
│   └── [P2] 安全合规检查
│
├── Week 11-12: 监控完善 + 验收
│   ├── [P0] 告警规则实施 + 验证
│   ├── [P1] 业务指标看板
│   ├── [P1] Runbook 编写
│   ├── [P2] 性能基准测试报告
│   └── [P2] GameDay 演练
│
└── 最终验收
    ├── 所有 P0 任务完成
    ├── 所有 P1 任务完成或有计划
    ├── 性能基准达标
    └── 安全扫描无高危漏洞
```

### 5.2 优先级矩阵

| 优先级 | 定义 | 任务 | 时间 |
|--------|------|------|------|
| **P0 — Must Have** | 生产上线前提 | Prometheus/Grafana, ELK, Sentry, WAF, TLS, Rate Limiting, Redis Cache, DB Index, Unit Tests, Alerting | M4-M5 |
| **P1 — Should Have** | 上线后 2 周内 | 业务指标看板, Playwright E2E, k6 性能测试, ZAP 扫描, SAST/SCA, CDN 优化, Runbook | M5-M6 |
| **P2 — Nice to Have** | 持续改进 | 混沌测试, GameDay, 前端性能优化, 渗透测试, SOC 2 准备, 预测性告警 | M6+ |

---

## 6. 资源需求评估

### 6.1 人力资源

| 角色 | 人数 | 投入比例 | 职责 |
|------|------|---------|------|
| **SRE / DevOps** | 1-2 | 100% | 监控基础设施、K8s、告警、Runbook |
| **后端工程师** | 1-2 | 70% | Redis 缓存、API 优化、安全实施 |
| **前端工程师** | 1 | 50% | 前端性能优化、Sentry 集成 |
| **QA 工程师** | 1 | 100% | 测试框架搭建、测试用例编写 |
| **安全工程师** | 0.5 | 50% | WAF 规则、安全扫描、渗透测试协调 |
| **Tech Lead** | 0.5 | 30% | 架构审查、优先级决策、验收 |

**总计**: ~5-7 人 (含兼职)

### 6.2 基础设施成本

| 项目 | 月成本 (USD) | 说明 |
|------|-------------|------|
| **ELK Stack** | $300-500 | 3 节点 ES + 2 Kibana + Logstash |
| **Prometheus + Grafana** | $100-200 | 或使用 Grafana Cloud Free |
| **Sentry** | $0-26 | Team Plan (50K events) 或 Self-hosted |
| **Redis Cluster** | $200-400 | 6 节点 (3 主 3 从) |
| **Cloudflare** | $200-400 | Pro/Biz plan + WAF + Bot Mgmt |
| **k6 Cloud** (可选) | $0-99 | 或使用开源自托管 |
| **OWASP ZAP** | $0 | 开源 |
| **LitmusChaos** | $0 | 开源 |
| **渗透测试** | $5,000-15,000/次 | 季度外部审计 |

**月度新增基础设施成本**: ~$800-1,600/月  
**一次性成本**: ~$5,000-15,000 (渗透测试)

### 6.3 工具与许可

| 工具 | 许可类型 | 成本 |
|------|---------|------|
| Prometheus | Apache 2.0 | 免费 |
| Grafana | AGPL 3.0 | 免费 (Self-hosted) |
| ELK Stack | Elastic License 2.0 | 免费 (基础功能) |
| Sentry | BSL 1.1 | 免费 (Self-hosted) / $26+ (Cloud) |
| Vitest | MIT | 免费 |
| Playwright | Apache 2.0 | 免费 |
| k6 | AGPL 3.0 | 免费 (OSS) |
| OWASP ZAP | Apache 2.0 | 免费 |
| LitmusChaos | Apache 2.0 | 免费 |
| PagerDuty | Commercial | $21/user/month |

---

## 7. 风险评估与缓解策略

### 7.1 风险矩阵

| 风险 | 概率 | 影响 | 风险等级 | 缓解策略 |
|------|------|------|---------|---------|
| **ELK Stack 资源消耗超预期** | 高 | 中 | 🟠 High | 严格 ILM 策略 + 采样 + 考虑 Loki 替代 |
| **Redis 缓存一致性问题** | 中 | 高 | 🟠 High | 合理 TTL + Cache-Aside 模式 + 监控 |
| **WAF 规则误拦截合法请求** | 中 | 高 | 🟠 High | 先 Log 模式观察 1 周 → 再 Block |
| **测试覆盖不足导致遗漏** | 中 | 中 | 🟡 Medium | 覆盖率门禁 + 代码审查 |
| **性能优化影响功能正确性** | 低 | 高 | 🟡 Medium | 充分测试 + 灰度发布 + 回滚方案 |
| **告警疲劳 (Alert Fatigue)** | 中 | 中 | 🟡 Medium | 合理阈值 + 告警分级 + 定期回顾 |
| **安全扫描发现大量漏洞** | 中 | 中 | 🟡 Medium | 分阶段修复 + 风险接受流程 |
| **混沌测试导致生产事故** | 低 | 高 | 🟡 Medium | 仅 staging 环境 + blast radius 限制 |
| **团队技能不足 (SRE/安全)** | 中 | 中 | 🟡 Medium | 培训 + 外部顾问 + 文档 |
| **成本超预算** | 低 | 中 | 🟢 Low | 月度成本审查 + 自动伸缩 + Spot 实例 |

### 7.2 详细缓解方案

#### 7.2.1 ELK 资源控制

```yaml
elk_cost_control:
  # 日志采样策略
  sampling:
    debug_logs: 0.01      # Debug 日志仅保留 1%
    info_logs: 0.1        # Info 日志保留 10%
    warn_logs: 1.0        # Warning+ 全量保留
    error_logs: 1.0       # Error+ 全量保留

  # 字段裁剪
  field_pruning:
    remove_fields: ["request.headers.cookie", "request.headers.authorization"]
    truncate_fields:
      request.body: 1024   # 请求体截断到 1KB
      response.body: 2048  # 响应体截断到 2KB

  # 降级方案
  fallback:
    if_elk_overloaded: "switch to Loki (lighter weight)"
    if_storage_full: "increase ILM delete threshold"
    if_query_slow: "add more data nodes"
```

#### 7.2.2 WAF 渐进式部署

```yaml
waf_deployment_strategy:
  phase_1_week_1:
    mode: "log-only"
    actions:
      - "部署所有规则为 Log 模式"
      - "收集误拦截数据"
      - "分析 legitimate traffic patterns"

  phase_2_week_2:
    mode: "selective-block"
    actions:
      - "Block: SQL Injection, XSS (高置信度)"
      - "Log: 其他规则"
      - "添加白名单例外"

  phase_3_week_3:
    mode: "full-block"
    actions:
      - "Block: 所有 High confidence 规则"
      - "Challenge: Medium confidence 规则"
      - "持续监控误拦截率"

  ongoing:
    review_frequency: "weekly"
    metrics:
      - "误拦截率 (目标 < 0.01%)"
      - "拦截总量趋势"
      - "Top 拦截规则"
```

#### 7.2.3 灰度发布策略

```yaml
canary_deployment:
  # 性能优化变更灰度
  performance_changes:
    stage_1:
      traffic: 5%
      duration: "2 hours"
      success_criteria:
        error_rate: "< baseline + 0.1%"
        latency_p99: "< baseline * 1.1"
    stage_2:
      traffic: 25%
      duration: "4 hours"
      success_criteria: "same as stage 1"
    stage_3:
      traffic: 100%
      duration: "permanent"

  # 安全规则灰度
  security_rules:
    stage_1:
      mode: "observe"
      duration: "1 week"
    stage_2:
      mode: "block (high confidence only)"
      duration: "1 week"
    stage_3:
      mode: "block (all)"
```

---

## 8. 验收标准

### 8.1 Phase 3 完成标准

| 方向 | 验收条件 | 验证方式 |
|------|---------|---------|
| **监控** | Grafana 看板覆盖所有核心服务 | Demo 演示 |
| **监控** | 告警触发到 PagerDuty < 1 min | 演练测试 |
| **监控** | 日志保留 180 天 + 查询 < 5s | 实际查询测试 |
| **监控** | Sentry 错误捕获率 > 95% | 注入测试错误 |
| **安全** | WAF 拦截 OWASP Top 10 攻击 | ZAP 扫描验证 |
| **安全** | 所有外部通信 TLS 1.2+ | SSL Labs A+ 评级 |
| **安全** | 速率限制生效 + 无误拦截 | 负载测试验证 |
| **安全** | SAST/SCA 集成 CI/CD | PR 触发验证 |
| **性能** | 缓存命中率 > 85% | Prometheus 指标 |
| **性能** | API P95 延迟 < 500ms | k6 测试报告 |
| **性能** | Core Web Vitals 全部达标 | Lighthouse CI |
| **性能** | Bundle size < 预算 | CI 门禁 |
| **测试** | 单元测试覆盖率 > 80% | Vitest coverage report |
| **测试** | E2E 覆盖 10+ 关键路径 | Playwright report |
| **测试** | 负载测试通过 500 并发 | k6 报告 |
| **测试** | 安全扫描无 High+ 漏洞 | ZAP report |

### 8.2 SLA 目标

| 指标 | 目标 | 测量方式 |
|------|------|---------|
| **可用性** | 99.9% (月度) | Prometheus + 独立监控 |
| **API 延迟 P50** | < 100ms | Prometheus histogram |
| **API 延迟 P99** | < 1000ms | Prometheus histogram |
| **错误率** | < 0.1% | Prometheus error rate |
| **MTTR** | < 30 min (P0) | PagerDuty metrics |
| **数据恢复 RPO** | < 5 min | Backup verification |
| **故障恢复 RTO** | < 15 min | DR drill |

---

## 附录

### A. 关键文档链接

| 文档 | 位置 | 说明 |
|------|------|------|
| Runbook | `/docs/runbook/` | 运维操作手册 |
| 安全策略 | `/docs/security/` | 安全策略与流程 |
| 测试指南 | `/docs/testing/` | 测试编写指南 |
| 监控看板 | Grafana → Cinacoin | 所有看板集合 |
| 告警规则 | `/infra/alerting/` | Prometheus 告警规则 |

### B. 相关 Phase 文档

| Phase | 文档 | 关系 |
|-------|------|------|
| Phase 1 | `Phase-1-Relay-RPC.md` | 被监控的服务 |
| Phase 2 | `Phase-2-UI-Components.md` | 被测试的前端 |
| Phase 3 (Smart Account) | `Phase-3-Smart-Account.md` | 并行推进 |
| Phase 4 | `Phase-4-Production.md` | 本规划的部署部分 |
| Phase 5 | `Phase-5-Optimization.md` | 后续持续优化 |

### C. 技术决策记录 (ADR)

| ADR | 决策 | 理由 |
|-----|------|------|
| ADR-001 | 选择 ELK 而非 Loki | 团队经验 + 全文搜索需求 |
| ADR-002 | Redis Cluster 而非单节点 | 高可用 + 水平扩展 |
| ADR-003 | Cloudflare WAF 而非自建 | 运维成本低 + 全球边缘 |
| ADR-004 | Playwright 而非 Cypress | 多浏览器 + 更快 + 原生并行 |
| ADR-005 | k6 而非 JMeter | 代码化 + Git 友好 + CI 集成 |
| ADR-006 | LitmusChaos 而非 Chaos Monkey | K8s 原生 + 更丰富实验 |

---

> **文档版本**: v1.0  
> **创建日期**: 2026-06-08  
> **最后更新**: 2026-06-08  
> **作者**: Cinacoin Engineering Team  
> **审核人**: Tech Lead + SRE Lead
