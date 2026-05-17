/**
 * TransactionToast Web Component (i18n-enabled)
 *
 * Toast notification for transaction status updates.
 *
 * Properties:
 *   - hash: transaction hash
 *   - chainId: chain ID
 *   - status: 'pending' | 'confirmed' | 'failed' | 'replaced'
 *   - confirmations: current confirmation count
 *   - targetConfirmations: required confirmations
 *   - autoDismiss: auto-dismiss timeout in ms (0 = no auto-dismiss)
 *   - explorerUrl: block explorer URL
 *
 * Events:
 *   - ocx-dismiss: fired when toast is dismissed
 *   - ocx-retry: fired when retry button is clicked (failed tx)
 *   - ocx-view-explorer: fired when view on explorer is clicked
 */
import { BaseLitElement } from '../foundation/base-element.js';
export type TxStatus = 'pending' | 'confirmed' | 'failed' | 'replaced';
export declare class TransactionToast extends BaseLitElement {
    static get styles(): import("lit").CSSResult[];
    hash: string;
    chainId: number;
    status: TxStatus;
    confirmations: number;
    targetConfirmations: number;
    autoDismiss: number;
    explorerUrl: string;
    private _progressWidth;
    private _dismissTimer;
    connectedCallback(): void;
    disconnectedCallback(): void;
    updated(changedProperties: Map<string, unknown>): void;
    private _startProgress;
    private _dismiss;
    private _retry;
    private _viewExplorer;
    render(): import("lit").TemplateResult<1>;
    private get _statusIcon();
    private get _statusTitle();
    private get _statusMessage();
}
declare global {
    interface HTMLElementTagNameMap {
        'ocx-transaction-toast': TransactionToast;
    }
}
//# sourceMappingURL=transaction-toast.d.ts.map