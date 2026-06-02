/**
 * ethers-v5-to-viem codemod
 *
 * Transforms ethers v5 code to viem equivalents:
 *   - ethers (v5)         → viem
 *   - ethers.providers    → viem publicClient
 *   - ethers.Contract     → getContract (viem)
 *   - ethers.Signer       → viem walletClient
 *   - ethers.Wallet       → privateKeyToAccount (viem)
 *   - ethers.utils.*      → viem utilities
 *
 * ## Usage
 * ```bash
 * npx @cinacoin/codemod ethers-v5-to-viem ./src
 * ```
 */

export interface CodemodResult {
  transformed: boolean;
  original: string;
  output: string;
  changes: string[];
}

// ── Import / require path rewrites ──────────────────────────────────────────

const PACKAGE_RENAMES: [RegExp, string][] = [
  [/from ['"]ethers['"]/g, `from 'viem'`],
  [/require\(['"]ethers['"]\)/g, `require('viem')`],
  [/from ['"]ethers\/lib\/esm['"]/g, `from 'viem'`],
  [/from ['"]ethers\/lib\/commonjs['"]/g, `from 'viem'`],
];

// ── Provider → publicClient rewrites ───────────────────────────────────────

const PROVIDER_REWRITES: [RegExp, string][] = [
  [/new ethers\.providers\.JsonRpcProvider\(/g, "createPublicClient({ transport: http("],
  [/new ethers\.providers\.WebSocketProvider\(/g, "createPublicClient({ transport: webSocket("],
  [/new ethers\.providers\.FallbackProvider\(/g, "createPublicClient({ transport: fallback(["],
  [/\.getNetwork\(\)/g, ".getChainId()"],
  [/\.getBalance\(/g, ".getBalance({ address: "],
  [/\.getBlockNumber\(\)/g, ".getBlockNumber()"],
  [/\.getTransaction\(/g, ".getTransaction({ hash: "],
  [/\.getTransactionReceipt\(/g, ".getTransactionReceipt({ hash: "],
  [/\.getCode\(/g, ".getBytecode({ address: "],
  [/\.getStorageAt\(/g, ".getStorageAt({ address: "],
  [/\.getLogs\(/g, ".getLogs("],
  [/\.call\(/g, ".call({"],
  [/\.estimateGas\(/g, ".estimateGas({"],
  [/\.getBlock\(/g, ".getBlock({"],
  [/\.getTransactionCount\(/g, ".getTransactionCount({ address: "],
  [/\.getGasPrice\(\)/g, ".getGasPrice()"],
  [/\.lookupAddress\(/g, ".getEnsName({ address: "],
  [/\.resolveName\(/g, ".getEnsAddress({ name: "],
];

// ── Signer/Wallet → walletClient rewrites ─────────────────────────────────

const SIGNER_REWRITES: [RegExp, string][] = [
  [/new ethers\.Wallet\(/g, "privateKeyToAccount("],
  [/new ethers\.VoidSigner\(/g, "// VoidSigner not needed in viem"],
  [/\.signMessage\(/g, ".signMessage({ message: "],
  [/\.signTransaction\(/g, ".signTransaction({"],
  [/\.sendTransaction\(/g, ".sendTransaction({"],
  [/\.getAddress\(\)/g, ".address"],
  [/\.provider/g, ".publicClient"],
  [/\.connect\(/g, "// connect not needed in viem"],
];

// ── Contract rewrites ─────────────────────────────────────────────────────

const CONTRACT_REWRITES: [RegExp, string][] = [
  [/new ethers\.Contract\(/g, "getContract({ address: "],
  [/\.populateTransaction\./g, ".simulate."],
  [/\.estimateGas\./g, ".estimateGas."],
  [/\.callStatic\./g, ".read."],
  [/\.functions\./g, ".read."],
];

// ── ethers.utils rewrites ─────────────────────────────────────────────────

const UTILS_REWRITES: [RegExp, string][] = [
  [/ethers\.utils\.formatEther\(/g, "formatEther("],
  [/ethers\.utils\.parseEther\(/g, "parseEther("],
  [/ethers\.utils\.formatUnits\(/g, "formatUnits("],
  [/ethers\.utils\.parseUnits\(/g, "parseUnits("],
  [/ethers\.utils\.hexlify\(/g, "toHex("],
  [/ethers\.utils\.hexZeroPad\(/g, "padHex("],
  [/ethers\.utils\.hexValue\(/g, "toHex("],
  [/ethers\.utils\.isAddress\(/g, "isAddress("],
  [/ethers\.utils\.getAddress\(/g, "getAddress("],
  [/ethers\.utils\.keccak256\(/g, "keccak256("],
  [/ethers\.utils\.id\(/g, "keccak256("],
  [/ethers\.utils\.toUtf8Bytes\(/g, "toBytes("],
  [/ethers\.utils\.toUtf8String\(/g, "fromBytes("],
  [/ethers\.utils\.arrayify\(/g, "toBytes("],
  [/ethers\.utils\.concat\(/g, "concat("],
  [/ethers\.utils\.solidityPack\(/g, "encodeAbiParameters("],
  [/ethers\.utils\.defaultAbiCoder\./g, "encodeAbiParameters("],
  [/ethers\.utils\.Interface\(/g, "parseAbi("],
  [/ethers\.utils\.parseAbi\(/g, "parseAbi("],
  [/ethers\.utils\.AbiCoder/g, "AbiParameters"],
];

// ── BigNumber rewrites ────────────────────────────────────────────────────

const BIGNUMBER_REWRITES: [RegExp, string][] = [
  [/ethers\.BigNumber\.from\(/g, "BigInt("],
  [/\.toString\(\)/g, ".toString()"],
  [/\.toNumber\(\)/g, "Number("],
  [/\.toBigInt\(\)/g, ""],
  [/\.add\(/g, "+ BigInt("],
  [/\.sub\(/g, "- BigInt("],
  [/\.mul\(/g, "* BigInt("],
  [/\.div\(/g, "/ BigInt("],
  [/\.mod\(/g, "% BigInt("],
  [/\.lt\(/g, "< BigInt("],
  [/\.lte\(/g, "<= BigInt("],
  [/\.gt\(/g, "> BigInt("],
  [/\.gte\(/g, ">= BigInt("],
  [/\.eq\(/g, "=== BigInt("],
  [/\.isZero\(\)/g, "=== 0n"],
];

// ── Main transform ──────────────────────────────────────────────────────────

/**
 * Apply the ethers v5 → viem transformation to source text.
 */
export function transformEthersV5ToViem(source: string): CodemodResult {
  let output = source;
  const changes: string[] = [];

  const applyRewrites = (
    rewrites: [RegExp, string][],
    category: string
  ) => {
    for (const [pattern, replacement] of rewrites) {
      const before = output;
      output = output.replace(pattern, replacement);
      if (output !== before) {
        changes.push(`${category}: applied pattern ${pattern.source}`);
      }
    }
  };

  applyRewrites(PACKAGE_RENAMES, "package");
  applyRewrites(PROVIDER_REWRITES, "provider");
  applyRewrites(SIGNER_REWRITES, "signer");
  applyRewrites(CONTRACT_REWRITES, "contract");
  applyRewrites(UTILS_REWRITES, "utils");
  applyRewrites(BIGNUMBER_REWRITES, "bigint");

  return {
    transformed: output !== source,
    original: source,
    output,
    changes,
  };
}
