import React from 'react'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import { DemoSignMessage, DemoSignTypedData } from '../components/DemoSign'
import { CodeExample } from '../components/CodeExample'

const CODE = {
  react: `import { useWallet } from '@cinacoin/sdk-react'

function SignMessage() {
  const { signMessage, address } = useWallet()

  const handleSign = async () => {
    const message = 'Hello from Cinacoin!'
    const signature = await signMessage(message)
    
    console.log('Signature:', signature)
    // Verify on backend: ethers.verifyMessage(message, signature)
  }

  return (
    <div>
      <p>Address: {address}</p>
      <button onClick={handleSign}>Sign Message</button>
    </div>
  )
}`,
  vue: `<script setup>
import { useWallet } from '@cinacoin/sdk-vue'

const { signMessage, address } = useWallet()

const handleSign = async () => {
  const message = 'Hello from Cinacoin!'
  const signature = await signMessage(message)
  console.log('Signature:', signature)
}
</script>

<template>
  <div>
    <p>Address: {{ address }}</p>
    <button @click="handleSign">Sign Message</button>
  </div>
</template>`,
  nextjs: `'use client'
import { useWallet } from '@cinacoin/sdk-react'

export default function SignMessage() {
  const { signMessage, address } = useWallet()

  const handleSign = async () => {
    const message = 'Hello from Cinacoin!'
    const signature = await signMessage(message)
    console.log('Signature:', signature)
  }

  return (
    <div>
      <p>Address: {address}</p>
      <button onClick={handleSign}>Sign Message</button>
    </div>
  )
}`,
}

const TYPED_DATA_CODE = {
  react: `import { useWallet } from '@cinacoin/sdk-react'

const typedData = {
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
    ],
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallet', type: 'address' },
    ],
  },
  primaryType: 'Person',
  domain: {
    name: 'Cinacoin Demo',
    version: '1',
    chainId: 1,
  },
  message: {
    name: 'Alice',
    wallet: '0x...',
  },
}

function SignTypedData() {
  const { signTypedData } = useWallet()

  const handleSign = async () => {
    const signature = await signTypedData(typedData)
    console.log('EIP-712 Signature:', signature)
  }

  return <button onClick={handleSign}>Sign Typed Data</button>
}`,
  vue: `<script setup>
import { useWallet } from '@cinacoin/sdk-vue'

const { signTypedData } = useWallet()

const typedData = {
  // ... same structure as React example
}

const handleSign = async () => {
  const signature = await signTypedData(typedData)
  console.log('EIP-712 Signature:', signature)
}
</script>

<template>
  <button @click="handleSign">Sign Typed Data</button>
</template>`,
  nextjs: `'use client'
import { useWallet } from '@cinacoin/sdk-react'

export default function SignTypedData() {
  const { signTypedData } = useWallet()

  const typedData = {
    // ... same structure as React example
  }

  const handleSign = async () => {
    const signature = await signTypedData(typedData)
    console.log('EIP-712 Signature:', signature)
  }

  return <button onClick={handleSign}>Sign Typed Data</button>
}`,
}

export default function SignMessagePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--cc-canvas-soft)]">
      <SiteHeader />
      <main id="main-content" role="main" className="flex-1">
        <section className="max-w-5xl mx-auto w-full pt-12 pb-24 px-4 space-y-8">
          <div className="text-center">
            <h1 className="cc-display-lg mb-3">Sign Messages</h1>
            <p className="cc-body-md text-[var(--cc-muted)] max-w-lg mx-auto">
              Sign plain text messages or EIP-712 typed data for authentication
            </p>
          </div>

          <div className="space-y-6">
            <DemoSignMessage />
            <CodeExample
              title="signMessage()"
              code={CODE}
              highlightLines={[6, 7]}
            />
          </div>

          <div className="space-y-6">
            <DemoSignTypedData />
            <CodeExample
              title="signTypedData() — EIP-712"
              code={TYPED_DATA_CODE}
              highlightLines={[29, 30]}
            />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
