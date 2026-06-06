/**
 * NetworkBadge Web Component
 *
 * Small pill showing the current network name and icon.
 *
 * Properties:
 *   - name: network name (e.g., "Ethereum")
 *   - iconUrl: optional icon URL
 *
 * Usage: <ocx-network-badge name="Ethereum"></ocx-network-badge>
 */
import { BaseLitElement } from '../foundation/base-element.js';
export declare class NetworkBadge extends BaseLitElement {
    static get styles(): import("lit").CSSResult[];
    name: string;
    iconUrl: string;
    render(): import("lit").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'ocx-network-badge': NetworkBadge;
    }
}
//# sourceMappingURL=network-badge.d.ts.map