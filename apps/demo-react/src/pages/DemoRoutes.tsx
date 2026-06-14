import React from 'react'
import { DemoWallet } from '../components/DemoWallet'
import { DemoSignMessage, DemoSignTypedData } from '../components/DemoSign'
import { DemoTransfer } from '../components/DemoTransfer'
import { DemoNFT } from '../components/DemoNFT'
import { DemoBridge } from '../components/DemoBridge'
import { DemoDeFi } from '../components/DemoDeFi'

export function CinacoinPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="cc-display-lg mb-2">Wallet connect.</h2>
        <p className="cc-body text-[var(--cc-body)]">
          Test wallet adapter connections
        </p>
      </div>
      <DemoWallet />
    </div>
  )
}

export function SignMessagePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="cc-display-lg mb-2">Sign demo.</h2>
        <p className="cc-body text-[var(--cc-body)]">
          Test message and EIP-712 typed data signing
        </p>
      </div>
      <DemoSignMessage />
      <DemoSignTypedData />
    </div>
  )
}

export function TransferPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="cc-display-lg mb-2">Transfer.</h2>
        <p className="cc-body text-[var(--cc-body)]">
          Simulate Ethereum transfers (no real gas)
        </p>
      </div>
      <DemoTransfer />
    </div>
  )
}

export function NFTPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="cc-display-lg mb-2">NFT gallery.</h2>
        <p className="cc-body text-[var(--cc-body)]">
          Browse your NFT collection
        </p>
      </div>
      <DemoNFT />
    </div>
  )
}

export function BridgePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="cc-display-lg mb-2">Bridge.</h2>
        <p className="cc-body text-[var(--cc-body)]">
          Simulate cross-chain transfers
        </p>
      </div>
      <DemoBridge />
    </div>
  )
}

export function DeFiPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="cc-display-lg mb-2">DeFi.</h2>
        <p className="cc-body text-[var(--cc-body)]">
          Explore liquidity pools and yield data
        </p>
      </div>
      <DemoDeFi />
    </div>
  )
}
