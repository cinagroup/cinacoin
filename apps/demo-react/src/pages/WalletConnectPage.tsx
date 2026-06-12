import React from 'react'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import { DemoWallet } from '../components/DemoWallet'
import { CodeExample } from '../components/CodeExample'

const CODE = {
  react: `import { useWallet } from '@cinacoin/sdk-react'

function ConnectButton() {
  const { connect, disconnect, address, isConnected } = useWallet()

  if (isConnected) {
    return (
      <div>
        <span>Connected: {address}</span>
        <button onClick={disconnect}>Disconnect</button>
      </div>
    )
  }

  return (
    <button onClick={() => connect('metamask')}>
      Connect Wallet
    </button>
  )
}`,
  vue: `<script setup>
import { useWallet } from '@cinacoin/sdk-vue'

const { connect, disconnect, address, isConnected } = useWallet()
</script>

<template>
  <div v-if="isConnected">
    <span>Connected: {{ address }}</span>
    <button @click="disconnect">Disconnect</button>
  </div>
  <button v-else @click="connect('metamask')">
    Connect Wallet
  </button>
</template>`,
  nextjs: `'use client'
import { useWallet } from '@cinacoin/sdk-react'

export default function ConnectButton() {
  const { connect, disconnect, address, isConnected } = useWallet()

  if (isConnected) {
    return (
      <div>
        <span>Connected: {address}</span>
        <button onClick={disconnect}>Disconnect</button>
      </div>
    )
  }

  return (
    <button onClick={() => connect('metamask')}>
      Connect Wallet
    </button>
  )
}`,
}

export default function WalletConnectPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--cc-canvas-soft)]">
      <SiteHeader />
      <main id="main-content" role="main" className="flex-1">
        <section className="max-w-5xl mx-auto w-full pt-12 pb-24 px-4 space-y-8">
          <div className="text-center">
            <h1 className="cc-display-lg mb-3">Wallet connect./h1>
            <p className="cc-body-md text-[var(--cc-muted)] max-w-lg mx-auto">
              Connect to 30+ wallets across 16 chains with a single API
            </p>
          </div>

          <DemoWallet />

          <CodeExample
            title="useWallet() Hook"
            code={CODE}
            highlightLines={[3, 7, 17]}
          />
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
