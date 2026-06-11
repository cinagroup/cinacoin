/**
 * NFTPage — NFT collection display
 *
 * Grid display of NFTs with detail modal
 */

import { useState } from 'react';
import { Image } from 'lucide-react';
import { CodeExample } from '../components/CodeExample';

// Mock NFT data
const MOCK_NFTS = [
  { id: 1, name: 'CinaCoin Genesis #001', collection: 'CinaCoin Genesis', image: 'ART', traits: [{ key: 'Rarity', value: 'Legendary' }, { key: 'Chain', value: 'Ethereum' }] },
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
    <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: NFT Grid */}
      <div>
        <p className="cc-caption-mono text-[var(--cc-muted)] mb-2">NFT GALLERY</p>
        <h2 className="cc-display-lg mb-2">NFT collection.</h2>
        <p className="cc-body-md text-[var(--cc-muted)] mb-6">Browse multi-chain NFT collections. Click to view details.</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {MOCK_NFTS.length === 0 ? (
            <div className="col-span-full py-12 px-4 text-center cc-card">
              <Image className="w-12 h-12 mx-auto mb-4 text-[var(--cc-muted)]" />
              <h3 className="cc-display-sm mb-2">No NFTs yet.</h3>
              <p className="cc-body-sm text-[var(--cc-muted)]">Your NFT collection will appear here once you mint or receive NFTs.</p>
            </div>
          ) : MOCK_NFTS.map((nft) => (
            <button
              key={nft.id}
              onClick={() => setSelectedNFT(nft)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedNFT(nft); } }}
              className={`cc-card !p-4 text-left transition-all focus-ring ${
                selectedNFT?.id === nft.id ? 'border-[var(--cc-link)] ring-2 ring-[var(--cc-link)]/10' : ''
              }`}
              aria-label={`View ${nft.name} details`}
            >
              <div className="text-4xl text-center mb-3 bg-[var(--cc-canvas-soft-2)] rounded-lg p-4 font-[var(--font-mono)] text-[var(--cc-muted)]">
                {nft.image}
              </div>
              <h3 className="text-body-sm font-semibold text-[var(--cc-ink)] mb-1 truncate">{nft.name}</h3>
              <p className="text-caption text-[var(--cc-muted)]">{nft.collection}</p>
            </button>
          ))}
        </div>

        {/* Detail Modal */}
        {selectedNFT && (
          <div
            onClick={() => setSelectedNFT(null)}
            className="fixed inset-0 bg-[var(--cc-ink)]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedNFT.name} details`}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="cc-card-lg max-w-[400px] w-full"
            >
              <div className="text-7xl text-center mb-4 bg-[var(--cc-canvas-soft-2)] rounded-lg p-6 font-[var(--font-mono)] text-[var(--cc-muted)]">{selectedNFT.image}</div>
              <h3 className="cc-display-sm mb-1">{selectedNFT.name}</h3>
              <p className="cc-body-sm text-[var(--cc-muted)] mb-4">{selectedNFT.collection}</p>

              <div className="bg-[var(--cc-canvas-soft-2)] rounded-lg p-4 border border-[var(--cc-hairline)]">
                <h4 className="cc-caption-mono text-[var(--cc-muted)] mb-2">Traits</h4>
                {selectedNFT.traits.map((trait) => (
                  <div key={trait.key} className="flex justify-between mb-2 last:mb-0">
                    <span className="text-body-sm text-[var(--cc-muted)]">{trait.key}</span>
                    <span className="text-body-sm text-[var(--cc-ink)] font-semibold">{trait.value}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setSelectedNFT(null)}
                className="cc-btn-secondary w-full mt-4"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right: Code Example */}
      <div className="lg:pt-16">
        <CodeExample code={{ react: CODE_EXAMPLE }} title="useCoinBalance (NFT)" />
      </div>
    </div>
  );
}
