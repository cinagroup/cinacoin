import {
  createCinacoinAppKitVue,
  mainnet,
  polygon,
  arbitrum,
  optimism,
  base,
  bsc,
  avalanche,
} from '@cinacoin/appkit-config/vue';

const PROJECT_ID = import.meta.env.VITE_WC_PROJECT_ID || 'YOUR_PROJECT_ID';
const networks = [mainnet, polygon, arbitrum, optimism, base, bsc, avalanche];

const appkit = createCinacoinAppKitVue({
  projectId: PROJECT_ID,
  metadata: {
    name: 'Cinacoin Vue Demo',
    description: 'Cinacoin Vue Demo — Connect any wallet to any chain',
    url: import.meta.env.VITE_APP_URL ?? 'https://vue.cinacoin.com',
    icons: ['https://avatars.githubusercontent.com/u/37784886'],
  },
  themeMode: 'dark',
  chains: networks,
});

export { appkit, networks };
