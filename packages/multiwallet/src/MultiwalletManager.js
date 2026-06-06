import { MultiwalletStore } from "./store.js";
/**
 * High-level manager that orchestrates multiwallet connections.
 *
 * Wraps a `MultiwalletStore` and provides a clean connect/disconnect/switch API
 * with event emission for downstream consumers.
 *
 * @example
 * ```ts
 * const manager = new MultiwalletManager();
 * manager.onConnectionAdded((r) => console.log("Connected:", r.walletName));
 * await manager.connect("metamask", "eip155");
 * ```
 */
export class MultiwalletManager {
    constructor(store) {
        this.store = store ?? new MultiwalletStore();
        this.onAddedCallbacks = new Set();
        this.onRemovedCallbacks = new Set();
    }
    // ─── Public API ───────────────────────────────────────────────
    /**
     * Connect a new wallet to a namespace.
     *
     * @param walletId - Unique wallet identifier.
     * @param namespace - Target namespace.
     * @param walletName - Human-readable name.
     * @param address - Wallet address.
     * @param provider - Provider instance.
     * @param session - Optional session state.
     * @returns The created connection record.
     */
    async connect(walletId, namespace, walletName = walletId, address = "", provider = null, session = null) {
        const record = this.store.addConnection(walletId, walletName, namespace, address, provider, session);
        this.emitAdded(record);
        return record;
    }
    /**
     * Disconnect a specific wallet.
     *
     * @param walletId - Wallet to disconnect.
     * @param namespace - Optional namespace scope.
     * @returns `true` if a connection was found and removed.
     */
    disconnect(walletId, namespace) {
        const record = namespace
            ? this.store.getActiveConnection(namespace)?.walletId === walletId
                ? this.store.getActiveConnection(namespace)
                : null
            : null;
        const removed = this.store.removeConnection(walletId, namespace);
        if (removed && record) {
            this.emitRemoved(record);
        }
        return removed;
    }
    /**
     * Switch the active wallet for a given namespace.
     *
     * @param namespace - Namespace to switch within.
     * @param walletId - Wallet to activate.
     * @returns `true` if the switch succeeded.
     */
    switchWallet(namespace, walletId) {
        return this.store.setActiveConnection(walletId, namespace) !== null;
    }
    /**
     * Register a callback fired when a new connection is added.
     *
     * @param callback - Invoked with the new `ConnectionRecord`.
     * @returns Unsubscribe function.
     */
    onConnectionAdded(callback) {
        this.onAddedCallbacks.add(callback);
        return () => {
            this.onAddedCallbacks.delete(callback);
        };
    }
    /**
     * Register a callback fired when a connection is removed.
     *
     * @param callback - Invoked with the removed `ConnectionRecord`.
     * @returns Unsubscribe function.
     */
    onConnectionRemoved(callback) {
        this.onRemovedCallbacks.add(callback);
        return () => {
            this.onRemovedCallbacks.delete(callback);
        };
    }
    /**
     * Access the underlying store for advanced operations.
     */
    getStore() {
        return this.store;
    }
    // ─── Private ──────────────────────────────────────────────────
    emitAdded(record) {
        for (const cb of this.onAddedCallbacks) {
            try {
                cb(record);
            }
            catch {
                // Don't let consumer errors break the manager
            }
        }
    }
    emitRemoved(record) {
        for (const cb of this.onRemovedCallbacks) {
            try {
                cb(record);
            }
            catch {
                // Don't let consumer errors break the manager
            }
        }
    }
}
//# sourceMappingURL=MultiwalletManager.js.map