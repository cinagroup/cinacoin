// @cinacoin/gas-estimator
// Gas estimation for EVM and Solana

export { GasEstimator } from './estimator.js';
export { GasPriceCache } from './cache.js';
export { EVMEstimator } from './chains/evm.js';
export { SolanaEstimator } from './chains/solana.js';

// Multi-Source Gas Aggregation
export {
  MultiSourceGasAggregator,
  fetchEthGasStation,
  fetchBlocknative,
  fetchRpcGasPrice,
  aggregateGasPrices,
} from './gas-sources.js';

export type {
  GasSourceId,
  GasSourceData,
  AggregatedGasPrice,
  GasSourceConfig,
  MultiSourceGasAggregatorConfig,
} from './gas-sources.js';

// Gas Price Prediction
export { GasPricePredictor } from './gas-predictor.js';

// React Hooks
export { useGasPrice, useGasEstimate } from './react-hooks.js';

export type {
  EvmGasEstimate,
  SolanaGasEstimate,
  LegacyGasEstimate,
  FeeHistoryEntry,
  GasPricePrediction,
  ChainType,
  GasEstimatorConfig,
  GasCache,
  GasPriceData,
  GasEstimationResult,
  ChainConfig,
  RpcResponse,
} from './types.js';
export { DEFAULT_CHAINS } from './types.js';
