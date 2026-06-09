import { useCallback, useState, useEffect } from 'react';
import { ConnectorFactory } from '../ConnectorFactory';
import type { ConnectorConfig } from '../types';

/**
 * React hook that provides access to the ConnectorFactory registry.
 *
 * Returns reactive state and helpers for managing wallet connectors.
 *
 * @example
 * ```tsx
 * const { connectors, registerConnector, getConnector } = useConnectors();
 *
 * useEffect(() => {
 *   registerConnector(myCustomConnector);
 * }, []);
 *
 * const handleConnect = async () => {
 *   const connector = getConnector('injected');
 *   if (connector) {
 *     await connector.connect();
 *   }
 * };
 * ```
 */
export function useConnectors() {
  const [connectors, setConnectors] = useState<ConnectorConfig[]>(() =>
    ConnectorFactory.getAllConnectors()
  );

  // Keep local state in sync with the factory
  useEffect(() => {
    setConnectors(ConnectorFactory.getAllConnectors());
  }, []);

  const registerConnector = useCallback((config: ConnectorConfig) => {
    ConnectorFactory.registerConnector(config);
    setConnectors(ConnectorFactory.getAllConnectors());
  }, []);

  const getConnector = useCallback((connectorId: string): ConnectorConfig | undefined => {
    return ConnectorFactory.getConnector(connectorId);
  }, []);

  const getAllConnectors = useCallback((): ConnectorConfig[] => {
    return ConnectorFactory.getAllConnectors();
  }, []);

  const unregisterConnector = useCallback((connectorId: string) => {
    ConnectorFactory.unregisterConnector(connectorId);
    setConnectors(ConnectorFactory.getAllConnectors());
  }, []);

  return {
    /** All registered connectors (reactive) */
    connectors,
    /** Register a new connector and update state */
    registerConnector,
    /** Get a single connector by id */
    getConnector,
    /** Get fresh snapshot of all connectors */
    getAllConnectors,
    /** Unregister a connector and update state */
    unregisterConnector,
  };
}
