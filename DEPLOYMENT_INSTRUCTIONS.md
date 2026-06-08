# Cinacoin Deployment Instructions

## Prerequisites

1. **Cloudflare API Token**: Create a token with Pages edit permissions at https://dash.cloudflare.com/profile/api-tokens
2. **Environment Setup**: Set the `CLOUDFLARE_API_TOKEN` environment variable

## Manual Deployment Steps

Since automated deployment requires a valid Cloudflare API token, follow these manual steps:

### 1. Build All Applications

All applications have been successfully built and are ready for deployment:

```bash
# Website
cd apps/website && npm run build

# Demo
cd apps/demo && npm run build

# Backend Dashboard  
cd apps/backend-dashboard && npm run build

# Analytics Dashboard
cd apps/analytics-dashboard && npm run build

# Cloud Dashboard
cd apps/cloud-dashboard && npm run build

# Health Status
cd apps/health-status && npm run build

# Wallet Explorer
cd apps/wallet-explorer && npm run build
```

### 2. Deploy to Cloudflare Pages

For each application, use the Cloudflare dashboard or CLI:

```bash
# Example for website (replace YOUR_API_TOKEN with actual token)
export CLOUDFLARE_API_TOKEN="YOUR_API_TOKEN"
cd apps/website && npx wrangler pages deploy out --project-name cinacoin-website

# Repeat for other apps:
# - cinacoin-demo
# - cinacoin-backend-dashboard  
# - cinacoin-analytics-dashboard
# - cinacoin-cloud-dashboard
# - cinacoin-health-status
# - cinacoin-wallet-explorer
```

### 3. Alternative: Manual Upload via Cloudflare Dashboard

1. Go to [Cloudflare Pages](https://dash.cloudflare.com/pages)
2. For each project:
   - Click "Create Project" 
   - Select "Connect to Git" and choose the `cinagroup/cinacoin` repository
   - Set build command: `npm run build`
   - Set output directory: `out`
   - Deploy!

## GitHub Repository

All changes have been pushed to: https://github.com/cinagroup/Cinacoin.git

- **Commit**: `520d999e` - fix: remove problematic Geist font imports and rely on CSS variables
- **Previous Commit**: `5fdabab0` - fix: update font loading and prepare for deployment
- **Design Compliance Commit**: `78135674` - feat: achieve 100% Vercel design compliance across all apps

## Verification

After deployment, verify that all 7 applications are:
- ✅ Loading correctly with proper fonts
- ✅ Displaying consistent design system (colors, shadows, spacing)
- ✅ Showing correct logos and favicons
- ✅ Responsive and functional on all devices

## Troubleshooting

**Font Issues**: If Geist fonts don't load, ensure the `@cinacoin/design-tokens/css/cinacoin.css` file is properly imported in each app's `globals.css`.

**Build Failures**: Check that all font import statements have been removed from layout files as done in the commits above.

**Deployment Errors**: Ensure your Cloudflare API token has the necessary Pages permissions.