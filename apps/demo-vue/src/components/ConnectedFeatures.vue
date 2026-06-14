<template>
  <div v-if="isConnected" class="connected-features">
    <AccountBalance />
    <ChainInfo />
    <SwapWidget />
    <OnRampWidget />
    <SignMessage />
    <SendTransaction />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCinacoinWallet } from '@cinacoin/appkit-config/vue'
import AccountBalance from './AccountBalance.vue'
import ChainInfo from './ChainInfo.vue'
import SwapWidget from './SwapWidget.vue'
import OnRampWidget from './OnRampWidget.vue'
import SignMessage from './SignMessage.vue'
import SendTransaction from './SendTransaction.vue'

const { status } = useCinacoinWallet()
const isConnected = computed(() => status.value === 'connected')
</script>

<style scoped>
.connected-features {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
</style>
