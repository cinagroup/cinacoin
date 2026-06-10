import React from 'react'
import { DemoWallet } from '../components/DemoWallet'
import { DemoSignMessage, DemoSignTypedData } from '../components/DemoSign'
import { DemoTransfer } from '../components/DemoTransfer'
import { DemoNFT } from '../components/DemoNFT'
import { DemoBridge } from '../components/DemoBridge'
import { DemoDeFi } from '../components/DemoDeFi'

export function WalletConnectPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="cc-display-lg mb-2">钱包连接演示</h2>
        <p className="cc-body text-[var(--cc-body)]">
          测试所有钱包适配器的连接功能
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
        <h2 className="cc-display-lg mb-2">签名演示</h2>
        <p className="cc-body text-[var(--cc-body)]">
          测试普通消息和 EIP-712 类型化数据签名
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
        <h2 className="cc-display-lg mb-2">转账演示</h2>
        <p className="cc-body text-[var(--cc-body)]">
          模拟以太坊转账操作（无需真实 Gas）
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
        <h2 className="cc-display-lg mb-2">NFT 展示</h2>
        <p className="cc-body text-[var(--cc-body)]">
          浏览您的 NFT 资产
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
        <h2 className="cc-display-lg mb-2">跨链桥接</h2>
        <p className="cc-body text-[var(--cc-body)]">
          模拟跨链资金转移
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
        <h2 className="cc-display-lg mb-2">DeFi 交互</h2>
        <p className="cc-body text-[var(--cc-body)]">
          浏览流动性池和收益数据
        </p>
      </div>
      <DemoDeFi />
    </div>
  )
}
