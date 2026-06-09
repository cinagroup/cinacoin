import { ConnectorConfig, ConnectionResult } from './types';

/**
 * Registry-based factory for managing custom wallet connectors.
 *
 * Provides a central place to register, retrieve, and manage connector
 * instances throughout the application lifecycle.
 */
export class ConnectorFactory {
  /** Internal map of connector id → ConnectorConfig */
  private static registry: Map<string, ConnectorConfig> = new Map();

  /**
   * Register a custom wallet connector.
   *
   * @param config - A fully-implemented ConnectorConfig instance
   * @throws Error if a connector with the same id is already registered
   */
  static registerConnector(config: ConnectorConfig): void {
    if (ConnectorFactory.registry.has(config.id)) {
      throw new Error(
        `Connector "${config.id}" is already registered. Use unregisterConnector first.`
      );
    }
    ConnectorFactory.registry.set(config.id, config);
  }

  /**
   * Retrieve a registered connector by its id.
   *
   * @param connectorId - The unique id of the connector
   * @returns The connector, or undefined if not found
   */
  static getConnector(connectorId: string): ConnectorConfig | undefined {
    return ConnectorFactory.registry.get(connectorId);
  }

  /**
   * List all registered connectors.
   *
   * @returns Array of all registered ConnectorConfig instances
   */
  static getAllConnectors(): ConnectorConfig[] {
    return Array.from(ConnectorFactory.registry.values());
  }

  /**
   * Remove a connector from the registry.
   *
   * @param connectorId - The id of the connector to remove
   * @returns true if the connector was found and removed, false otherwise
   */
  static unregisterConnector(connectorId: string): boolean {
    return ConnectorFactory.registry.delete(connectorId);
  }

  /**
   * Clear the entire registry. Useful for testing.
   */
  static clearAll(): void {
    ConnectorFactory.registry.clear();
  }
}
