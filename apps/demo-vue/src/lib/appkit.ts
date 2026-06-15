import { createAppKit } from '@reown/appkit';
import { mainnet, polygon, arbitrum, optimism, base, bsc, avalanche } from '@reown/appkit/networks';

const PROJECT_ID = import.meta.env.VITE_WC_PROJECT_ID || 'YOUR_PROJECT_ID';
const networks = [mainnet, polygon, arbitrum, optimism, base, bsc, avalanche];

const appkit = createAppKit({
  adapters: [],
  networks,
  projectId: PROJECT_ID,
  metadata: {
    name: 'Cinacoin Vue Demo',
    description: 'Cinacoin Vue Demo — Connect any wallet to any chain',
    url: import.meta.env.VITE_APP_URL ?? 'https://vue.cinacoin.com',
    icons: ['https://avatars.githubusercontent.com/u/37784886'],
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#0066FF',
    '--w3m-color-mix': '#0066FF',
    '--w3m-color-mix-strength': 20,
  },
});

export { appkit, networks };
