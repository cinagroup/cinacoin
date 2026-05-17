/**
 * Registry-based factory for managing custom wallet connectors.
 *
 * Provides a central place to register, retrieve, and manage connector
 * instances throughout the application lifecycle.
 */
export class ConnectorFactory {
    /**
     * Register a custom wallet connector.
     *
     * @param config - A fully-implemented ConnectorConfig instance
     * @throws Error if a connector with the same id is already registered
     */
    static registerConnector(config) {
        if (ConnectorFactory.registry.has(config.id)) {
            throw new Error(`Connector "${config.id}" is already registered. Use unregisterConnector first.`);
        }
        ConnectorFactory.registry.set(config.id, config);
    }
    /**
     * Retrieve a registered connector by its id.
     *
     * @param connectorId - The unique id of the connector
     * @returns The connector, or undefined if not found
     */
    static getConnector(connectorId) {
        return ConnectorFactory.registry.get(connectorId);
    }
    /**
     * List all registered connectors.
     *
     * @returns Array of all registered ConnectorConfig instances
     */
    static getAllConnectors() {
        return Array.from(ConnectorFactory.registry.values());
    }
    /**
     * Remove a connector from the registry.
     *
     * @param connectorId - The id of the connector to remove
     * @returns true if the connector was found and removed, false otherwise
     */
    static unregisterConnector(connectorId) {
        return ConnectorFactory.registry.delete(connectorId);
    }
    /**
     * Clear the entire registry. Useful for testing.
     */
    static clearAll() {
        ConnectorFactory.registry.clear();
    }
}
/** Internal map of connector id → ConnectorConfig */
ConnectorFactory.registry = new Map();
//# sourceMappingURL=ConnectorFactory.js.map