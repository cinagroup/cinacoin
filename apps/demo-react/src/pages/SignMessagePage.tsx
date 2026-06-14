import React from 'react';

import { CodeExample } from '../components/CodeExample';
import { DemoSignMessage, DemoSignTypedData } from '../components/DemoSign';

const CODE = {
  react: `import { useWallet } from '@cinacoin/sdk-react'

function SignMessage() {
  const { signMessage, address } = useWallet()

  const handleSign = async () => {
    const message = 'Hello from Cinacoin!'
    const signature = await signMessage(message)
    
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
  }

  return (
    <div>
      <p>Address: {address}</p>
      <button onClick={handleSign}>Sign Message</button>
    </div>
  )
}`,
};

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
}
</script>

<template>
  <button @click="handleSign}>Sign Typed Data</button>
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
  }

  return <button onClick={handleSign}>Sign Typed Data</button>
}`,
};

export default function SignMessagePage() {
  return (
    <section className="max-w-5xl mx-auto w-full py-12 px-4 space-y-8">
      <div className="max-w-xl">
        <h1 className="cc-display-lg mb-3">Sign messages.</h1>
        <p className="cc-body-md text-[var(--cc-body)]">
          Sign plain text messages or EIP-712 typed data for authentication.
        </p>
      </div>

      <div className="space-y-6">
        <DemoSignMessage />
        <CodeExample title="signMessage()" code={CODE} highlightLines={[6, 7]} />
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
  );
}
