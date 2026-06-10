/**
 * MetaMask types.
 */

export interface MetaMaskProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
  selectedAddress: string | null;
  chainId: string | null;
}

export interface MetaMaskConfig {
  /** Request installation if not present */
  installLink?: string;
  /** Preferred chain IDs */
  chains?: number[];
  /** Whether to use EIP-6963 for discovery */
  useEIP6963?: boolean;
}

export interface EIP6963ProviderDetail {
  info: {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
  };
  provider: MetaMaskProvider;
}
