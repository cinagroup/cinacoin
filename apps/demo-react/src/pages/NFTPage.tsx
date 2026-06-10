/**
 * NFTPage — NFT 收藏展示
 *
 * 演示: 网格展示 NFT，详情弹窗
 */

import { useState } from 'react';
import { CodeExample } from '../components/CodeExample';

// Mock NFT data
const MOCK_NFTS = [
  { id: 1, name: 'Cinacoin Genesis #001', collection: 'Cinacoin Genesis', image: '🎨', traits: [{ key: 'Rarity', value: 'Legendary' }, { key: 'Chain', value: 'Ethereum' }] },
  { id: 2, name: 'Web3 Explorer #042', collection: 'Web3 Pioneers', image: '🌐', traits: [{ key: 'Level', value: 'Gold' }, { key: 'Chain', value: 'Polygon' }] },
  { id: 3, name: 'DeFi Master #108', collection: 'DeFi Legends', image: '💎', traits: [{ key: 'Power', value: '9001' }, { key: 'Chain', value: 'Ethereum' }] },
  { id: 4, name: 'Meta Avatar #555', collection: 'MetaVerse', image: '👤', traits: [{ key: 'Style', value: 'Cyberpunk' }, { key: 'Chain', value: 'Solana' }] },
  { id: 5, name: 'Crypto Cat #777', collection: 'CryptoKitties', image: '🐱', traits: [{ key: 'Gen', value: '12' }, { key: 'Chain', value: 'Ethereum' }] },
  { id: 6, name: 'Pixel Land #003', collection: 'PixelWorld', image: '🏰', traits: [{ key: 'Size', value: 'Large' }, { key: 'Chain', value: 'Polygon' }] },
];

const CODE_EXAMPLE = `import { useCoinBalance, useCoinAccount } from '@cinacoin/core-sdk';

function NFTGallery() {
  const { account } = useCoinAccount();
  const { nfts, isLoading } = useCoinBalance({
    type: 'nft',
    chainId: 'eip155:1',
    address: account?.address,
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="nft-grid">
      {nfts.map((nft) => (
        <div key={nft.tokenId} className="nft-card">
          <img src={nft.image} alt={nft.name} />
          <h3>{nft.name}</h3>
          <p>{nft.collection}</p>
          <span>Chain: {nft.chainId}</span>
        </div>
      ))}
    </div>
  );
}`;

export function NFTPage() {
  const [selectedNFT, setSelectedNFT] = useState<typeof MOCK_NFTS[0] | null>(null);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: 24 }}>
      {/* Left: NFT Grid */}
      <div>
        <h2 style={{ fontSize: "var(--cc-text-xl)", fontWeight: "var(--cc-weight-bold)", marginBottom: 8 }}>NFT 收藏</h2>
        <p style={{ color: '#888', marginBottom: 24 }}>展示多链 NFT 收藏，点击查看详情。</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {MOCK_NFTS.map((nft) => (
            <div
              key={nft.id}
              onClick={() => setSelectedNFT(nft)}
              style={{
                background: '#1a1a2e',
                borderRadius: 12,
                padding: 16,
                cursor: 'pointer',
                border: selectedNFT?.id === nft.id ? '2px solid #6366f1' : '2px solid transparent',
                transition: 'border 0.2s',
              }}
            >
              <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 12, background: '#0d0d1a', borderRadius: 8, padding: 20 }}>
                {nft.image}
              </div>
              <h3 style={{ fontSize: "var(--cc-text-sm)", fontWeight: "var(--cc-weight-semibold)", marginBottom: 4 }}>{nft.name}</h3>
              <p style={{ fontSize: 12, color: '#888' }}>{nft.collection}</p>
            </div>
          ))}
        </div>

        {/* Detail Modal */}
        {selectedNFT && (
          <div
            onClick={() => setSelectedNFT(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#1a1a2e',
                borderRadius: 16,
                padding: 32,
                maxWidth: 400,
                width: '90%',
              }}
            >
              <div style={{ fontSize: 80, textAlign: 'center', marginBottom: 16 }}>{selectedNFT.image}</div>
              <h3 style={{ fontSize: "var(--cc-text-lg)", fontWeight: "var(--cc-weight-bold)", marginBottom: 4 }}>{selectedNFT.name}</h3>
              <p style={{ color: '#888', marginBottom: 16 }}>{selectedNFT.collection}</p>

              <div style={{ background: '#0d0d1a', borderRadius: 8, padding: 16 }}>
                <h4 style={{ fontSize: "var(--cc-text-xs)", color: '#aaa', marginBottom: 8 }}>属性</h4>
                {selectedNFT.traits.map((trait) => (
                  <div key={trait.key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: '#888', fontSize: "var(--cc-text-xs)" }}>{trait.key}</span>
                    <span style={{ color: '#fff', fontSize: "var(--cc-text-xs)", fontWeight: "var(--cc-weight-semibold)" }}>{trait.value}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setSelectedNFT(null)}
                style={{
                  width: '100%',
                  marginTop: 16,
                  padding: '12px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#6366f1',
                  color: '#fff',
                  fontWeight: "var(--cc-weight-semibold)",
                  cursor: 'pointer',
                }}
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right: Code Example */}
      <div>
        <CodeExample code={CODE_EXAMPLE} language="typescript" title="useCoinBalance (NFT)" />
      </div>
    </div>
  );
}
