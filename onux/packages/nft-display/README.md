# @cinacoin/nft-display

Multi-chain NFT fetching, metadata resolution, and React display components for Cinacoin.

## Installation

```bash
npm install @cinacoin/nft-display
```

Peer dependencies: `react >= 18.0.0`, `react-dom >= 18.0.0`

## Usage

### Fetcher (vanilla TypeScript)

```ts
import { NftFetcher } from '@cinacoin/nft-display';

const fetcher = new NftFetcher({ alchemyApiKey: process.env.ALCHEMY_API_KEY });

// Fetch all NFTs owned by an address
const { nfts, nextCursor } = await fetcher.getNftsByOwner({
  address: '0x1234...',
  chainId: 1,      // Ethereum mainnet
  limit: 20,
});

// Fetch metadata for a single NFT
const metadata = await fetcher.getNftMetadata({
  contractAddress: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
  tokenId: '1234',
  chainId: 1,
});
```

### React Components

```tsx
import { NftCard, NftGrid, NftDetail } from '@cinacoin/nft-display/components';

function MyGallery() {
  return (
    <NftGrid nfts={nfts} renderCard={(nft) => <NftCard nft={nft} />} />
  );
}

function NftPage({ nft }: { nft: NftMetadata }) {
  return <NftDetail nft={nft} />;
}
```

### React Hooks

```tsx
import { useNfts, useNftMetadata } from '@cinacoin/nft-display/hooks';

function UserGallery({ address }: { address: string }) {
  const { nfts, loading, error, fetchMore } = useNfts({
    address,
    chainId: 1,
  });

  if (loading) return <p>Loading...</p>;
  return <NftGrid nfts={nfts} />;
}

function SingleNft({ contract, tokenId }: { contract: string; tokenId: string }) {
  const { metadata, loading } = useNftMetadata({
    contractAddress: contract,
    tokenId,
    chainId: 1,
  });

  if (loading) return <p>Loading...</p>;
  return <NftDetail nft={metadata} />;
}
```

## Supported Chains

| Chain | Chain ID | Short Name |
|-------|----------|------------|
| Ethereum | 1 | ETH |
| Polygon | 137 | MATIC |
| Arbitrum One | 42161 | ARB |
| Optimism | 10 | OP |
| Base | 8453 | BASE |

## API Reference

### NftFetcher

| Method | Description |
|--------|-------------|
| `getNftsByOwner(params)` | Fetch NFTs owned by an address with pagination |
| `getNftMetadata(params)` | Fetch metadata for a single NFT |

### Components

| Component | Description |
|-----------|-------------|
| `NftCard` | Single NFT card with image, name, and contract info |
| `NftGrid` | Responsive grid layout for multiple NFTs |
| `NftDetail` | Full NFT detail view with attributes/traits |

### Hooks

| Hook | Description |
|------|-------------|
| `useNfts(params)` | Fetch and paginate NFTs for an owner |
| `useNftMetadata(params)` | Fetch metadata for a single NFT |

### IPFS Resolution

IPFS URIs (`ipfs://...`) are automatically resolved through configurable gateways:

```ts
import { resolveIpfsUri, getDefaultFetcher, setDefaultFetcher } from '@cinacoin/nft-display';

const httpsUrl = resolveIpfsUri('ipfs://QmX...');
// → https://ipfs.io/ipfs/QmX...
```

### Types

```ts
import type {
  NftMetadata,
  GetNftsByOwnerParams,
  GetNftMetadataParams,
  PaginatedNftResponse,
  NftProviderConfig,
  SupportedChainId,
} from '@cinacoin/nft-display';
```

## License

MIT
