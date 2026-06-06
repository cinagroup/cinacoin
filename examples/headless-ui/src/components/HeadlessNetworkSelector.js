import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
const DEFAULT_NETWORKS = [
    { chainId: 1, name: 'Ethereum Mainnet', icon: '🔵' },
    { chainId: 137, name: 'Polygon', icon: '🟣' },
    { chainId: 42161, name: 'Arbitrum One', icon: '🔵' },
    { chainId: 10, name: 'Optimism', icon: '🔴' },
    { chainId: 8453, name: 'Base', icon: '🔵' },
    { chainId: 56, name: 'BNB Chain', icon: '🟡' },
    { chainId: 43114, name: 'Avalanche', icon: '🔴' },
    { chainId: 84532, name: 'Base Sepolia', icon: '🔵' },
    { chainId: 11155111, name: 'Sepolia Testnet', icon: '🟢' },
];
/**
 * HeadlessNetworkSelector — a custom network/chain selector.
 *
 * Renders a fully custom dropdown for switching chains using only
 * the headless client API. No built-in UI components involved.
 *
 * @example
 * ```tsx
 * const client = createHeadlessClient({ projectId })
 *
 * <HeadlessNetworkSelector
 *   client={client}
 *   networks={[
 *     { chainId: 1, name: 'Ethereum', icon: '🔵' },
 *     { chainId: 137, name: 'Polygon', icon: '🟣' },
 *   ]}
 *   currentChainId={currentChain}
 *   onNetworkChange={(id) => console.log('Switched to', id)}
 * />
 * ```
 */
export function HeadlessNetworkSelector({ client, networks = DEFAULT_NETWORKS, currentChainId, onNetworkChange, }) {
    const [open, setOpen] = useState(false);
    const [switching, setSwitching] = useState(null);
    const [error, setError] = useState(null);
    const handleSelect = useCallback(async (chainId) => {
        setOpen(false);
        setSwitching(chainId);
        setError(null);
        try {
            await client.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${chainId.toString(16)}` }],
            });
            onNetworkChange?.(chainId);
        }
        catch (switchError) {
            // Chain not added to wallet — try to add it
            const network = networks.find((n) => n.chainId === chainId);
            if (network?.rpcUrl) {
                try {
                    await client.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: `0x${chainId.toString(16)}`,
                                chainName: network.name,
                                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                                rpcUrls: [network.rpcUrl],
                            },
                        ],
                    });
                    onNetworkChange?.(chainId);
                }
                catch (addError) {
                    setError(addError instanceof Error
                        ? addError.message
                        : 'Failed to add network');
                }
            }
            else {
                setError(switchError instanceof Error
                    ? switchError.message
                    : 'Failed to switch network');
            }
        }
        finally {
            setSwitching(null);
        }
    }, [client, networks, onNetworkChange]);
    const currentNetwork = networks.find((n) => n.chainId === currentChainId);
    return (_jsxs("div", { style: { position: 'relative' }, children: [_jsxs("button", { onClick: () => setOpen(!open), style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 14px',
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#1e293b',
                }, children: [currentNetwork ? (_jsxs(_Fragment, { children: [_jsx("span", { children: currentNetwork.icon }), _jsx("span", { children: currentNetwork.name })] })) : (_jsx("span", { style: { color: '#94a3b8' }, children: "Select Network" })), _jsx("span", { style: { fontSize: 10, marginLeft: 4 }, children: "\u25BC" })] }), open && (_jsxs(_Fragment, { children: [_jsx("div", { onClick: () => setOpen(false), style: {
                            position: 'fixed',
                            inset: 0,
                            zIndex: 99,
                        } }), _jsx("div", { style: {
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            left: 0,
                            zIndex: 100,
                            background: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: 12,
                            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                            minWidth: 220,
                            maxHeight: 320,
                            overflowY: 'auto',
                            padding: 4,
                        }, children: networks.map((network) => {
                            const isCurrent = network.chainId === currentChainId;
                            const isSwitching = switching === network.chainId;
                            return (_jsxs("button", { onClick: () => handleSelect(network.chainId), disabled: isSwitching, style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    width: '100%',
                                    padding: '10px 12px',
                                    background: isCurrent ? '#eff6ff' : 'transparent',
                                    border: 'none',
                                    borderRadius: 8,
                                    cursor: isSwitching ? 'not-allowed' : 'pointer',
                                    fontSize: 14,
                                    color: isCurrent ? '#2563eb' : '#1e293b',
                                    fontWeight: isCurrent ? 600 : 400,
                                    textAlign: 'left',
                                }, children: [_jsx("span", { children: network.icon }), _jsx("span", { style: { flex: 1 }, children: network.name }), isSwitching && (_jsx("span", { style: { fontSize: 12, color: '#64748b' }, children: "Switching..." })), isCurrent && !isSwitching && (_jsx("span", { style: { color: '#22c55e', fontWeight: 700 }, children: "\u2713" }))] }, network.chainId));
                        }) })] })), error && (_jsx("div", { style: {
                    marginTop: 8,
                    padding: '8px 12px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 8,
                    color: '#dc2626',
                    fontSize: 12,
                }, children: error }))] }));
}
//# sourceMappingURL=HeadlessNetworkSelector.js.map