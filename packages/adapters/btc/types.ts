/**
 * Bitcoin Wallet types.
 */

export interface BitcoinWalletConfig {
  /** Preferred wallet provider: 'leather' | 'xverse' | 'unisat' | 'okx' */
  preferredWallet?: 'leather' | 'xverse' | 'unisat' | 'okx';
  /** Address format: 'p2pkh' | 'p2sh' | 'p2wpkh' | 'p2tr' */
  addressFormat?: 'p2pkh' | 'p2sh' | 'p2wpkh' | 'p2tr';
  /** Bitcoin network */
  network?: 'mainnet' | 'testnet' | 'signet';
}

export interface BitcoinProvider {
  /** Request connection */
  requestAccounts: () => Promise<string[]>;
  /** Get accounts */
  getAccounts: () => Promise<string[]>;
  /** Get network */
  getNetwork: () => Promise<string>;
  /** Sign a message */
  signMessage: (message: string, address?: string) => Promise<string>;
  /** Sign a PSBT */
  signPsbt: (params: { psbt: string; inputsToSign: Array<{ address: string; signingIndexes: number[] }> }) => Promise<{ psbt: string }>;
  /** Send BTC */
  sendTransfer: (params: { recipients: Array<{ address: string; amount: number }> }) => Promise<{ txid: string }>;
  /** Event listeners */
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  off?: (event: string, handler: (...args: unknown[]) => void) => void;
}

export interface UTXO {
  txid: string;
  vout: number;
  value: number;
  script: string;
  address: string;
  confirmations?: number;
}

export interface BitcoinAccount {
  address: string;
  publicKey: string;
  purpose: string;
  addressType: string;
}
