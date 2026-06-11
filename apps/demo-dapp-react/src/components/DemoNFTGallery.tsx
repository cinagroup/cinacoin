'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { useCinacoinContext } from '@cinacoin/react';
import { Images } from 'lucide-react';

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
    name: 'CinaCoin Genesis #001',
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

const NFTCard = React.memo(function NFTCard({ nft }: { nft: NftItem }) {
  return (
    <article className="cc-card cc-hover-card" style={cardStyle} tabIndex={0} role="img" aria-label={`${nft.name} from ${nft.collection} on ${getChainName(nft.chainId)}`}>
      <div style={imageContainerStyle}>
        <Image
          src={nft.image}
          alt={nft.name}
          fill
          style={{ objectFit: 'cover' }}
          loading="lazy"
          unoptimized
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
  );
});

/** DemoNFTGallery — display the connected account's NFT collection. */
export function DemoNFTGallery(): JSX.Element {
  const { status } = useCinacoinContext();

  const chainCount = useMemo(() => new Set(MOCK_NFTS.map((n) => n.chainId)).size, []);

  if (status !== 'connected') {
    return (
      <section className="cc-card cc-fade-in" aria-labelledby="nft-heading">
        <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">COLLECTION</p>
        <h3 id="nft-heading" className="cc-section-title">
          <Images className="w-5 h-5" /> NFT Gallery
        </h3>
        <p className="cc-section-desc">Connect a wallet to view your NFT collection.</p>
      </section>
    );
  }

  return (
    <section className="cc-card cc-fade-in" aria-labelledby="nft-heading">
      <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">COLLECTION</p>
      <h3 id="nft-heading" className="cc-section-title">
        <Images className="w-5 h-5" /> NFT Gallery
      </h3>
      <p className="cc-section-desc">
        Browse your multi-chain NFT collection. Powered by{' '}
        <code className="cc-code">@cinacoin/nft-display</code>.
      </p>

      {/* NFT Grid */}
      <div style={gridStyle}>
        {MOCK_NFTS.map((nft) => (
          <NFTCard key={nft.id} nft={nft} />
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
  background: 'var(--cc-image-placeholder)',
};

const chainBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: '8px',
  right: '8px',
  background: 'var(--cc-overlay-dark)',
  color: 'var(--cc-overlay-text)',
  fontSize: 'var(--cc-text-xs)',
  fontWeight: "var(--cc-weight-semibold)",
  padding: '4px 8px',
  borderRadius: '6px',
  backdropFilter: 'blur(8px)',
};

const cardBodyStyle: React.CSSProperties = {
  padding: 'var(--cc-space-sm)',
};
