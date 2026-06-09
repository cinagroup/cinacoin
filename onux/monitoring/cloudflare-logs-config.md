# Cloudflare Logs Configuration for Cinacoin
# This configures Cloudflare Logpush to export logs to your log aggregation system

## Logpush Jobs to Configure

### 1. HTTP Request Logs
```json
{
  "name": "cinacoin-http-logs",
  "destination_conf": "s3://cinacoin-logs/cloudflare/http/{DATE}",
  "logpull_options": "fields=ClientIP,ClientRequestHost,ClientRequestMethod,ClientRequestURI,EdgeEndTimestamp,EdgeResponseBytes,EdgeResponseStatus,EdgeStartTimestamp,RayID&timestamps=rfc3339",
  "dataset": "http_requests",
  "enabled": true,
  "frequency": "high",
  "filter": {
    "where": {
      "key": "ClientRequestHTTPProtocol",
      "operator": "!=",
      "value": ""
    }
  }
}
```

### 2. Security Events (WAF, DDoS, Bot)
```json
{
  "name": "cinacoin-security-events",
  "destination_conf": "s3://cinacoin-logs/cloudflare/security/{DATE}",
  "dataset": "firewall_events",
  "enabled": true,
  "frequency": "high"
}
```

### 3. Workers Logs
```json
{
  "name": "cinacoin-workers-logs",
  "destination_conf": "s3://cinacoin-logs/cloudflare/workers/{DATE}",
  "dataset": "workers_logs",
  "enabled": true,
  "frequency": "high"
}
```

## Setup Commands

```bash
# Set your Cloudflare credentials
export CF_API_TOKEN="your_api_token"
export CF_ZONE_ID="your_zone_id"

# Create Logpush job for HTTP requests
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/logpush/jobs" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "cinacoin-http-logs",
    "destination_conf": "s3://cinacoin-logs/cloudflare/http/{DATE}",
    "logpull_options": "fields=ClientIP,ClientRequestHost,ClientRequestMethod,ClientRequestURI,EdgeEndTimestamp,EdgeResponseBytes,EdgeResponseStatus,EdgeStartTimestamp,RayID&timestamps=rfc3339",
    "dataset": "http_requests",
    "enabled": true,
    "frequency": "high"
  }'

# Create Logpush job for security events
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/logpush/jobs" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "cinacoin-security-events",
    "destination_conf": "s3://cinacoin-logs/cloudflare/security/{DATE}",
    "dataset": "firewall_events",
    "enabled": true,
    "frequency": "high"
  }'
```

## Log Levels Configuration

### Application Log Levels (via environment variables)
```env
# Auth Service
AUTH_SERVICE_LOG_LEVEL=info
AUTH_SERVICE_LOG_FORMAT=json

# API Gateway
API_GATEWAY_LOG_LEVEL=info
API_GATEWAY_LOG_FORMAT=json

# Relay Server (Rust)
RUST_LOG=info,relay=info,tower_http=info

# RPC Proxy (Go)
RPC_PROXY_LOG_LEVEL=info

# Keys Server (Rust)
KEYS_SERVER_LOG_LEVEL=info
```

### Structured Logging Format
All services should output JSON logs with the following schema:
```json
{
  "timestamp": "2026-06-08T17:00:00.000Z",
  "level": "info",
  "service": "auth-service",
  "message": "User login successful",
  "fields": {
    "userId": "usr_abc123",
    "method": "email",
    "duration_ms": 45,
    "ip": "203.0.113.1"
  },
  "traceId": "trace_xyz789"
}
```
