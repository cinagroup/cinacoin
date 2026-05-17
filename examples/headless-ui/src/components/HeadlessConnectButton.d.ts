import { type HeadlessClient } from '@cinaconnect/config';
interface ConnectButtonProps {
    client: HeadlessClient;
    onConnected?: (account: string) => void;
}
/**
 * HeadlessConnectButton — a completely custom connect button.
 *
 * Uses only the headless client API (`@cinaconnect/config`) with zero
 * built-in UI. You control every pixel of the experience.
 *
 * @example
 * ```tsx
 * const client = createHeadlessClient({ projectId: 'your-project-id' })
 *
 * <HeadlessConnectButton
 *   client={client}
 *   onConnected={(account) => console.log('Connected:', account)}
 * />
 * ```
 */
export declare function HeadlessConnectButton({ client, onConnected, }: ConnectButtonProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=HeadlessConnectButton.d.ts.map