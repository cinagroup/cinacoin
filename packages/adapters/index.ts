/**
 * @cinacoin/adapters — Wallet adapter packages.
 *
 * Each adapter implements the Connector interface from @cinacoin/core-sdk
 * and provides wallet-specific connection logic.
 *
 * Adapters:
 * - metamask: MetaMask via EIP-6963 / window.ethereum
 * - walletconnect: WalletConnect v2 QR code / deep link
 * - coinbase: Coinbase Wallet SDK
 * - phantom: Phantom (Solana + Ethereum)
 * - btc: Bitcoin wallets (Leather, Xverse, Unisat)
 */

export * from './metamask/index.js';
export * from './walletconnect/index.js';
export * from './coinbase/index.js';
export * from './phantom/index.js';
export * from './btc/index.js';
