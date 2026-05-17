/**
 * EVM State Sync Adapter
 *
 * Syncs state for EVM-compatible chains (Ethereum, Polygon, Arbitrum, etc.)
 */
/**
 * Sync EVM chain state.
 */
export async function syncEvmState(account, storage) {
    const session = {
        chain: "evm",
        chainId: account.chainId,
        address: account.address,
        expiresAt: Date.now() + 3600000, // 1 hour
        data: {
            ensName: account.ensName ?? "",
            nonce: String(account.nonce ?? 0),
        },
    };
    const key = `evm-session:${account.chainId}:${account.address}`;
    await storage.set(key, session);
    account.lastSyncedAt = Date.now();
    await storage.set(`evm-account:${account.chainId}:${account.address}`, account);
    return true;
}
/**
 * Fetch EVM session from storage.
 */
export async function getEvmSession(chainId, address, storage) {
    const key = `evm-session:${chainId}:${address}`;
    return storage.get(key);
}
//# sourceMappingURL=evm.js.map