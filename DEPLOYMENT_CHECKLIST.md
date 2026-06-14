# Cinacoin Deployment Checklist

## Prerequisites
- [ ] GitHub repository updated (✅ already done - commit `74dc47d`)
- [ ] Cloudflare account access with appropriate permissions
- [ ] Wrangler CLI installed (`npm install -g wrangler`)

## Step 1: Authenticate with Cloudflare
```bash
cd /home/cina/.openclaw/workspace/onux
npx wrangler login
```

## Step 2: Deploy Cloudflare Pages (Documentation)
```bash
cd docs-site
npm run build
npx wrangler pages deploy docs/.vitepress/dist --project-name=cinacoin-docs --branch=main
```

## Step 3: Deploy Cloudflare Workers

### Relay Service (Cinacoin)
```bash
cd infra/relay
./scripts/deploy.sh
```

### Push Server
```bash
cd packages/push-server
npx wrangler deploy
```

### Keys Server
```bash
cd packages/keys-server  
npx wrangler deploy
```

### RPC Proxy
```bash
cd packages/rpc-proxy
npx wrangler deploy
```

### Bundler/Paymaster
```bash
cd packages/bundler
npx wrangler deploy
```

## Step 4: Verify Deployments

### Health Checks
- **Relay**: `curl https://cinacoin-wc-relay.workers.dev/health`
- **Push Server**: `curl https://push.cinacoin.com/health`
- **Keys Server**: `curl https://keys.cinacoin.com/health`
- **RPC Proxy**: `curl https://rpc.cinacoin.com/health`
- **Bundler**: `curl https://bundler.cinacoin.com/health`

### Documentation
- Visit: https://docs.cinacoin.com

### Demo Apps
- React Demo: https://demo-react.cinacoin.com
- Vue Demo: https://demo-vue.cinacoin.com
- Flutter Web: https://demo-flutter.cinacoin.com

## Step 5: Update DNS Records (if needed)
Ensure all subdomains point to Cloudflare:
- `docs.cinacoin.com` → Pages
- `*.cinacoin.com` → Workers

## Notes
- All deployments require Cloudflare authentication
- The relay script handles multi-region deployment (NAM, EUR, APAC)
- Storage setup (D1, KV) is handled automatically by deployment scripts
- Monitor Cloudflare dashboard for deployment status and logs