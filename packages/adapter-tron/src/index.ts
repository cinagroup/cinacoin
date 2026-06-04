/**
 * Cinacoin TRON Adapter — TRON chain adapter package.
 *
 * Provides a {@link TronChainAdapter} that implements the
 * {@link ChainAdapter} interface from @cinacoin/core-sdk,
 * backed by the `TronWeb` RPC client.
 *
 * @example
 * ```ts
 * import { TronChainAdapter, TRON_CHAINS } from '@cinacoin/adapter-tron';
 *
 * const adapter = new TronChainAdapter();
 * adapter.registerChains(TRON_CHAINS);
 *
 * const balance = await adapter.getBalance('TNA2B...');
 * console.log(`${balance} sun`);
 *
 * const trc20Bal = await adapter.getTRC20Balance(walletAddr, contractAddr);
 * console.log(`${trc20Bal} token units`);
 *
 * // Trigger smart contract
 * const txid = await adapter.triggerSmartContract({
 *   contractAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', // USDT
 *   functionName: 'transfer',
 *   params: { _to: recipientAddr, _value: amount },
 *   feeLimit: 60000,
 * });
 * ```
 *
 * @packageDocumentation
 */

/* ------------------------------------------------------------------ */
/*  Adapter                                                            */
/* ------------------------------------------------------------------ */

export { TronChainAdapter, TRON_CHAINS } from './TronChainAdapter.js';

export {
  isValidTRONAddress,
  base58ToHex,
  hexToBase58,
  CinacoinError,
} from './TronChainAdapter.js';

export type {
  TriggerSmartContractParams,
  EnergyBandwidthEstimate,
} from './TronChainAdapter.js';

/**
 * Package version.
 */
export { VERSION } from './TronChainAdapter.js';
