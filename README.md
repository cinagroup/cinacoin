# CINAcoin

The Future of Decentralized Finance

## 🌟 Overview

CINAcoin is a comprehensive Web3 infrastructure platform providing wallet, cloud services, and DeFi tools.

## 🚀 Features

- **Multi-chain Wallet**: Support for 10+ blockchain networks
- **Cloud Infrastructure**: Scalable Web3 node services
- **DeFi Tools**: Swap, staking, and yield farming
- **Developer SDK**: Build dApps with ease

## 🏗️ Architecture

### Frontend
- **Website**: cinacoin.com - Marketing and documentation
- **Backend Dashboard**: backend.cinacoin.com - Admin panel
- **Cloud Dashboard**: cloud.cinacoin.com - Cloud services console
- **Wallet Explorer**: wallet.cinacoin.com - Blockchain explorer
- **Health Status**: status.cinacoin.com - Service status page

### Backend
- **API Gateway**: api.cinacoin.com - Central API router
- **Auth Service**: auth.cinacoin.com - Authentication & authorization
- **User Service**: users.cinacoin.com - User management

### Infrastructure
- **Database**: Cloudflare D1 (SQLite)
- **Cache**: Cloudflare KV
- **Storage**: Cloudflare R2
- **Edge Computing**: Cloudflare Workers (300+ locations)

## 📦 Tech Stack

### Frontend
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Recharts

### Backend
- Hono
- Web Crypto API
- jose (JWT)
- Zod (validation)

### Database
- Cloudflare D1 (SQLite)
- 17 tables, 22 indexes

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Cloudflare account (for deployment)

### Setup

```bash
# Clone repository
git clone https://github.com/cinagroup/cinacoin.git
cd cinacoin

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build

```bash
# Build all applications
npm run build

# Build specific application
cd apps/website
npm run build
```

### Deploy

```bash
# Deploy Workers
cd workers/api-gateway
npx wrangler deploy

# Deploy Pages
cd apps/website
npm run deploy
```

## 🔐 Security

- JWT authentication with refresh tokens
- 2FA support (TOTP)
- Rate limiting on all endpoints
- CSRF protection
- Session revocation

## 📊 Monitoring

- Real-time performance monitoring
- Error tracking
- Web Vitals collection
- Alert system

Visit `backend.cinacoin.com/monitoring` for metrics.

## 🌐 Services

| Service | URL | Description |
|---------|-----|-------------|
| Website | https://cinacoin.com | Main website |
| API | https://api.cinacoin.com | REST API |
| Auth | https://auth.cinacoin.com | Authentication |
| Users | https://users.cinacoin.com | User management |
| Backend | https://backend.cinacoin.com | Admin dashboard |
| Cloud | https://cloud.cinacoin.com | Cloud console |
| Wallet | https://wallet.cinacoin.com | Wallet explorer |
| Status | https://status.cinacoin.com | Service status |

## 📚 Documentation

- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Developer Guide](docs/developer.md)
- [Security](docs/security.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 📞 Contact

- Website: https://cinacoin.com
- Email: contact@cinacoin.com
- Twitter: @cinacoin
