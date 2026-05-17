import React, { useState, useCallback } from 'react';
import type { ConnectorConfig, ConnectionResult } from '../types';
import { ConnectorFactory } from '../ConnectorFactory';

/**
 * Props for the ConnectorPicker component.
 */
export interface ConnectorPickerProps {
  /** Called after a successful connection */
  onConnect?: (result: ConnectionResult, connector: ConnectorConfig) => void;
  /** Called if connection fails */
  onError?: (error: Error, connector: ConnectorConfig) => void;
  /** Called when user disconnects */
  onDisconnect?: (connector: ConnectorConfig) => void;
  /** Optional filter to only show certain connector types */
  filterTypes?: Array<'injected' | 'qr' | 'walletconnect' | 'custom'>;
  /** Custom CSS class for the container */
  className?: string;
  /** Custom label for the heading */
  heading?: string;
}

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
export function ConnectorPicker({
  onConnect,
  onError,
  onDisconnect,
  filterTypes,
  className,
  heading = 'Connect a wallet',
}: ConnectorPickerProps) {
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectedId, setConnectedId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Get connectors from the factory, optionally filtered
  const connectors = React.useMemo(() => {
    const all = ConnectorFactory.getAllConnectors();
    if (filterTypes) {
      return all.filter((c) => filterTypes.includes(c.type));
    }
    return all;
  }, [filterTypes]);

  const handleConnect = useCallback(
    async (connector: ConnectorConfig) => {
      setConnectingId(connector.id);
      setError(null);

      try {
        await connector.init();
        const result = await connector.connect();

        setConnectedId(connector.id);
        setAccounts(result.accounts);
        setConnectingId(null);

        onConnect?.(result, connector);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error.message);
        setConnectingId(null);
        onError?.(error, connector);
      }
    },
    [onConnect, onError]
  );

  const handleDisconnect = useCallback(
    async (connector: ConnectorConfig) => {
      try {
        await connector.disconnect();
        setConnectedId(null);
        setAccounts([]);
        setError(null);
        onDisconnect?.(connector);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error.message);
      }
    },
    [onDisconnect]
  );

  const isConnected = (connector: ConnectorConfig): boolean =>
    connectedId === connector.id;

  const isConnecting = (connector: ConnectorConfig): boolean =>
    connectingId === connector.id;

  return (
    <div className={className ?? 'connector-picker'}>
      <h3 className="connector-picker__heading">{heading}</h3>

      {error && <div className="connector-picker__error">{error}</div>}

      {connectors.length === 0 && (
        <p className="connector-picker__empty">
          No connectors registered. Use ConnectorFactory.registerConnector() to
          add one.
        </p>
      )}

      <ul className="connector-picker__list">
        {connectors.map((connector) => {
          const connected = isConnected(connector);
          const connecting = isConnecting(connector);
          const available = connector.isAvailable();

          return (
            <li key={connector.id} className="connector-picker__item">
              {connected ? (
                <div className="connector-picker__card connector-picker__card--connected">
                  <img
                    src={connector.icon}
                    alt={connector.name}
                    className="connector-picker__icon"
                    width={40}
                    height={40}
                  />
                  <div className="connector-picker__info">
                    <span className="connector-picker__name">
                      {connector.name}
                    </span>
                    <span className="connector-picker__accounts">
                      {accounts.length > 0
                        ? `${accounts[0].slice(0, 6)}…${accounts[0].slice(-4)}`
                        : 'Connected'}
                    </span>
                  </div>
                  <button
                    className="connector-picker__btn connector-picker__btn--disconnect"
                    onClick={() => handleDisconnect(connector)}
                    type="button"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  className="connector-picker__card connector-picker__card--selectable"
                  onClick={() => handleConnect(connector)}
                  disabled={connecting || !available}
                  type="button"
                >
                  <img
                    src={connector.icon}
                    alt={connector.name}
                    className="connector-picker__icon"
                    width={40}
                    height={40}
                  />
                  <div className="connector-picker__info">
                    <span className="connector-picker__name">
                      {connector.name}
                    </span>
                    {!available && (
                      <span className="connector-picker__unavailable">
                        Not available
                      </span>
                    )}
                  </div>
                  {connecting && (
                    <span className="connector-picker__spinner" aria-label="Connecting">
                      ⏳
                    </span>
                  )}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
