/**
 * ConnectButton Web Component (i18n-enabled)
 *
 * Primary entry-point button for wallet connection. Shows connect prompt when
 * disconnected, and address + balance when connected.
 *
 * Attributes:
 *   - variant: 'primary' | 'secondary' | 'ghost'
 *   - size: 'sm' | 'md' | 'lg'
 *   - label: text shown when disconnected (falls back to t('connect_wallet'))
 *   - show-balance: whether to display balance
 *   - show-avatar: whether to show avatar icon
 *   - show-network: whether to show network badge
 *
 * Properties (set via JS):
 *   - address: connected wallet address
 *   - balance: account balance string
 *   - chainSymbol: native currency symbol (e.g. "ETH")
 *   - state: 'disconnected' | 'connecting' | 'connected' | 'wrong_network' | 'error'
 *
 * Events:
 *   - ocx-click: fired when button is clicked
 *   - ocx-disconnect: fired when disconnect action is triggered
 */
export type ConnectButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ConnectButtonSize = 'sm' | 'md' | 'lg';
export type ConnectButtonState = 'disconnected' | 'connecting' | 'connected' | 'wrong_network' | 'error';
declare const ConnectButton_base: any;
export declare class ConnectButton extends ConnectButton_base {
    static get styles(): any[];
    variant: ConnectButtonVariant;
    size: ConnectButtonSize;
    label: string;
    showBalance: boolean;
    showAvatar: boolean;
    showNetwork: boolean;
    address: string;
    balance: string;
    chainSymbol: string;
    state: ConnectButtonState;
    chainId: number | null;
    private _menuOpen;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private _onClick;
    private _onKeydown;
    private _handleDisconnect;
    render(): import("lit").TemplateResult<1>;
    private _renderContent;
    private _renderDropdown;
    private _getAriaLabel;
}
declare global {
    interface HTMLElementTagNameMap {
        'ocx-connect-button': ConnectButton;
    }
}
export {};
//# sourceMappingURL=connect-button.d.ts.map