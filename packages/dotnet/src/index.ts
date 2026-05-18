/**
 * @cinaconnect/dotnet
 * TypeScript type definitions matching the CinaConnect .NET client API surface.
 * Mirrors: CinaConnectClient, Account, Transaction, Network, WalletService, SessionResult
 */

// ─── Models ─────────────────────────────────────────────────────────────

/**
 * Represents a blockchain account.
 * Matches CinaConnect.Models.Account
 */
export interface Account {
  address: string;
  chainId: string;
  balance: string;
  label: string;
}

/**
 * Represents a blockchain transaction.
 * Matches CinaConnect.Models.Transaction
 */
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasLimit: string;
  gasPrice: string;
  data: string;
  chainId: string;
  status: number;
  blockNumber: number;
  timestamp: number;
}

/**
 * Represents a blockchain network.
 * Matches CinaConnect.Models.Network
 */
export interface Network {
  id: string;
  name: string;
  chainId: number;
  rpcUrl: string;
  currency: string;
  explorerUrl: string;
  isTestnet: boolean;
}

// ─── Client Types ───────────────────────────────────────────────────────

/**
 * Result of a wallet session creation.
 * Matches CinaConnect.SessionResult
 */
export interface SessionResult {
  sessionId: string;
  uri: string;
}

// ─── CinaConnectClient ──────────────────────────────────────────────────

/**
 * Main client for interacting with the CinaConnect SDK.
 * Provides wallet connectivity, transaction signing, and network switching.
 * Matches CinaConnect.CinaConnectClient
 */
export class CinaConnectClient {
  constructor(_projectId: string, _baseUrl: string = "https://api.cinaconnect.com") {
    void _projectId;
    void _baseUrl;
  }
  getAccountAsync(_walletId: string): Promise<Account> {
    return Promise.resolve({} as Account);
  }
  getBalanceAsync(_address: string, _chainId: string = "1"): Promise<number> {
    return Promise.resolve(0);
  }
  getNetworksAsync(): Promise<Network[]> {
    return Promise.resolve([]);
  }
  createSessionAsync(_walletId: string, _namespace: string): Promise<SessionResult> {
    return Promise.resolve({} as SessionResult);
  }
  dispose(): void {}
}

// ─── WalletService ──────────────────────────────────────────────────────

/**
 * Service for wallet operations.
 * Provides high-level wallet interaction methods.
 * Matches CinaConnect.Services.WalletService
 */
export class WalletService {
  constructor(_client: CinaConnectClient) {
    void _client;
  }
  getTokenBalanceAsync(_address: string, _chainId: string = "1"): Promise<number> {
    return Promise.resolve(0);
  }
  getNetworksAsync(): Promise<Network[]> {
    return Promise.resolve([]);
  }
}
