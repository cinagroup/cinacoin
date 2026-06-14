/**
 * Cinacoin types.
 */

export interface CinacoinConfig {
  /** Cinacoin Project ID from cloud.walletconnect.com */
  projectId: string;
  /** Relay URL (default: wss://relay.walletconnect.com) */
  relayUrl?: string;
  /** Required chains (CAIP-2 format) */
  requiredChains?: string[];
  /** Optional chains (CAIP-2 format) */
  optionalChains?: string[];
  /** Required methods */
  requiredMethods?: string[];
  /** Optional methods */
  optionalMethods?: string[];
  /** Required events */
  requiredEvents?: string[];
  /** Optional events */
  optionalEvents?: string[];
  /** Metadata for the dApp */
  metadata?: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
}

export interface CinacoinSession {
  topic: string;
  pairingTopic: string;
  relay: {
    protocol: string;
    data?: string;
  };
  expiry: number;
  namespaces: Record<string, {
    accounts: string[];
    methods: string[];
    events: string[];
    chains?: string[];
  }>;
  requiredNamespaces: Record<string, {
    chains: string[];
    methods: string[];
    events: string[];
  }>;
  peer: {
    publicKey: string;
    metadata: {
      name: string;
      description: string;
      url: string;
      icons: string[];
    };
  };
}

export interface CinacoinProvider {
  connect: (params: {
    requiredNamespaces?: Record<string, {
      chains: string[];
      methods: string[];
      events: string[];
    }>;
  }) => Promise<{ uri?: string; approval: () => Promise<CinacoinSession> }>;
  disconnect: (params: { topic: string; reason: { code: number; message: string } }) => Promise<void>;
  request: (params: {
    topic: string;
    chainId: string;
    request: {
      method: string;
      params?: unknown[];
    };
  }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
  session: CinacoinSession | null;
}
