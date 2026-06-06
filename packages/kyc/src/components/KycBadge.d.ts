import React from 'react';
import type { ScreeningResult } from '../types.js';
export interface KycBadgeProps {
    /** Address to display and screen. */
    address: string;
    /** Override the status label if you already know it. */
    status?: ScreeningResult['riskLevel'];
    /** Whether to show the numeric risk score. */
    showScore?: boolean;
    /** Custom CSS class for the wrapper. */
    className?: string;
}
/**
 * Compliance status badge.
 *
 * Displays a colour-coded dot with the risk level.  Clicking opens a
 * detail popover showing the full screening result.
 */
export declare function KycBadge({ address, status: statusOverride, showScore, className, }: KycBadgeProps): React.ReactElement;
//# sourceMappingURL=KycBadge.d.ts.map