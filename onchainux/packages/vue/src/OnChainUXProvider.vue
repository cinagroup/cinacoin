<template>
  <div class="ocx-root" :class="`ocx-theme-${themeMode}`" :style="themeVarsStyle">
    <slot />
  </div>
</template>

<script setup lang="ts">
/**
 * OnChainUXProvider — Vue provider component.
 * Wraps the app and provides OnChainUX state via Vue's provide/inject.
 */
import { computed, provide, ref, type CSSProperties } from 'vue';
import { ONCHAINUX_KEY } from './types';
import type { OnChainUXConfig, AccountState, Connector } from './types';

export interface OnChainUXProviderProps {
  config: OnChainUXConfig;
}

const props = defineProps<OnChainUXProviderProps>();

const themeMode = computed(() => props.config.theme?.mode ?? 'dark');

const themeVarsStyle = computed<CSSProperties>(() => {
  if (!props.config.theme?.variables) return {};
  const vars: Record<string, string> = {};
  for (const [key, val] of Object.entries(props.config.theme.variables)) {
    vars[key] = val;
  }
  return vars;
});

const status = ref<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
const account = ref<AccountState>({
  address: null,
  balance: '0.00',
  chainId: props.config.chains?.[0]?.id ?? 1,
  chainSymbol: props.config.chains?.[0]?.nativeCurrency.symbol ?? 'ETH',
});
const isSwitchingChain = ref(false);

const connectors = ref<Connector[]>([
  { id: 'metamask', name: 'MetaMask', type: 'injected' },
  { id: 'walletconnect', name: 'WalletConnect', type: 'walletconnect' },
  { id: 'coinbase', name: 'Coinbase Wallet', type: 'coinbase' },
  { id: 'rabby', name: 'Rabby', type: 'injected' },
  { id: 'email', name: 'Email', type: 'email' },
]);

async function connect(connectorId: string): Promise<void> {
  status.value = 'connecting';
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    account.value = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      balance: '1.234',
      chainId: props.config.chains?.[0]?.id ?? 1,
      chainSymbol: props.config.chains?.[0]?.nativeCurrency.symbol ?? 'ETH',
    };
    status.value = 'connected';
  } catch {
    status.value = 'error';
  }
}

async function disconnect(): Promise<void> {
  account.value = {
    address: null,
    balance: '0.00',
    chainId: props.config.chains?.[0]?.id ?? 1,
    chainSymbol: props.config.chains?.[0]?.nativeCurrency.symbol ?? 'ETH',
  };
  status.value = 'disconnected';
}

async function switchChain(chainId: number): Promise<void> {
  isSwitchingChain.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    const chain = props.config.chains?.find(c => c.id === chainId);
    if (chain) {
      account.value = {
        ...account.value,
        chainId,
        chainSymbol: chain.nativeCurrency.symbol,
      };
    }
  } finally {
    isSwitchingChain.value = false;
  }
}

const context = {
  config: props.config,
  connectors,
  account,
  status,
  connect,
  disconnect,
  switchChain,
  isSwitchingChain,
};

provide(ONCHAINUX_KEY, context);
</script>
