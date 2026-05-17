/**
 * Bitcoin State Sync Adapter
 *
 * Syncs state for Bitcoin accounts (including Taproot and legacy).
 */
/**
 * Sync Bitcoin chain state.
 */
export async function syncBitcoinState(account, storage) {
    const session = {
        chain: "bitcoin",
        address: account.address,
        expiresAt: Date.now() + 3600000,
        data: {
            addressType: account.addressType,
            utxoCount: String(account.utxoCount ?? 0),
        },
    };
    const key = `btc-session:${account.address}`;
    await storage.set(key, session);
    account.lastSyncedAt = Date.now();
    await storage.set(`btc-account:${account.address}`, account);
    return true;
}
/**
 * Fetch Bitcoin session from storage.
 */
export async function getBitcoinSession(address, storage) {
    const key = `btc-session:${address}`;
    return storage.get(key);
}
//# sourceMappingURL=bitcoin.js.map