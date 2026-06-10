import type { WalletRegistryEntry } from './types.js';
import {
  evmTier1Wallets,
  evmTier2Wallets,
  evmTier3Wallets,
  evmMoreWallets,
  solanaWallets,
  cosmosWallets,
  bitcoinWallets,
  aptosSuiWallets,
  nearWallets,
  tronWallets,
  tonWallets,
  starknetWallets,
  hederaWallets,
  xrplWallets,
  cardanoWallets,
  socialEmbeddedWallets,
  gamingNftWallets,
  emergingWallets
} from './wallets/index.js';

/**
 * Complete wallet registry - combines all wallet categories
 */
export const WALLET_REGISTRY: readonly WalletRegistryEntry[] = [
  ...evmTier1Wallets,
  ...evmTier2Wallets,
  ...evmTier3Wallets,
  ...evmMoreWallets,
  ...solanaWallets,
  ...cosmosWallets,
  ...bitcoinWallets,
  ...aptosSuiWallets,
  ...nearWallets,
  ...tronWallets,
  ...tonWallets,
  ...starknetWallets,
  ...hederaWallets,
  ...xrplWallets,
  ...cardanoWallets,
  ...socialEmbeddedWallets,
  ...gamingNftWallets,
  ...emergingWallets
];

/**
 * Total number of wallets in the registry
 */
export const WALLET_COUNT = WALLET_REGISTRY.length;
