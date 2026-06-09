<template>
  <div v-if="isConnected" class="connected-features">
    <AccountBalance />
    <ChainInfo />
    <SignMessage />
    <SendTransaction />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCinacoin } from '@cinacoin/vue'
import AccountBalance from './AccountBalance.vue'
import ChainInfo from './ChainInfo.vue'
import SignMessage from './SignMessage.vue'
import SendTransaction from './SendTransaction.vue'

const { status } = useCinacoin()
const isConnected = computed(() => status.value === 'connected')
</script>

<style scoped>
.connected-features {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
</style>
