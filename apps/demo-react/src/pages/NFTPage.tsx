/**
 * NFTPage — NFT 收藏展示
 *
 * 演示: 网格展示 NFT，详情弹窗
 */

import { useState } from 'react';
import { Image } from 'lucide-react';
import { CodeExample } from '../components/CodeExample';

// Mock NFT data
const MOCK_NFTS = [
  { id: 1, name: 'Cinacoin Genesis #001', collection: 'Cinacoin Genesis', image: 'ART', traits: [{ key: 'Rarity', value: 'Legendary' }, { key: 'Chain', value: 'Ethereum' }] },
  { id: 2, name: 'Web3 Explorer #042', collection: 'Web3 Pioneers', image: 'WEB', traits: [{ key: 'Level', value: 'Gold' }, { key: 'Chain', value: 'Polygon' }] },
  { id: 3, name: 'DeFi Master #108', collection: 'DeFi Legends', image: 'DIA', traits: [{ key: 'Power', value: '9001' }, { key: 'Chain', value: 'Ethereum' }] },
  { id: 4, name: 'Meta Avatar #555', collection: 'MetaVerse', image: 'AVT', traits: [{ key: 'Style', value: 'Cyberpunk' }, { key: 'Chain', value: 'Solana' }] },
  { id: 5, name: 'Crypto Cat #777', collection: 'CryptoKitties', image: 'CAT', traits: [{ key: 'Gen', value: '12' }, { key: 'Chain', value: 'Ethereum' }] },
  { id: 6, name: 'Pixel Land #003', collection: 'PixelWorld', image: 'LND', traits: [{ key: 'Size', value: 'Large' }, { key: 'Chain', value: 'Polygon' }] },
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
    <div className="grid grid-cols-2 gap-6 p-6">
      {/* Left: NFT Grid */}
      <div>
        <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">NFT GALLERY</p>
        <h2 className="text-[var(--cc-text-xl)] font-semibold mb-2">NFT 收藏</h2>
        <p className="text-[var(--cc-demo-text-muted)] mb-6">展示多链 NFT 收藏，点击查看详情。</p>

        <div className="grid grid-cols-3 gap-4">
          {MOCK_NFTS.length === 0 ? (
            <div className="col-span-full py-12 px-4 text-center">
              <Image className="w-12 h-12 mx-auto mb-4 text-[var(--cc-muted)]" />
              <h3 className="text-[var(--cc-text-lg)] font-semibold mb-2">No NFTs yet</h3>
              <p className="text-[var(--cc-text-sm)] text-[var(--cc-demo-text-muted)]">Your NFT collection will appear here once you mint or receive NFTs.</p>
            </div>
          ) : MOCK_NFTS.map((nft) => (
            <div
              key={nft.id}
              onClick={() => setSelectedNFT(nft)}
              className={`bg-[var(--cc-demo-surface-dark)] rounded-xl p-4 cursor-pointer transition-[border] duration-200 border-2 ${
                selectedNFT?.id === nft.id ? 'border-[#6366f1]' : 'border-transparent'
              }`}
            >
              <div className="text-5xl text-center mb-3 bg-[var(--cc-demo-surface-darker)] rounded-lg p-5">
                {nft.image}
              </div>
              <h3 className="text-[var(--cc-text-sm)] font-semibold mb-1">{nft.name}</h3>
              <p className="text-xs text-[var(--cc-demo-text-muted)]">{nft.collection}</p>
            </div>
          ))}
        </div>

        {/* Detail Modal */}
        {selectedNFT && (
          <div
            onClick={() => setSelectedNFT(null)}
            className="fixed inset-0 bg-[#171717]/70 flex items-center justify-center z-[1000]"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--cc-demo-surface-dark)] rounded-2xl p-8 max-w-[400px] w-[90%]"
            >
              <div className="text-8xl text-center mb-4">{selectedNFT.image}</div>
              <h3 className="text-[var(--cc-text-lg)] font-semibold mb-1">{selectedNFT.name}</h3>
              <p className="text-[var(--cc-demo-text-muted)] mb-4">{selectedNFT.collection}</p>

              <div className="bg-[var(--cc-demo-surface-darker)] rounded-lg p-4">
                <h4 className="text-[var(--cc-text-xs)] text-[var(--cc-demo-text-light)] mb-2">属性</h4>
                {selectedNFT.traits.map((trait) => (
                  <div key={trait.key} className="flex justify-between mb-2">
                    <span className="text-[var(--cc-demo-text-muted)] text-[var(--cc-text-xs)]">{trait.key}</span>
                    <span className="text-[var(--cc-on-primary,#fff)] text-[var(--cc-text-xs)] font-semibold">{trait.value}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setSelectedNFT(null)}
                className="w-full mt-4 py-3 px-5 rounded-lg border-none bg-[var(--cc-demo-accent)] text-[var(--cc-on-primary,#fff)] font-semibold cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right: Code Example */}
      <div>
        <CodeExample code={{ react: CODE_EXAMPLE }} title="useCoinBalance (NFT)" />
      </div>
    </div>
  );
}
