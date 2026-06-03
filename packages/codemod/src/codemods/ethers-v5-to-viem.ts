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
  [/\.getBlockNumber\(\)/g, ".getBlockNumber()"],
  [/\.getTransaction\(/g, ".getTransaction({ hash: "],
  [/\.getTransactionReceipt\(/g, ".getTransactionReceipt({ hash: "],
  [/\.getCode\(/g, ".getBytecode({ address: "],
  [/\.getStorageAt\(/g, ".getStorageAt({ address: "],
  [/\.getLogs\(/g, ".getLogs("],
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
  [/ethers\.Signer\b/g, "WalletClient"],
  [/\.signMessage\(/g, ".signMessage({ message: "],
  [/\.signTransaction\(/g, ".signTransaction({"],
  [/\.sendTransaction\(/g, ".sendTransaction({"],
  [/\.getAddress\(\)/g, ".address"],
];

// ── Contract rewrites ─────────────────────────────────────────────────────

const CONTRACT_REWRITES: [RegExp, string][] = [
  [/new ethers\.Contract\(/g, "getContract({ address: "],
  [/\.populateTransaction\./g, ".simulate."],
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
  [/ethers\.utils\.concat\(/g, "concatHex("],
  [/ethers\.utils\.solidityPack\(/g, "encodePacked("],
  [/ethers\.utils\.defaultAbiCoder\./g, "encodeAbiParameters("],
  [/ethers\.utils\.Interface\(/g, "parseAbi("],
  [/ethers\.utils\.parseAbi\(/g, "parseAbi("],
  [/ethers\.utils\.AbiCoder/g, "AbiParameters"],
];

// ── BigNumber rewrites ────────────────────────────────────────────────────

const BIGNUMBER_REWRITES: [RegExp, string][] = [
  [/ethers\.BigNumber\.from\(/g, "BigInt("],
  [/ethers\.BigNumber\.isBigNumber\(/g, "typeof $1 === 'bigint'"],
  [/\.toNumber\(\)/g, "Number($1)"],
  [/\.toBigInt\(\)/g, ""],
];

// ── Constants rewrites ────────────────────────────────────────────────────

const CONSTANTS_REWRITES: [RegExp, string][] = [
  [/ethers\.constants\.AddressZero/g, "zeroAddress"],
  [/ethers\.constants\.HashZero/g, "zeroHash"],
  [/ethers\.constants\.WeiPerEther/g, "etherUnits(1)"],
  [/ethers\.constants\.MaxUint256/g, "maxUint256"],
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
  applyRewrites(CONSTANTS_REWRITES, "constants");

  return {
    transformed: output !== source,
    original: source,
    output,
    changes,
  };
}
