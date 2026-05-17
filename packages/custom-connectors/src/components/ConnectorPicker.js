import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useCallback } from 'react';
import { ConnectorFactory } from '../ConnectorFactory';
/**
 * UI component that renders a list of available wallet connectors.
 *
 * Users click a connector to initiate connection. Shows loading state
 * during connection and connected state with disconnect button.
 *
 * @example
 * ```tsx
 * <ConnectorPicker
 *   onConnect={(result, connector) => {
 *     console.log(`Connected via ${connector.name}:`, result.accounts);
 *   }}
 *   onDisconnect={(connector) => {
 *     console.log(`Disconnected from ${connector.name}`);
 *   }}
 * />
 * ```
 */
export function ConnectorPicker({ onConnect, onError, onDisconnect, filterTypes, className, heading = 'Connect a wallet', }) {
    const [connectingId, setConnectingId] = useState(null);
    const [connectedId, setConnectedId] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [error, setError] = useState(null);
    // Get connectors from the factory, optionally filtered
    const connectors = React.useMemo(() => {
        const all = ConnectorFactory.getAllConnectors();
        if (filterTypes) {
            return all.filter((c) => filterTypes.includes(c.type));
        }
        return all;
    }, [filterTypes]);
    const handleConnect = useCallback(async (connector) => {
        setConnectingId(connector.id);
        setError(null);
        try {
            await connector.init();
            const result = await connector.connect();
            setConnectedId(connector.id);
            setAccounts(result.accounts);
            setConnectingId(null);
            onConnect?.(result, connector);
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error.message);
            setConnectingId(null);
            onError?.(error, connector);
        }
    }, [onConnect, onError]);
    const handleDisconnect = useCallback(async (connector) => {
        try {
            await connector.disconnect();
            setConnectedId(null);
            setAccounts([]);
            setError(null);
            onDisconnect?.(connector);
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error.message);
        }
    }, [onDisconnect]);
    const isConnected = (connector) => connectedId === connector.id;
    const isConnecting = (connector) => connectingId === connector.id;
    return (_jsxs("div", { className: className ?? 'connector-picker', children: [_jsx("h3", { className: "connector-picker__heading", children: heading }), error && _jsx("div", { className: "connector-picker__error", children: error }), connectors.length === 0 && (_jsx("p", { className: "connector-picker__empty", children: "No connectors registered. Use ConnectorFactory.registerConnector() to add one." })), _jsx("ul", { className: "connector-picker__list", children: connectors.map((connector) => {
                    const connected = isConnected(connector);
                    const connecting = isConnecting(connector);
                    const available = connector.isAvailable();
                    return (_jsx("li", { className: "connector-picker__item", children: connected ? (_jsxs("div", { className: "connector-picker__card connector-picker__card--connected", children: [_jsx("img", { src: connector.icon, alt: connector.name, className: "connector-picker__icon", width: 40, height: 40 }), _jsxs("div", { className: "connector-picker__info", children: [_jsx("span", { className: "connector-picker__name", children: connector.name }), _jsx("span", { className: "connector-picker__accounts", children: accounts.length > 0
                                                ? `${accounts[0].slice(0, 6)}…${accounts[0].slice(-4)}`
                                                : 'Connected' })] }), _jsx("button", { className: "connector-picker__btn connector-picker__btn--disconnect", onClick: () => handleDisconnect(connector), type: "button", children: "Disconnect" })] })) : (_jsxs("button", { className: "connector-picker__card connector-picker__card--selectable", onClick: () => handleConnect(connector), disabled: connecting || !available, type: "button", children: [_jsx("img", { src: connector.icon, alt: connector.name, className: "connector-picker__icon", width: 40, height: 40 }), _jsxs("div", { className: "connector-picker__info", children: [_jsx("span", { className: "connector-picker__name", children: connector.name }), !available && (_jsx("span", { className: "connector-picker__unavailable", children: "Not available" }))] }), connecting && (_jsx("span", { className: "connector-picker__spinner", "aria-label": "Connecting", children: "\u23F3" }))] })) }, connector.id));
                }) })] }));
}
//# sourceMappingURL=ConnectorPicker.js.map