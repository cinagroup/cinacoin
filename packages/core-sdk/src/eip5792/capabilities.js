/** @ts-nocheck */
/**
 * wallet_getCapabilities implementation (EIP-5792).
 *
 * Queries a wallet for its supported capabilities per chain,
 * such as paymasterService, sessionKeys, atomicBatch, etc.
 */
/**
 * Request wallet capabilities from a connected wallet provider.
 *
 * Calls the `wallet_getCapabilities` JSON-RPC method.
 *
 * @param client - Viem WalletClient connected to the wallet.
 * @param account - Optional account address to query.
 * @returns WalletCapabilities keyed by chain ID (hex).
 */
export async function walletGetCapabilities(client, account) {
    const accountParam = account ?? client.account;
    if (!accountParam) {
        throw new Error('wallet_getCapabilities requires an account address');
    }
    const params = { address: accountParam };
    try {
        const result = await client.request({
            method: 'wallet_getCapabilities',
            params: [params.address],
        });
        return result;
    }
    catch (error) {
        const err = error;
        if (err.code === -32601) {
            return {};
        }
        throw error;
    }
}
/**
 * Check if the wallet supports a specific capability on a chain.
 *
 * @param capabilities - WalletCapabilities from wallet_getCapabilities.
 * @param chainId - Chain ID in hex format.
 * @param capability - Capability name (e.g., 'paymasterService').
 * @returns True if the capability is supported.
 */
export function hasCapability(capabilities, chainId, capability) {
    const chainCaps = capabilities[chainId];
    if (!chainCaps)
        return false;
    const cap = chainCaps[capability];
    return cap?.supported === true;
}
/**
 * Get capabilities for a specific chain, returning defaults if not found.
 */
export function getChainCapabilities(capabilities, chainId) {
    return capabilities[chainId] ?? {};
}
/**
 * Get all chain IDs the wallet supports with any capabilities.
 */
export function getSupportedChains(capabilities) {
    return Object.keys(capabilities);
}
/**
 * Filter capabilities to only chains that support a specific feature.
 */
export function filterByCapability(capabilities, capability) {
    const result = {};
    for (const [chainId, caps] of Object.entries(capabilities)) {
        if (caps[capability]?.supported) {
            result[chainId] = caps;
        }
    }
    return result;
}
//# sourceMappingURL=capabilities.js.map