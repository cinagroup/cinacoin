/**
 * ethers-to-viem codemod
 *
 * Transforms ethers.js v5 patterns → viem patterns:
 *   import { ethers } from 'ethers' → import { createPublicClient, http } from 'viem'
 *   ethers.providers.* → viem client methods
 *   ethers.Contract → getContract
 *   BigNumber → BigInt
 *   etc.
 */

export interface CodemodResult {
  transformed: boolean;
  original: string;
  output: string;
  changes: string[];
}

// ── Import / require rewrites ──────────────────────────────────────────────

const PACKAGE_RENAMES: [RegExp, string][] = [
  [/"ethers"/g, '"viem"'],
  [/'ethers'/g, "'viem'"],
  [/from\s+['"]ethers['"]/g, "from 'viem'"],
];

// ── Identifier rewrites ────────────────────────────────────────────────────

const IDENTIFIER_RENAMES: [RegExp, string][] = [
  // Provider / Client
  [/ethers\.providers/g, "createPublicClient"],
  [/ethers\.Wallet/g, "createWalletClient"],
  [/JsonRpcProvider/g, "createPublicClient"],
  [/Web3Provider/g, "createWalletClient"],
  [/new ethers\.Wallet/g, "createWalletClient"],

  // BigNumber → BigInt
  [/ethers\.BigNumber/g, "BigInt"],
  [/BigNumber\.from/g, "BigInt"],
  [/\.toNumber\(\)/g, "Number()"],
  [/\.toString\(\)/g, "String()"],

  // Contract
  [/new ethers\.Contract/g, "getContract"],
  [/ethers\.Contract/g, "getContract"],

  // Utils
  [/ethers\.utils\.formatEther/g, "formatEther"],
  [/ethers\.utils\.parseEther/g, "parseEther"],
  [/ethers\.utils\.formatUnits/g, "formatUnits"],
  [/ethers\.utils\.parseUnits/g, "parseUnits"],
  [/ethers\.utils\.isAddress/g, "isAddress"],
  [/ethers\.utils\.getAddress/g, "getAddress"],
  [/ethers\.utils\.hexlify/g, "toHex"],
  [/ethers\.utils\.hexZeroPad/g, "padHex"],
  [/ethers\.utils\.hexConcat/g, "concatHex"],
  [/ethers\.utils\.arrayify/g, "hexToBytes"],
  [/ethers\.utils\.id/g, "keccak256"],
  [/ethers\.utils\.keccak256/g, "keccak256"],
  [/ethers\.utils\.solidityPack/g, "encodeAbiParameters"],
  [/ethers\.utils\.defaultAbiCoder/g, "encodeAbiParameters"],

  // Constants
  [/ethers\.constants\.AddressZero/g, "zeroAddress"],
  [/ethers\.constants\.HashZero/g, "zeroHash"],

  // Method patterns
  [/\.getBalance\(/g, ".getBalance("],
  [/\.getBlockNumber\(\)/g, ".getBlockNumber()"],
  [/\.getTransaction\(/g, ".getTransaction("],
  [/\.sendTransaction\(/g, ".sendTransaction("],
  [/\.estimateGas\(/g, ".estimateGas("],
];

// ── Pattern-based line transforms ──────────────────────────────────────────

const LINE_TRANSFORMS: [RegExp, string][] = [
  // const provider = new ethers.providers.JsonRpcProvider(url)
  // → const client = createPublicClient({ chain: mainnet, transport: http(url) })
  [
    /new\s+ethers\.providers\.(JsonRpcProvider|Web3Provider)\s*\(\s*([^)]*)\s*\)/g,
    "createPublicClient({ transport: http($2) })",
  ],

  // signer.getAddress() → walletClient.getAddresses()
  [
    /\.getAddress\(\)/g,
    ".getAddresses()",
  ],

  // provider.getBalance(address) → client.getBalance({ address })
  [
    /(\w+)\.getBalance\(([^)]+)\)/g,
    "$1.getBalance({ address: $2, blockTag: 'latest' })",
  ],
];

// ── Main transform ──────────────────────────────────────────────────────────

export function transformEthersToViem(source: string): CodemodResult {
  let output = source;
  const changes: string[] = [];

  for (const [pattern, replacement] of PACKAGE_RENAMES) {
    const before = output;
    output = output.replace(pattern, replacement);
    if (output !== before) {
      const match = before.match(pattern);
      if (match) changes.push(`Renamed package: ${match[0]} → ${replacement}`);
    }
  }

  for (const [pattern, replacement] of IDENTIFIER_RENAMES) {
    const before = output;
    output = output.replace(pattern, replacement);
    if (output !== before) {
      const match = before.match(pattern);
      if (match) changes.push(`Renamed: ${match[0]} → ${replacement}`);
    }
  }

  for (const [pattern, replacement] of LINE_TRANSFORMS) {
    const before = output;
    output = output.replace(pattern, replacement);
    if (output !== before) {
      changes.push(`Pattern rewrite: ${pattern.source}`);
    }
  }

  return {
    transformed: output !== source,
    original: source,
    output,
    changes,
  };
}
