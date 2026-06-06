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
export declare function useConnectors(): {
    /** All registered connectors (reactive) */
    connectors: ConnectorConfig[];
    /** Register a new connector and update state */
    registerConnector: (config: ConnectorConfig) => void;
    /** Get a single connector by id */
    getConnector: (connectorId: string) => ConnectorConfig | undefined;
    /** Get fresh snapshot of all connectors */
    getAllConnectors: () => ConnectorConfig[];
    /** Unregister a connector and update state */
    unregisterConnector: (connectorId: string) => void;
};
//# sourceMappingURL=useConnectors.d.ts.map