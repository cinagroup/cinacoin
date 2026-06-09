# 部署状态 - 2026-06-01

## 推送信息
- Commit: `f4f3c0d feat(brand): unify Cinacoin branding across all frontend projects`
- 变更: 160 files, +2,320 / -1,412 lines
- 分支: main → origin/main (git@github.com:cinagroup/cinacoin.git)

## 触发的 CI/CD
1. ✅ deploy-dashboard.yml → Cloudflare Pages (apps/backend-dashboard/**)
2. ✅ deploy-health-status.yml → Cloudflare Pages (apps/health-status/**)
3. ✅ deploy-cloudflare.yml → Cloudflare Workers (packages/rpc-proxy/cloudflare/**)
4. ✅ deploy-workers.yml → Cloudflare Workers (packages/*/cloudflare/**)
5. ⏳ Vercel → cinacoin.com + demo.cinacoin.com (Git 集成)

## Live 站点状态 (推送后 ~1 分钟)
| 站点 | Title | 状态 |
|------|-------|------|
| cinacoin.com | Cinacoin — Onchain Access, Simplified | ✅ 正确 |
| demo.cinacoin.com | CinaCoin — Wallet Connection Toolkit | ⏳ 等待部署 |
| dash.cinacoin.com | CinaCoin — Backend Dashboard | ⏳ 等待部署 |
| docs.cinacoin.com | Cinacoin | ✅ 正确 |
| status.cinacoin.com | CinaCoin — Service Status | ⏳ 等待部署 |

## 预计部署时间
- Vercel: ~2-3 分钟
- Cloudflare Pages: ~3-5 分钟
- Cloudflare Workers: ~1-2 分钟
