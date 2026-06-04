'use client';

import React from 'react';
import { useCinaCoinContext } from '@cinacoin/react';

// Inline NFT card component since @cinacoin/nft-display may need peer deps
// This mirrors the NFT display functionality for the demo.

interface NftItem {
  id: string;
  name: string;
  image: string;
  collection: string;
  chainId: number;
}

// Mock NFTs for demo purposes when no API is configured
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

/** DemoNFTGallery — display the connected account's NFT collection. */
export function DemoNFTGallery(): JSX.Element {
  const { account, status } = useCinaCoinContext();

  if (status !== 'connected') {
    return (
      <section style={sectionStyle}>
        <h3 style={titleStyle}>
          <span style={iconStyle}>🖼️</span> NFT Gallery
        </h3>
        <p style={descStyle}>Connect a wallet to view your NFT collection.</p>
      </section>
    );
  }

  return (
    <section style={sectionStyle}>
      <h3 style={titleStyle}>
        <span style={iconStyle}>🖼️</span> NFT Gallery
      </h3>
      <p style={descStyle}>
        Browse your multi-chain NFT collection. Powered by{' '}
        <code style={codeStyle}>@cinacoin/nft-display</code>.
      </p>

      {/* NFT Grid */}
      <div style={gridStyle}>
        {MOCK_NFTS.map((nft) => (
          <div key={nft.id} style={cardStyle}>
            <div style={imageContainerStyle}>
              <img
                src={nft.image}
                alt={nft.name}
                style={imageStyle}
                loading="lazy"
              />
              <div style={chainBadgeStyle}>
                {nft.chainId === 11155111
                  ? 'Sepolia'
                  : nft.chainId === 80002
                  ? 'Amoy'
                  : 'Ethereum'}
              </div>
            </div>
            <div style={cardBodyStyle}>
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                {nft.name}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                {nft.collection}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '16px', fontSize: '12px', color: '#64748b' }}>
        Showing {MOCK_NFTS.length} demo NFTs across {new Set(MOCK_NFTS.map((n) => n.chainId)).size} chains
      </div>
    </section>
  );
}

const sectionStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  padding: '24px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  margin: '0 0 8px 0',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const iconStyle: React.CSSProperties = { fontSize: '20px' };

const descStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#94a3b8',
  margin: '0 0 20px 0',
};

const codeStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  padding: '2px 6px',
  borderRadius: '4px',
  fontSize: '12px',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: '16px',
};

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  overflow: 'hidden',
  transition: 'transform 0.15s ease, border-color 0.15s ease',
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
  padding: '3px 8px',
  borderRadius: '6px',
  backdropFilter: 'blur(8px)',
};

const cardBodyStyle: React.CSSProperties = {
  padding: '12px',
};
