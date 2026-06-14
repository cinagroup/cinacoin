# 快速开始 — Vue

> 5 分钟从零到钱包连接。适用于 Vue 3（Composition API）。

## 概述

本指南帮助你在 Vue 3 应用中快速集成 Cinacoin SDK，实现：

- ✅ 钱包连接（MetaMask、Cinacoin、Coinbase 等）
- ✅ 响应式账户状态
- ✅ 消息签名与链切换
- ✅ 使用 Composition API 或 Options API

**预计完成时间：** 5 分钟

---

## 前置条件

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x / **pnpm** ≥ 8.x / **yarn** ≥ 1.22.x
- **Vue** ≥ 3.3.x（支持 Composition API）

---

## 第一步：安装

```bash
# 新建项目（如已有项目则跳过）
npm create vue@latest my-dapp-vue
cd my-dapp-vue

# 安装核心 SDK 和 Vue 适配器
npm install @cinacoin/core-sdk @cinacoin/vue

# 或使用 pnpm / yarn
# pnpm add @cinacoin/core-sdk @cinacoin/vue
# yarn add @cinacoin/core-sdk @cinacoin/vue
```

---

## 第二步：配置 CinacoinPlugin

在 Vue 应用入口安装 Cinacoin 插件：

```ts
// src/main.ts
import { createApp } from 'vue'
import { CinacoinPlugin } from '@cinacoin/vue'
import App from './App.vue'
import './assets/main.css'

const app = createApp(App)

app.use(CinacoinPlugin, {
  // 项目标识
  projectId: 'your-project-id',

  // 自建 Relay 服务器地址
  relayUrl: 'wss://relay.yourdomain.com/v1',

  // 支持的链
  chains: [
    {
      id: 1,
      name: 'Ethereum',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrl: 'https://rpc.yourdomain.com/eth',
    },
    {
      id: 137,
      name: 'Polygon',
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      rpcUrl: 'https://rpc.yourdomain.com/polygon',
    },
  ],

  // 应用元数据
  metadata: {
    name: 'My Vue dApp',
    description: 'A decentralized app built with Vue',
    url: 'https://mydapp.com',
    icons: ['https://mydapp.com/icon.png'],
  },
})

app.mount('#app')
```

---

## 第三步：添加连接按钮

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { ConnectButton } from '@cinacoin/vue'
</script>

<template>
  <div>
    <h1>🔢 My Vue dApp</h1>
    <ConnectButton />
  </div>
</template>
```

运行应用：

```bash
npm run dev
```

---

## 第四步：使用 Composables 管理状态

### 基本连接示例

```vue
<!-- src/components/Cinacoin.vue -->
<script setup lang="ts">
import { useCinacoin, useConnect } from '@cinacoin/vue'

const cinacoin = useCinacoin()
const { connect, connectors, status } = useConnect()
</script>

<template>
  <div v-if="!cinacoin.account.value">
    <h3>选择钱包</h3>
    <button
      v-for="connector in connectors"
      :key="connector.id"
      @click="connect({ connector })"
      :disabled="status === 'connecting'"
    >
      {{ connector.name }}
    </button>
  </div>

  <div v-else>
    <h3>✅ 已连接</h3>
    <p><strong>地址:</strong> <code>{{ cinacoin.account.value }}</code></p>
    <p><strong>链 ID:</strong> {{ cinacoin.chainId.value }}</p>
    <p><strong>状态:</strong> {{ cinacoin.status.value }}</p>
    <button @click="cinacoin.disconnect()">断开连接</button>
  </div>
</template>
```

### 签名消息

```vue
<!-- src/components/SignMessage.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useCinacoin, useSignMessage } from '@cinacoin/vue'

const cinacoin = useCinacoin()
const { signMessage, isPending, isSuccess, data } = useSignMessage()
const message = ref('Hello Cinacoin from Vue!')

const handleSign = async () => {
  await signMessage({ message: message.value })
}
</script>

<template>
  <div v-if="cinacoin.account.value">
    <input v-model="message" placeholder="Enter message to sign" />
    <button @click="handleSign" :disabled="isPending">
      {{ isPending ? 'Signing...' : 'Sign Message' }}
    </button>
    <div v-if="isSuccess">
      <p>✅ 签名成功</p>
      <code>{{ data }}</code>
    </div>
  </div>
</template>
```

### 切换链

```vue
<!-- src/components/SwitchChain.vue -->
<script setup lang="ts">
import { useCinacoin, useSwitchChain } from '@cinacoin/vue'

const cinacoin = useCinacoin()
const { chains, switchChain } = useSwitchChain()
</script>

<template>
  <div>
    <h3>切换链</h3>
    <button
      v-for="chain in chains"
      :key="chain.id"
      @click="switchChain({ chainId: chain.id })"
      :disabled="cinacoin.chainId.value === chain.id"
    >
      {{ chain.name }}
      <span v-if="cinacoin.chainId.value === chain.id">✅</span>
    </button>
  </div>
</template>
```

### 查询余额

```vue
<!-- src/components/ShowBalance.vue -->
<script setup lang="ts">
import { useCinacoin, useBalance } from '@cinacoin/vue'

const cinacoin = useCinacoin()
const { data: balance } = useBalance({
  address: cinacoin.account.value,
})
</script>

<template>
  <div v-if="balance">
    <p>余额: {{ balance.formatted }} {{ balance.symbol }}</p>
  </div>
</template>
```

---

## Nuxt 3 集成

```ts
// plugins/cinacoin.ts
import { CinacoinPlugin } from '@cinacoin/vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(CinacoinPlugin, {
    projectId: 'your-project-id',
    relayUrl: 'wss://relay.yourdomain.com/v1',
    chains: [{
      id: 1, name: 'Ethereum',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrl: 'https://rpc.yourdomain.com/eth',
    }],
  })
})
```

---

## 常见问题排查

### "useCinacoin() called outside of plugin"

- 确保 `CinacoinPlugin` 已在 `main.ts` 中正确安装
- 检查 `app.use()` 在 `app.mount()` 之前调用

### "Module not found: @cinacoin/vue"

- 确认已安装 `@cinacoin/vue`（不是 `@cinacoin/react`）
- 检查 `package.json` 中的依赖

### 响应式数据不更新

- 使用 `.value` 访问 composable 返回的 ref 对象
- `useCinacoin()` 返回的所有属性都是 Vue `ref`

---

## 下一步

- [Vue SDK API](/api/vue) — 完整 API 参考
- [Nuxt 模块](/api/nuxt) — Nuxt 集成指南
- [配置选项](/guide/configuration) — 完整配置参考
- [迁移指南](/guides/migration-from-walletconnect) — 从 @walletconnect/ 迁移
