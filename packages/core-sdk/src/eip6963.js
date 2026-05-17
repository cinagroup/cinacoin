/**
 * EIP-6963 Multi-Injected Provider Discovery.
 *
 * Standardized way to discover multiple wallet extensions installed
 * in the same browser session.
 *
 * @see https://eips.ethereum.org/EIPS/eip-6963
 */
/**
 * Discover all EIP-6963 compatible wallet providers.
 *
 * Returns a promise that resolves with all discovered wallets
 * after a 300ms discovery window.
 *
 * @returns Promise resolving to array of discovered providers.
 */
export function discoverWallets() {
    return new Promise((resolve) => {
        const wallets = [];
        const seen = new Set();
        const handleAnnounce = (event) => {
            const detail = event.detail;
            if (detail && !seen.has(detail.info.rdns)) {
                seen.add(detail.info.rdns);
                wallets.push(detail);
            }
        };
        // Listen for wallet announcements
        window.addEventListener('eip6963:announceProvider', handleAnnounce);
        // Trigger discovery
        window.dispatchEvent(new Event('eip6963:requestProvider'));
        // Resolve after 300ms discovery window
        setTimeout(() => {
            window.removeEventListener('eip6963:announceProvider', handleAnnounce);
            resolve(wallets);
        }, 300);
    });
}
/**
 * Watch for wallet provider changes.
 *
 * Useful for detecting wallet install/uninstall during a session.
 *
 * @param callback - Invoked each time a new provider is discovered.
 * @returns Unsubscribe function.
 */
export function watchWallets(callback) {
    const handleAnnounce = (event) => {
        const detail = event.detail;
        if (detail) {
            callback(detail);
        }
    };
    window.addEventListener('eip6963:announceProvider', handleAnnounce);
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    return () => {
        window.removeEventListener('eip6963:announceProvider', handleAnnounce);
    };
}
/**
 * Find a specific wallet by its RDNS identifier.
 *
 * @param rdns - Reverse DNS identifier to search for.
 * @returns The provider detail if found, undefined otherwise.
 */
export async function findWalletByRdns(rdns) {
    const wallets = await discoverWallets();
    return wallets.find((w) => w.info.rdns === rdns);
}
//# sourceMappingURL=eip6963.js.map