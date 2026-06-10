/**
 * @cinacoin/nft-display — React Components
 *
 * NFT display components: NftCard, NftGrid, NftDetail.
 * Works with any framework using React 18+.
 *
 * @example
 * ```tsx
 * import { NftCard, NftGrid, NftDetail } from '@cinacoin/nft-display/components';
 *
 * <NftCard nft={nftMetadata} />
 * <NftGrid nfts={nfts} />
 * <NftDetail nft={nftMetadata} />
 * ```
 */

import React from "react";
import type { NftMetadata, SupportedChainId } from "./types.js";
import { CHAIN_INFO } from "./types.js";

// ============================================================
// Shared Styles
// ============================================================

const CARD_MAX_WIDTH = "300px";
const GRID_TEMPLATE_COLUMNS = "repeat(auto-fill, minmax(280px, 1fr))";

const styles = {
  card: {
    borderRadius: "12px",
    overflow: "hidden",
    background: "#1a1a2e",
    border: "1px solid rgba(255,255,255,0.08)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    cursor: "pointer",
    width: "100%",
    maxWidth: CARD_MAX_WIDTH,
  } as React.CSSProperties,
  image: {
    width: "100%",
    aspectRatio: "1",
    objectFit: "cover" as const,
    display: "block",
    background: "#0f0f23",
  } as React.CSSProperties,
  content: {
    padding: "12px",
  } as React.CSSProperties,
  title: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#e2e8f0",
    margin: "0 0 4px 0",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  } as React.CSSProperties,
  subtitle: {
    fontSize: "12px",
    color: "#94a3b8",
    margin: "0 0 8px 0",
  } as React.CSSProperties,
  badge: {
    display: "inline-block",
    padding: "0px 8px",
    borderRadius: "9999px",
    fontSize: "10px",
    fontWeight: 600,
    background: "rgba(99,102,241,0.15)",
    color: "#818cf8",
    marginRight: "4px",
  } as React.CSSProperties,
  grid: {
    display: "grid",
    gridTemplateColumns: GRID_TEMPLATE_COLUMNS,
    gap: "16px",
    width: "100%",
  } as React.CSSProperties,
};

// ============================================================
// NftCard
// ============================================================

export interface NftCardProps {
  /** NFT metadata to display. */
  nft: NftMetadata;
  /** Click handler. */
  onClick?: (nft: NftMetadata) => void;
  /** Custom width. */
  width?: string;
  /** Show collection name. */
  showCollection?: boolean;
  /** Show token type badge. */
  showTokenType?: boolean;
  /** Image size: 'square' | 'wide' */
  imageSize?: "square" | "wide";
  /** Placeholder text when no image. */
  placeholderText?: string;
}

/**
 * NFT Card component — compact display for an individual NFT.
 */
export function NftCard({
  nft,
  onClick,
  width,
  showCollection = true,
  showTokenType = true,
  imageSize = "square",
  placeholderText = "No Image",
}: NftCardProps) {
  const chainInfo = CHAIN_INFO[nft.chainId as SupportedChainId];

  const handleClick = () => onClick?.(nft);

  return (
    <div
      style={{ ...styles.card, width: width || CARD_MAX_WIDTH }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
      aria-label={`NFT: ${nft.name || `Token #${nft.tokenId}`}`}
    >
      {/* Image */}
      <div style={{
        ...styles.image,
        aspectRatio: imageSize === "wide" ? "16/9" : "1",
      }}>
        {nft.imageUrl ? (
          <img
            src={nft.imageUrl}
            alt={nft.name || `NFT #${nft.tokenId}`}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            loading="lazy"
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            {placeholderText}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={styles.content}>
        <p style={styles.title} title={nft.name || nft.tokenId}>
          {nft.name || `#${nft.tokenId}`}
        </p>

        {showCollection && nft.contractName && (
          <p style={styles.subtitle}>{nft.contractName}</p>
        )}

        {/* Badges */}
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {showTokenType && (
            <span style={styles.badge}>{nft.tokenType}</span>
          )}
          {chainInfo && (
            <span style={styles.badge}>{chainInfo.shortName}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// NftGrid
// ============================================================

export interface NftGridProps {
  /** Array of NFT metadata to display. */
  nfts: NftMetadata[];
  /** Click handler for individual cards. */
  onNftClick?: (nft: NftMetadata) => void;
  /** Columns configuration. */
  columns?: number;
  /** Loading state. */
  isLoading?: boolean;
  /** Empty state message. */
  emptyMessage?: string;
}

/**
 * NFT Grid component — responsive grid of NFT cards.
 */
export function NftGrid({
  nfts,
  onNftClick,
  columns,
  isLoading = false,
  emptyMessage = "No NFTs found",
}: NftGridProps) {
  const gridStyle: React.CSSProperties = {
    ...styles.grid,
    gridTemplateColumns: columns
      ? `repeat(${columns}, 1fr)`
      : GRID_TEMPLATE_COLUMNS,
  };

  if (isLoading) {
    return (
      <div style={gridStyle}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              ...styles.card,
              height: "350px",
              background: "linear-gradient(90deg, #1a1a2e 25%, #2a2a4e 50%, #1a1a2e 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
            }}
          />
        ))}
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "40px",
          color: "#64748b",
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={gridStyle}>
      {nfts.map((nft) => (
        <NftCard
          key={`${nft.contractAddress}-${nft.tokenId}`}
          nft={nft}
          onClick={onNftClick}
        />
      ))}
    </div>
  );
}

// ============================================================
// NftDetail
// ============================================================

export interface NftDetailProps {
  /** NFT metadata to display. */
  nft: NftMetadata;
  /** Open in explorer handler. */
  onOpenExplorer?: (nft: NftMetadata) => void;
  /** Show attributes section. */
  showAttributes?: boolean;
  /** Max attributes to show. */
  maxAttributes?: number;
}

/**
 * NFT Detail component — full view of a single NFT.
 */
export function NftDetail({
  nft,
  onOpenExplorer,
  showAttributes = true,
  maxAttributes = 12,
}: NftDetailProps) {
  const chainInfo = CHAIN_INFO[nft.chainId as SupportedChainId];

  const explorerUrl = chainInfo
    ? `${chainInfo.explorerUrl}/token/${nft.contractAddress}?a=${nft.tokenId}`
    : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      {/* Image */}
      <div style={{
        width: "100%",
        aspectRatio: "1",
        borderRadius: "12px",
        overflow: "hidden",
        background: "#0f0f23",
      }}>
        {nft.imageUrl ? (
          <img
            src={nft.imageUrl}
            alt={nft.name || `NFT #${nft.tokenId}`}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
            }}
          >
            No Image
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <h2 style={{ margin: "0 0 4px 0", color: "#e2e8f0", fontSize: "20px" }}>
          {nft.name || `#${nft.tokenId}`}
        </h2>

        {nft.contractName && (
          <p style={{ margin: "0 0 12px 0", color: "#818cf8", fontSize: "12px" }}>
            {nft.contractName}
          </p>
        )}

        {nft.description && (
          <p style={{ margin: "0 0 12px 0", color: "#94a3b8", fontSize: "12px", lineHeight: 1.6 }}>
            {nft.description}
          </p>
        )}

        {/* Meta */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
          <span style={styles.badge}>{nft.tokenType}</span>
          {chainInfo && <span style={styles.badge}>{chainInfo.name}</span>}
          {nft.contractSymbol && <span style={styles.badge}>{nft.contractSymbol}</span>}
        </div>

        {/* Token ID */}
        <div style={{
          fontSize: "12px",
          color: "#64748b",
          fontFamily: "monospace",
          wordBreak: "break-all",
        }}>
          Contract: {nft.contractAddress}<br />
          Token ID: {nft.tokenId}
        </div>

        {/* Explorer Link */}
        {explorerUrl && onOpenExplorer && (
          <button
            onClick={() => onOpenExplorer(nft)}
            style={{
              marginTop: "8px",
              padding: "8px 16px",
              background: "rgba(99,102,241,0.2)",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: "8px",
              color: "#818cf8",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            View on {chainInfo?.name} Explorer →
          </button>
        )}
      </div>

      {/* Attributes */}
      {showAttributes && nft.attributes.length > 0 && (
        <div>
          <h3 style={{ margin: "0 0 8px 0", color: "#e2e8f0", fontSize: "16px" }}>
            Attributes ({nft.attributes.length})
          </h3>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {nft.attributes.slice(0, maxAttributes).map((attr, i) => (
              <div
                key={i}
                style={{
                  padding: "4px 12px",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ fontSize: "10px", color: "#64748b" }}>{attr.trait_type}</div>
                <div style={{ fontSize: "13px", color: "#e2e8f0", fontWeight: 600 }}>
                  {String(attr.value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
