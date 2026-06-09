# Cloudflare Page Rules 配置

## Website (cinacoin.com)

### 规则 1: 静态资源缓存
- URL: `cinacoin.com/_next/static/*`
- 设置: Cache Level = Cache Everything, Edge Cache TTL = 1 year

### 规则 2: 图片缓存
- URL: `cinacoin.com/images/*`
- 设置: Cache Level = Cache Everything, Edge Cache TTL = 1 month

### 规则 3: API 缓存
- URL: `cinacoin.com/api/*`
- 设置: Cache Level = Standard, Edge Cache TTL = 5 minutes

## Dashboard (backend.cinacoin.com)

### 规则 1: 禁用缓存（动态内容）
- URL: `backend.cinacoin.com/*`
- 设置: Cache Level = Bypass

## 配置命令

```bash
# 使用 Cloudflare API 创建 Page Rules
export CLOUDFLARE_API_TOKEN="your-api-token"
export ZONE_ID="your-zone-id"

# 创建静态资源缓存规则
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/pagerules" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "targets": [{
      "target": "url",
      "constraint": {
        "operator": "matches",
        "value": "cinacoin.com/_next/static/*"
      }
    }],
    "actions": [{
      "id": "cache_level",
      "value": "cache_everything"
    }, {
      "id": "edge_cache_ttl",
      "value": 31536000
    }],
    "status": "active"
  }'

# 创建图片缓存规则
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/pagerules" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "targets": [{
      "target": "url",
      "constraint": {
        "operator": "matches",
        "value": "cinacoin.com/images/*"
      }
    }],
    "actions": [{
      "id": "cache_level",
      "value": "cache_everything"
    }, {
      "id": "edge_cache_ttl",
      "value": 2592000
    }],
    "status": "active"
  }'

# 创建 API 缓存规则
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/pagerules" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "targets": [{
      "target": "url",
      "constraint": {
        "operator": "matches",
        "value": "cinacoin.com/api/*"
      }
    }],
    "actions": [{
      "id": "cache_level",
      "value": "0"
    }, {
      "id": "edge_cache_ttl",
      "value": 300
    }],
    "status": "active"
  }'

# 创建 Dashboard 禁用缓存规则
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/pagerules" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "targets": [{
      "target": "url",
      "constraint": {
        "operator": "matches",
        "value": "backend.cinacoin.com/*"
      }
    }],
    "actions": [{
      "id": "cache_level",
      "value": "bypass"
    }],
    "status": "active"
  }'
```

## 验证规则

```bash
# 列出所有 Page Rules
curl -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/pagerules" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"

# 检查缓存状态（查看响应头）
curl -I https://cinacoin.com/_next/static/chunks/main.js
# 应看到: cf-cache-status: HIT (第二次请求后)
# 应看到: cache-control: public, max-age=31536000, immutable
```
