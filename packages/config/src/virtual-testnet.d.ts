/**
 * Account representation within a virtual testnet.
 */
export interface VirtualTestnetAccount {
    /** Ethereum-style address. */
    address: string;
    /** Private key (hex, 0x-prefixed). */
    privateKey: string;
    /** Initial ETH balance (wei as string). */
    balance: string;
}
/**
 * Configuration for creating a virtual testnet.
 */
export interface VirtualTestnetConfig {
    /**
     * Tenderly fork URL (e.g. `https://rpc.tenderly.co/fork/abc123`).
     * If omitted, the default public RPC for the chain is used.
     */
    forkUrl?: string;
    /**
     * Block number to fork from.  `"latest"` uses the current head.
     */
    forkBlock?: number | "latest";
    /**
     * Test accounts to fund.  If omitted, a default set of 10 accounts
     * with 100 ETH each is created.
     */
    accounts?: VirtualTestnetAccount[];
    /**
     * Chain ID of the network to fork (e.g. 1 for Ethereum mainnet).
     */
    chainId?: number;
    /**
     * Whether to auto-mine transactions immediately.
     * Defaults to `true`.
     */
    autoMine?: boolean;
}
/**
 * A virtual testnet — an isolated fork of a real chain for testing.
 */
export interface VirtualTestnet {
    /** JSON-RPC URL for this fork. */
    rpcUrl: string;
    /** Chain ID of the forked network. */
    chainId: number;
    /** Block number at which the fork was created. */
    forkBlock: number;
    /** Pre-funded test accounts. */
    accounts: VirtualTestnetAccount[];
    /**
     * Reset the testnet to its original forked state.
     * All accounts are re-funded and state changes are discarded.
     */
    reset: () => Promise<void>;
    /**
     * Mine a single block (useful when `autoMine` is `false`).
     */
    mineBlock: () => Promise<string>;
    /**
     * Set the next block's base fee (EIP-1559).
     * @param fee Base fee in wei.
     */
    setNextBlockBaseFee: (fee: bigint) => Promise<void>;
    /**
     * Impersonate any account (useful for testing contracts that
     * require specific addresses).
     * @param address Address to impersonate.
     */
    impersonateAccount: (address: string) => Promise<void>;
    /**
     * Stop impersonating an account.
     */
    stopImpersonatingAccount: (address: string) => Promise<void>;
    /**
     * Destroy the fork and release server-side resources.
     */
    destroy: () => Promise<void>;
}
/**
 * Create an isolated virtual testnet by forking mainnet (or another chain)
 * at a specific block.  Supports Tenderly fork URLs out of the box.
 *
 * Test accounts are funded automatically with 100 ETH each.
 *
 * @param chainId - Chain ID to fork (default: 1 = Ethereum mainnet).
 * @param config - Optional fork configuration.
 * @returns A `VirtualTestnet` ready for use.
 *
 * @example
 * ```ts
 * const testnet = await createVirtualTestnet(1, {
 *   forkUrl: "https://rpc.tenderly.co/fork/abc123",
 *   forkBlock: 19_000_000,
 * });
 *
 * console.log(testnet.rpcUrl); // forked RPC endpoint
 * console.log(testnet.accounts[0].address); // pre-funded account
 *
 * // … run your tests …
 *
 * await testnet.reset(); // back to clean state
 * await testnet.destroy(); // release resources
 * ```
 */
export declare function createVirtualTestnet(chainId?: number, config?: VirtualTestnetConfig): Promise<VirtualTestnet>;
//# sourceMappingURL=virtual-testnet.d.ts.map