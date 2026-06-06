import React from 'react';
import type { KycStatus } from '../types.js';
export interface KycModalProps {
    /** Whether the modal is visible. */
    open: boolean;
    /** Close callback. */
    onClose: () => void;
    /** User identifier (address or internal ID). */
    userId: string;
    /**
     * Submit handler — receives uploaded files and metadata.
     * In production, forward these to your KYC provider (SumSub, Onfido, etc.).
     */
    onSubmit: (payload: KycSubmissionPayload) => void;
    /** Optional current KYC status for display. */
    currentStatus?: KycStatus;
}
export interface KycSubmissionPayload {
    /** User identifier. */
    userId: string;
    /** ID document (front). */
    idDocumentFront?: File;
    /** ID document (back), if applicable. */
    idDocumentBack?: File;
    /** Proof of address (utility bill, bank statement). */
    proofOfAddress?: File;
    /** Selfie / liveness photo. */
    selfie?: File;
    /** Optional provider reference token. */
    providerToken?: string;
}
/**
 * KYC verification modal.
 *
 * Guides the user through document upload for identity verification.
 * Integrates with external KYC providers (SumSub, Onfido, Veriff).
 *
 * @example
 * ```tsx
 * <KycModal
 *   open={showKyc}
 *   onClose={() => setShowKyc(false)}
 *   userId={walletAddress}
 *   onSubmit={(payload) => sendToSumSub(payload)}
 * />
 * ```
 */
export declare function KycModal({ open, onClose, userId, onSubmit, currentStatus, }: KycModalProps): React.ReactElement | null;
//# sourceMappingURL=KycModal.d.ts.map