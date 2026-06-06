/**
 * ChainSwitcher Web Component (i18n-enabled)
 *
 * Dropdown for switching between blockchain networks.
 *
 * Properties:
 *   - chains: ChainInfo[]
 *   - activeChainId: currently selected chain ID
 *
 * Events:
 *   - ocx-chain-change: fired when a chain is selected (detail: chainId)
 */
import { BaseLitElement } from '../foundation/base-element.js';
export interface ChainInfo {
    id: number;
    name: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    iconUrl?: string;
    blockExplorerUrl?: string;
    testnet?: boolean;
}
export declare class ChainSwitcher extends BaseLitElement {
    static get styles(): import("lit").CSSResult[];
    chains: ChainInfo[];
    activeChainId: number;
    private _open;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private _onOutsideClick;
    private _toggle;
    private _select;
    render(): import("lit").TemplateResult<1>;
    private _renderChainIcon;
}
declare global {
    interface HTMLElementTagNameMap {
        'ocx-chain-switcher': ChainSwitcher;
    }
}
//# sourceMappingURL=chain-switcher.d.ts.map