/**
 * Solana State Sync Adapter
 *
 * Syncs state for Solana accounts.
 */
/**
 * Sync Solana chain state.
 */
export async function syncSolanaState(account, storage) {
    const session = {
        chain: "solana",
        address: account.address,
        expiresAt: Date.now() + 3600000,
        data: {
            tokenAccounts: account.tokenAccounts?.join(",") ?? "",
        },
    };
    const key = `solana-session:${account.address}`;
    await storage.set(key, session);
    account.lastSyncedAt = Date.now();
    await storage.set(`solana-account:${account.address}`, account);
    return true;
}
/**
 * Fetch Solana session from storage.
 */
export async function getSolanaSession(address, storage) {
    const key = `solana-session:${address}`;
    return storage.get(key);
}
//# sourceMappingURL=solana.js.map