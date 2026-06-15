/**
 * Cinacoin AppKit 初始化配置
 *
 * 使用 @reown/appkit 自定义品牌配置
 * 结合 wagmi v3 实现完整的 EVM 钱包连接。
 */
import { createAppKit } from '@reown/appkit';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, polygon, arbitrum, optimism, base, bsc, avalanche } from '@reown/appkit/networks';
import { QueryClient } from '@tanstack/react-query';

// Project ID — 从环境变量获取
const PROJECT_ID = import.meta.env.VITE_WC_PROJECT_ID || 'YOUR_PROJECT_ID';

// Cinacoin 支持的链
const networks = [mainnet, polygon, arbitrum, optimism, base, bsc, avalanche];

// Query client for React Query
const queryClient = new QueryClient();

// Wagmi adapter for Reown AppKit
const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId: PROJECT_ID,
  ssr: false,
});

// Create Cinacoin AppKit instance with custom branding
const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId: PROJECT_ID,
  metadata: {
    name: 'Cinacoin',
    description: 'Cinacoin — Connect any wallet to any chain',
    url: import.meta.env.VITE_APP_URL ?? 'https://demo.cinacoin.com',
    icons: ['https://cinacoin.com/favicon.ico'],
  },
  // 自定义品牌配置
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#0066FF',
    '--w3m-color-mix': '#0066FF',
    '--w3m-color-mix-strength': 20,
    '--w3m-font-family': 'Inter, system-ui, sans-serif',
    '--w3m-border-radius-master': '12px',
  },
  features: {
    analytics: true,
    email: false,
    socials: [],
    emailShowWallets: true,
  },
});

const wagmiConfig = wagmiAdapter.wagmiConfig;
export { wagmiAdapter, wagmiConfig, queryClient, appKit, networks };
