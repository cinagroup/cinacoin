/**
 * NFT ABIs, metadata helpers, and scanning utilities.
 *
 * Provides ERC-721/1155 ABI definitions, IPFS metadata resolution,
 * and on-chain NFT scanning logic.
 * Extracted from client.ts to reduce file size and improve modularity.
 */

import { logger } from "@cinacoin/logger";
import type { Address, PublicClient } from "viem";
import type { NFTItem } from "./types.js";

// ---------------------------------------------------------------------------
// ERC-721 ABI
// ---------------------------------------------------------------------------

/** ERC-721 ABI subset for NFT metadata reads. */
export const erc721MetadataAbi = [
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    name: "tokenURI",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "string" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "ownerOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "address" }],
  },
] as const;

// ---------------------------------------------------------------------------
// ERC-1155 ABI
// ---------------------------------------------------------------------------

/** ERC-1155 ABI subset for NFT metadata + balance reads. */
export const erc1155MetadataAbi = [
  {
    name: "uri",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [{ type: "string" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
] as const;

// ---------------------------------------------------------------------------
// ERC-165 ABI
// ---------------------------------------------------------------------------

/** ERC-165 interface detection — checks if a contract implements a given interface. */
export const erc165Abi = [
  {
    name: "supportsInterface",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "interfaceId", type: "bytes4" }],
    outputs: [{ type: "bool" }],
  },
] as const;

// ---------------------------------------------------------------------------
// Interface IDs
// ---------------------------------------------------------------------------

/** ERC-721 interface ID per ERC-165 */
export const ERC721_INTERFACE_ID = "0x80ac58cd" as const;
/** ERC-1155 interface ID per ERC-165 */
export const ERC1155_INTERFACE_ID = "0xd9b67a26" as const;

// ---------------------------------------------------------------------------
// Metadata cache & IPFS resolution
// ---------------------------------------------------------------------------

/** In-memory metadata cache to avoid repeated RPC + IPFS fetches. */
const _metadataCache = new Map<string, { data: Record<string, unknown>; ts: number }>();
const _CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** Well-known public IPFS gateways for multi-gateway fallback. */
const IPFS_GATEWAYS = [
  "https://cloudflare-ipfs.com/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://nftstorage.link/ipfs/",
  "https://dweb.link/ipfs/",
  "https://gateway.4everland.net/ipfs/",
] as const;

/** Fetch JSON from an IPFS or HTTP URI with multi-gateway fallback and cache. */
export async function fetchMetadata(uri: string): Promise<Record<string, unknown> | null> {
  const cached = _metadataCache.get(uri);
  if (cached && Date.now() - cached.ts < _CACHE_TTL_MS) {
    return cached.data;
  }

  // Non-IPFS URIs: fetch directly
  if (!uri.startsWith("ipfs://")) {
    try {
      const res = await fetch(uri, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return null;
      const data = (await res.json()) as Record<string, unknown>;
      _metadataCache.set(uri, { data, ts: Date.now() });
      return data;
    } catch (err) {
      logger.warn(`[blockchain-api:fetchMetadata] error:`, err);
      return null;
    }
  }

  // IPFS URIs: try each gateway in priority order
  const cid = uri.slice(7); // strip "ipfs://"
  for (const gateway of IPFS_GATEWAYS) {
    try {
      const url = `${gateway}${cid}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const data = (await res.json()) as Record<string, unknown>;
      _metadataCache.set(uri, { data, ts: Date.now() });
      return data;
    } catch (err) {
      logger.warn(`[blockchain-api:fetchMetadata] gateway error:`, err);
      continue;
    }
  }

  return null;
}

/** Resolve IPFS gateway URL from a URI string. */
export function resolveImageUrl(uri: string | undefined): string | undefined {
  if (!uri) return undefined;
  if (uri.startsWith("ipfs://")) {
    const cid = uri.slice(7);
    return `https://cloudflare-ipfs.com/ipfs/${cid}`;
  }
  if (uri.startsWith("http://") || uri.startsWith("https://")) return uri;
  return undefined;
}

// ---------------------------------------------------------------------------
// NFT scanning utilities
// ---------------------------------------------------------------------------

/** Check if a contract supports a given interface via ERC-165. */
export async function supportsInterface(
  client: PublicClient,
  contract: Address,
  interfaceId: string
): Promise<boolean> {
  try {
    const result = await client.readContract({
      address: contract,
      abi: erc165Abi,
      functionName: "supportsInterface",
      args: [interfaceId as `0x${string}`],
    });
    return result as boolean;
  } catch (err) {
    logger.warn(`[blockchain-api:supportsInterface] error:`, err);
    return false;
  }
}

/** Fetch metadata for a specific NFT token. */
export async function fetchNftMetadata(
  client: PublicClient,
  contract: Address,
  tokenId: string,
  tokenType: "ERC721" | "ERC1155"
): Promise<{ name?: string; description?: string; imageUrl?: string }> {
  let uri: string | undefined;

  try {
    if (tokenType === "ERC721") {
      uri = await client.readContract({
        address: contract,
        abi: erc721MetadataAbi,
        functionName: "tokenURI",
        args: [BigInt(tokenId)],
      }) as string;
    } else {
      uri = await client.readContract({
        address: contract,
        abi: erc1155MetadataAbi,
        functionName: "uri",
        args: [BigInt(tokenId)],
      }) as string;
    }
  } catch (err) {
    logger.warn(`[blockchain-api:fetchNftMetadata] URI error:`, err);
  }

  if (!uri) {
    try {
      const name = await client.readContract({
        address: contract,
        abi: erc721MetadataAbi,
        functionName: "name",
      }) as string;
      return { name };
    } catch (err) {
      logger.warn(`[blockchain-api:fetchNftMetadata] name error:`, err);
      return {};
    }
  }

  const resolvedUri = uri.replace("{id}", BigInt(tokenId).toString(16).padStart(64, "0"));
  const metadata = await fetchMetadata(resolvedUri);
  if (!metadata) {
    return { imageUrl: resolveImageUrl(resolvedUri) };
  }

  return {
    name: metadata.name as string | undefined,
    description: metadata.description as string | undefined,
    imageUrl: resolveImageUrl(metadata.image as string | undefined) ??
              resolveImageUrl(metadata.image_url as string | undefined),
  };
}

/** Scan an ERC-721 contract for tokens owned by `owner`. */
export async function scanErc721(
  client: PublicClient,
  contract: Address,
  owner: Address,
  tokenIds: string[],
  limit: number
): Promise<NFTItem[]> {
  const items: NFTItem[] = [];
  try {
    const supportsErc721 = await supportsInterface(client, contract, ERC721_INTERFACE_ID);
    if (!supportsErc721) return items;

    const balance = await client.readContract({
      address: contract,
      abi: erc721MetadataAbi,
      functionName: "balanceOf",
      args: [owner],
    }) as bigint;

    if (balance === 0n) return items;

    if (tokenIds.length > 0) {
      for (const tid of tokenIds.slice(0, limit)) {
        if (items.length >= limit) break;
        try {
          const tokenOwner = await client.readContract({
            address: contract,
            abi: erc721MetadataAbi,
            functionName: "ownerOf",
            args: [BigInt(tid)],
          }) as Address;

          if (tokenOwner.toLowerCase() === owner.toLowerCase()) {
            const meta = await fetchNftMetadata(client, contract, tid, "ERC721");
            items.push({ ...meta, contractAddress: contract, tokenId: tid, tokenType: "ERC721" });
          }
        } catch (err) {
          logger.warn(`[blockchain-api:scanErc721] ownerOf error:`, err);
        }
      }
    } else {
      const maxScan = Math.min(Number(balance) + 1, limit);
      for (let tid = 0; tid < maxScan; tid++) {
        if (items.length >= limit) break;
        try {
          const tokenOwner = await client.readContract({
            address: contract,
            abi: erc721MetadataAbi,
            functionName: "ownerOf",
            args: [BigInt(tid)],
          }) as Address;

          if (tokenOwner.toLowerCase() === owner.toLowerCase()) {
            const meta = await fetchNftMetadata(client, contract, String(tid), "ERC721");
            items.push({ ...meta, contractAddress: contract, tokenId: String(tid), tokenType: "ERC721" });
          }
        } catch (err) {
          logger.warn(`[blockchain-api:scanErc721] scan error:`, err);
        }
      }
    }
  } catch (err) {
    logger.warn(`[blockchain-api:scanErc721] contract error:`, err);
  }
  return items;
}

/** Scan an ERC-1155 contract for tokens owned by `owner`. */
export async function scanErc1155(
  client: PublicClient,
  contract: Address,
  owner: Address,
  tokenIds: string[],
  limit: number
): Promise<NFTItem[]> {
  const items: NFTItem[] = [];
  try {
    const supportsErc1155 = await supportsInterface(client, contract, ERC1155_INTERFACE_ID);
    if (!supportsErc1155) return items;

    const idsToCheck = tokenIds.length > 0 ? tokenIds.slice(0, limit) : ["0", "1"];
    for (const tid of idsToCheck) {
      if (items.length >= limit) break;
      try {
        const bal = await client.readContract({
          address: contract,
          abi: erc1155MetadataAbi,
          functionName: "balanceOf",
          args: [owner, BigInt(tid)],
        }) as bigint;

        if (bal > 0n) {
          const meta = await fetchNftMetadata(client, contract, tid, "ERC1155");
          items.push({
            ...meta,
            contractAddress: contract,
            tokenId: tid,
            tokenType: "ERC1155",
            balance: bal,
          });
        }
      } catch (err) {
        logger.warn(`[blockchain-api:scanErc1155] balanceOf error:`, err);
      }
    }
  } catch (err) {
    logger.warn(`[blockchain-api:scanErc1155] contract error:`, err);
  }
  return items;
}
