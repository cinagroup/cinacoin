/**
 * Cinacoin AppKit 初始化配置
 *
 * 使用 @cinacoin/appkit-config + @reown/appkit-adapter-wagmi
 * 结合 wagmi v3 实现完整的 EVM 钱包连接。
 */
import {
  createCinacoinAppKit,
  mainnet,
  polygon,
  arbitrum,
  optimism,
  base,
  bsc,
  avalanche,
} from '@cinacoin/appkit-config';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
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

// Create Cinacoin AppKit instance
const appKit = createCinacoinAppKit({
  projectId: PROJECT_ID,
  metadata: {
    name: 'Cinacoin Demo',
    description: 'Cinacoin Demo — Connect any wallet to any chain',
    url: import.meta.env.VITE_APP_URL ?? 'https://react.cinacoin.com',
    icons: ['https://avatars.githubusercontent.com/u/37784886'],
  },
  themeMode: 'dark',
  chains: networks,
});

const wagmiConfig = wagmiAdapter.wagmiConfig;
export { wagmiAdapter, wagmiConfig, queryClient, appKit, networks };
