import React, { useState, useCallback, type ChangeEvent } from 'react';
import type { KycStatus } from '../types.js';

/* ── types ─────────────────────────────────────────────────────── */

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

/** Progress stage for the KYC flow. */
type Stage = 'upload' | 'submitted' | 'under_review' | 'verified' | 'rejected';

/* ── helper ────────────────────────────────────────────────────── */

const STATUS_LABELS: Record<Stage, string> = {
  upload: 'Upload Documents',
  submitted: 'Submitted',
  under_review: 'Under Review',
  verified: 'Verified ✅',
  rejected: 'Rejected ❌',
};

const STATUS_COLORS: Record<Stage, string> = {
  upload: '#6b7280',
  submitted: '#3b82f6',
  under_review: '#f59e0b',
  verified: '#22c55e',
  rejected: '#ef4444',
};

/* ── component ─────────────────────────────────────────────────── */

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
export function KycModal({
  open,
  onClose,
  userId,
  onSubmit,
  currentStatus,
}: KycModalProps): React.ReactElement | null {
  const [stage, setStage] = useState<Stage>(
    currentStatus === 'verified'
      ? 'verified'
      : currentStatus === 'rejected'
        ? 'rejected'
        : currentStatus === 'flagged'
          ? 'under_review'
          : currentStatus === 'pending'
            ? 'submitted'
            : 'upload',
  );

  // Uploaded files
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [proof, setProof] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);

  const handleFile = useCallback(
    (setter: React.Dispatch<React.SetStateAction<File | null>>) =>
      (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setter(file);
      },
    [],
  );

  const handleSubmit = useCallback(() => {
    const payload: KycSubmissionPayload = {
      userId,
      idDocumentFront: idFront ?? undefined,
      idDocumentBack: idBack ?? undefined,
      proofOfAddress: proof ?? undefined,
      selfie: selfie ?? undefined,
    };
    onSubmit(payload);
    setStage('submitted');
  }, [userId, idFront, idBack, proof, selfie, onSubmit]);

  const allRequired = idFront && proof; // Minimum: ID front + proof of address

  if (!open) return null;

  /* ── render stages ─────────────────────────────────────────── */

  if (stage === 'verified' || stage === 'rejected') {
    return (
      <ModalShell title="KYC Status" onClose={onClose}>
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div
            style={{
              fontSize: '48px',
              marginBottom: '12px',
              color: STATUS_COLORS[stage],
            }}
          >
            {stage === 'verified' ? '✅' : '❌'}
          </div>
          <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
            {STATUS_LABELS[stage]}
          </p>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>
            {stage === 'verified'
              ? 'Your identity has been verified. You can transact freely.'
              : 'Verification was not successful. Please contact support for next steps.'}
          </p>
        </div>
      </ModalShell>
    );
  }

  if (stage === 'submitted' || stage === 'under_review') {
    return (
      <ModalShell title="KYC Status" onClose={onClose}>
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div
            style={{
              fontSize: '48px',
              marginBottom: '12px',
              color: STATUS_COLORS[stage],
            }}
          >
            {stage === 'submitted' ? '📤' : '🔍'}
          </div>
          <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
            {STATUS_LABELS[stage]}
          </p>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>
            {stage === 'submitted'
              ? 'Documents submitted successfully. We will review them shortly.'
              : 'Your documents are under review. This typically takes 1–3 business days.'}
          </p>
        </div>
      </ModalShell>
    );
  }

  /* ── Upload stage ──────────────────────────────────────────── */

  return (
    <ModalShell title="KYC Verification" onClose={onClose}>
      <div style={{ padding: '16px 0' }}>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
          Please upload the documents below to verify your identity. We partner
          with SumSub / Onfido to process your verification securely.
        </p>

        {/* Status tracker */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
          {(['upload', 'submitted', 'under_review', 'verified'] as Stage[]).map((s, i) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                background: i === 0 ? STATUS_COLORS.upload : '#e5e7eb',
              }}
            />
          ))}
        </div>

        {/* File inputs */}
        <FileField
          label="ID Document (Front) *"
          file={idFront}
          onChange={handleFile(setIdFront)}
          accept="image/*,.pdf"
        />
        <FileField
          label="ID Document (Back)"
          file={idBack}
          onChange={handleFile(setIdBack)}
          accept="image/*,.pdf"
        />
        <FileField
          label="Proof of Address *"
          file={proof}
          onChange={handleFile(setProof)}
          accept="image/*,.pdf"
        />
        <FileField
          label="Selfie / Liveness Photo"
          file={selfie}
          onChange={handleFile(setSelfie)}
          accept="image/*"
        />

        {/* Submit button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allRequired}
          style={{
            marginTop: '20px',
            width: '100%',
            padding: '10px',
            background: allRequired ? '#3b82f6' : '#9ca3af',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: allRequired ? 'pointer' : 'not-allowed',
          }}
        >
          Submit for Verification
        </button>

        <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '12px', textAlign: 'center' }}>
          Powered by SumSub / Onfido. Your data is encrypted and processed in compliance with GDPR.
        </p>
      </div>
    </ModalShell>
  );
}

/* ── sub-components ────────────────────────────────────────────── */

interface ModalShellProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function ModalShell({ title, onClose, children }: ModalShellProps): React.ReactElement {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '12px',
          width: 'min(480px, 90vw)',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#6b7280',
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: '0 20px 20px' }}>{children}</div>
      </div>
    </div>
  );
}

interface FileFieldProps {
  label: string;
  file: File | null;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  accept: string;
}

function FileField({ label, file, onChange, accept }: FileFieldProps): React.ReactElement {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
        {label}
      </label>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 12px',
          border: '1px dashed #d1d5db',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '13px',
          color: file ? '#111827' : '#6b7280',
          background: file ? '#f0fdf4' : '#f9fafb',
        }}
      >
        <span>{file ? `📎 ${file.name}` : '📁 Choose file…'}</span>
        <input type="file" accept={accept} onChange={onChange} style={{ display: 'none' }} />
      </label>
    </div>
  );
}
