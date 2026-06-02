/**
 * @cinacoin/react-native/hooks
 *
 * React Native-specific hooks including EIP-5792, ENS, account, and more.
 */

// EIP-5792
export {
  useWalletCapabilities,
  useSendCalls,
  useAtomicBatch,
  useCallsStatus,
} from './useEIP5792.js';

export type {
  UseWalletCapabilitiesReturn,
  UseSendCallsReturn,
  SendCallsOptions,
  UseAtomicBatchReturn,
  AtomicBatchOptions,
  UseCallsStatusReturn,
} from './useEIP5792.js';

// ENS
export {
  useENSName,
  useENSAddress,
  resolveENSAddress,
  lookupENSName,
} from './useENS.js';

export type {
  UseENSNameReturn,
  UseENSAddressReturn,
} from './useENS.js';

// Account hooks
export {
  useBalance,
  useDisconnect,
  useSwitchChain,
  useSendTransaction,
  useSignMessage,
} from './useAccount.js';

export type {
  UseBalanceReturn,
  UseDisconnectReturn,
  UseSwitchChainReturn,
  TransactionRequest,
  UseSendTransactionReturn,
  UseSignMessageReturn,
} from './useAccount.js';
