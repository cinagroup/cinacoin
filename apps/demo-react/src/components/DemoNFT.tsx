import React from 'react'
import { useDemo } from '../hooks/useDemo'
import { AddressDisplay } from './AddressDisplay'

export function DemoNFT() {
  const { isConnected, address, connect } = useDemo()

  // Mock NFT data
  const mockNFTs = [
    {
      id: '001',
      name: 'Cinacoin Genesis',
      collection: 'Cinacoin Collection',
      image: 'https://placehold.co/400x400/1a1a2e/58a6ff?text=NFT+001',
      tokenAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      tokenId: '1',
    },
    {
      id: '002',
      name: 'Cinacoin Explorer',
      collection: 'Cinacoin Collection',
      image: 'https://placehold.co/400x400/1a1a2e/3fb950?text=NFT+002',
      tokenAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      tokenId: '2',
    },
    {
      id: '003',
      name: 'Cinacoin Developer',
      collection: 'Cinacoin Collection',
      image: 'https://placehold.co/400x400/1a1a2e/f2994a?text=NFT+003',
      tokenAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      tokenId: '3',
    },
  ]

  return (
    <div className="cc-card p-6">
      <h3 className="cc-subtitle mb-6">NFT 展示</h3>

      {!isConnected ? (
        <div className="text-center py-8">
          <p className="cc-body text-[var(--cc-body)] mb-4">
            连接钱包后可查看您的 NFT 资产。
          </p>
          <button onClick={connect} className="cc-btn-primary">
            连接钱包
          </button>
        </div>
      ) : (
        <>
          <div className="mb-6 p-4 bg-[var(--cc-canvas-soft)] rounded-lg">
            <p className="cc-body-xs text-[var(--cc-body)] mb-1">您的地址</p>
            <AddressDisplay address={address!} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockNFTs.map((nft) => (
              <div key={nft.id} className="cc-card p-4 hover:shadow-lg transition-shadow">
                <div className="aspect-square mb-4 rounded-lg overflow-hidden bg-[var(--cc-canvas-soft)]">
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h4 className="cc-title-sm mb-1">{nft.name}</h4>
                <p className="cc-body-xs text-[var(--cc-body)] mb-2">{nft.collection}</p>
                <div className="flex justify-between text-[12px]">
                  <div>
                    <p className="text-[var(--cc-body)]">Token ID</p>
                    <p className="cc-mono">{nft.tokenId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[var(--cc-body)]">Contract</p>
                    <p className="cc-mono truncate max-w-[120px]">
                      {nft.tokenAddress}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-[var(--cc-warning)/10] rounded-lg text-center">
            <p className="cc-body-sm text-[var(--cc-body)]">
              ⚠️ 此 NFT 为演示数据，实际 NFT 数据需连接 RPC 获取
            </p>
          </div>
        </>
      )}
    </div>
  )
}
