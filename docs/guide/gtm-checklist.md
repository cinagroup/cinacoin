# Go-To-Market Checklist

## Pre-Launch

- [ ] **Project ID**: Configure `NEXT_PUBLIC_CINACONNECT_PROJECT_ID` in `.env`
- [ ] **Metadata**: Set app name, description, URL, icons in `createCinaConnect()`
- [ ] **Domains**: Verify your domain in the CinaConnect Dashboard
- [ ] **Networks**: Configure supported chains in `networks` array
- [ ] **Features**: Enable/disable features (`swaps`, `onramp`, `analytics`)
- [ ] **Theme**: Customize `themeMode` and `themeVariables`
- [ ] **Analytics**: Enable analytics for connection tracking
- [ ] **Error Tracking**: Set up Sentry/DataDog for error monitoring

## Launch

- [ ] **Performance**: Test wallet connection flow on all target browsers
- [ ] **Mobile**: Verify deep links work on iOS and Android
- [ ] **Custom Networks**: Test custom chain configuration
- [ ] **SIWE/Auth**: Test authentication flow end-to-end
- [ ] **Payments**: Verify swap, on-ramp, and pay flows
- [ ] **Smart Accounts**: Test ERC-4337 deployment and batch calls
- [ ] **Rate Limits**: Monitor API usage against plan limits
- [ ] **Fallback**: Test degraded mode (relay down, RPC unavailable)

## Post-Launch

- [ ] **Monitor**: Track connection success rate in analytics dashboard
- [ ] **Feedback**: Collect user feedback on connection experience
- [ ] **A/B Testing**: Test different modal themes and wallet ordering
- [ ] **Performance**: Monitor Time to First Byte for connection flow
- [ ] **Updates**: Keep @cinaconnect packages up to date
- [ ] **Security**: Regular CSP header review
- [ ] **Scaling**: Plan for MAU growth (upgrade plan if needed)

## Monitoring Metrics

| Metric | Target | Tool |
|--------|--------|------|
| Connection success rate | > 95% | Analytics dashboard |
| Avg connection time | < 5s | RUM monitoring |
| Error rate | < 1% | Sentry/DataDog |
| Wallet connection drop rate | < 2% | Session tracking |
