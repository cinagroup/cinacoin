export interface ChainAccount {
  address: string;
  chainId: string;
}

export interface SessionState {
  accounts: ChainAccount[];
}

export interface StateStorage {
  getState(): Promise<SessionState>;
  setState(state: SessionState): Promise<void>;
}

export interface BridgeConfig {
  sourceChain: string;
  targetChain: string;
  tokenAddress?: string;
}
