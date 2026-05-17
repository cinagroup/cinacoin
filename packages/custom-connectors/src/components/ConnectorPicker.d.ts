import type { ConnectorConfig, ConnectionResult } from '../types';
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
export declare function ConnectorPicker({ onConnect, onError, onDisconnect, filterTypes, className, heading, }: ConnectorPickerProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ConnectorPicker.d.ts.map