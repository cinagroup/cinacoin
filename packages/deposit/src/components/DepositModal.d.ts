import React from "react";
import { DepositResult } from "../types";
export interface DepositModalProps {
    /** Whether the modal is visible. */
    isOpen: boolean;
    /** Called when the user closes the modal. */
    onClose: () => void;
    /** User's receiving address (optional). */
    receivingAddress?: string;
    /** Target network filter (optional). */
    networkFilter?: string;
    /** Callback when deposit is successfully initiated. */
    onDepositInitiated?: (result: DepositResult) => void;
}
/**
 * DepositModal — full deposit flow UI.
 *
 * Steps:
 * 1. Select exchange
 * 2. Select asset & network
 * 3. Enter amount
 * 4. Redirect to exchange
 * 5. Track status
 */
export declare const DepositModal: React.FC<DepositModalProps>;
//# sourceMappingURL=DepositModal.d.ts.map