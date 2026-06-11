/** Shared types for the Wallet Explorer */

export type TxType = 'send' | 'receive' | 'contract';
export type TxStatus = 'success' | 'failed' | 'pending';

export interface Transaction {
  hash: string;
  type: TxType;
  from: string;
  to: string;
  value: string;
  fee: string;
  block: number;
  timestamp: string;
  status: TxStatus;
}

export interface TransactionDetail {
  hash: string;
  status: TxStatus;
  block: number;
  timestamp: string;
  from: string;
  to: string;
  value: string;
  fee: string;
  gasUsed: string;
  gasPrice: string;
  input: string;
  confirmations: number;
}

export interface Token {
  symbol: string;
  name: string;
  balance: string;
  value: string;
  change24h: string;
  changePositive: boolean;
}

export interface WalletState {
  connected: boolean;
  address: string | null;
  chain: string;
  balance: string;
  tokenBalance: string;
  txCount: number;
  firstSeen: string;
}
