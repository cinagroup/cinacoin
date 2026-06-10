'use client';

import React from 'react';
import { useCinacoinContext } from '@cinacoin/react';

interface NftItem {
  id: string;
  name: string;
  image: string;
  collection: string;
  chainId: number;
}

const MOCK_NFTS: NftItem[] = [
  {
    id: '1',
    name: 'Cinacoin Genesis #001',
    image: 'https://picsum.photos/seed/nft1/300/300',
    collection: 'Cinacoin Genesis',
    chainId: 11155111,
  },
  {
    id: '2',
    name: 'OnChainUX Pioneer',
    image: 'https://picsum.photos/seed/nft2/300/300',
    collection: 'Builder Series',
    chainId: 80002,
  },
  {
    id: '3',
    name: 'Smart Account Early Adopter',
    image: 'https://picsum.photos/seed/nft3/300/300',
    collection: 'Milestone NFTs',
    chainId: 1,
  },
  {
    id: '4',
    name: 'SDK Contributor',
    image: 'https://picsum.photos/seed/nft4/300/300',
    collection: 'Dev Rewards',
    chainId: 11155111,
  },
];

function getChainName(chainId: number): string {
  if (chainId === 11155111) return 'Sepolia';
  if (chainId === 80002) return 'Amoy';
  if (chainId === 1) return 'Ethereum';
  return `Chain ${chainId}`;
}

/** DemoNFTGallery — display the connected account's NFT collection. */
export function DemoNFTGallery(): JSX.Element {
  const { status } = useCinacoinContext();

  if (status !== 'connected') {
    return (
      <section className="cc-card cc-fade-in" aria-labelledby="nft-heading">
        <h3 id="nft-heading" className="cc-section-title">
          <span style={{ fontSize: '20px' }} aria-hidden="true">🖼️</span> NFT Gallery
        </h3>
        <p className="cc-section-desc">Connect a wallet to view your NFT collection.</p>
      </section>
    );
  }

  const chainCount = new Set(MOCK_NFTS.map((n) => n.chainId)).size;

  return (
    <section className="cc-card cc-fade-in" aria-labelledby="nft-heading">
      <h3 id="nft-heading" className="cc-section-title">
        <span style={{ fontSize: '20px' }} aria-hidden="true">🖼️</span> NFT Gallery
      </h3>
      <p className="cc-section-desc">
        Browse your multi-chain NFT collection. Powered by{' '}
        <code className="cc-code">@cinacoin/nft-display</code>.
      </p>

      {/* NFT Grid */}
      <div style={gridStyle}>
        {MOCK_NFTS.map((nft) => (
          <article key={nft.id} className="cc-card cc-hover-card" style={cardStyle} tabIndex={0} role="img" aria-label={`${nft.name} from ${nft.collection} on ${getChainName(nft.chainId)}`}>
            <div style={imageContainerStyle}>
              <img
                src={nft.image}
                alt={nft.name}
                style={imageStyle}
                loading="lazy"
              />
              <span className="cc-badge" style={chainBadgeStyle} aria-label={`Chain: ${getChainName(nft.chainId)}`}>
                {getChainName(nft.chainId)}
              </span>
            </div>
            <div style={cardBodyStyle}>
              <div style={{ fontWeight: 'var(--cc-weight-semibold)', fontSize: 'var(--cc-text-sm)', marginBottom: 'var(--cc-space-xxs)', color: 'var(--cc-ink)' }}>
                {nft.name}
              </div>
              <div style={{ fontSize: 'var(--cc-text-xs)', color: 'var(--cc-body)' }}>
                {nft.collection}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div style={{ marginTop: 'var(--cc-space-md)', fontSize: 'var(--cc-text-xs)', color: 'var(--cc-muted)' }}>
        Showing {MOCK_NFTS.length} demo NFTs across {chainCount} chains
      </div>
    </section>
  );
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: 'var(--cc-space-md)',
};

const cardStyle: React.CSSProperties = {
  background: 'var(--cc-canvas-soft-2)',
  border: '1px solid var(--cc-hairline)',
  borderRadius: 'var(--cc-radius-lg)',
  overflow: 'hidden',
  transition: 'transform 0.15s ease, border-color 0.15s ease',
  cursor: 'default',
};

const imageContainerStyle: React.CSSProperties = {
  position: 'relative',
  aspectRatio: '1',
  background: '#111',
};

const imageStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const chainBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: '8px',
  right: '8px',
  background: 'rgba(0,0,0,0.7)',
  color: '#e0e0e0',
  fontSize: '10px',
  fontWeight: 600,
  padding: '4px 8px',
  borderRadius: '6px',
  backdropFilter: 'blur(8px)',
};

const cardBodyStyle: React.CSSProperties = {
  padding: 'var(--cc-space-sm)',
};
