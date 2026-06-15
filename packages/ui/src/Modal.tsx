import React, { useEffect, useRef, useState, type ReactNode, type CSSProperties, type JSX } from 'react';

/** Props for the Modal component. */
export interface ModalProps {
  /** Whether the modal is open. */
  isOpen: boolean;
  /** Close callback. */
  onClose: () => void;
  /** Modal title (used for aria-labelledby). */
  title?: string;
  /** Modal content. */
  children: ReactNode;
  /** CSS class name. */
  className?: string;
  /** Inline styles. */
  style?: CSSProperties;
  /** Whether to close on overlay click (default: true). */
  closeOnOverlayClick?: boolean;
  /** Whether to close on Escape key (default: true). */
  closeOnEscape?: boolean;
}

/**
 * Modal — accessible modal dialog component with ARIA attributes.
 *
 * Features:
 * - `role="dialog"` and `aria-modal="true"` for screen readers
 * - `aria-labelledby` pointing to the title element
 * - Focus trap (basic implementation)
 * - Escape key to close
 * - Overlay click to close
 *
 * @example
 * ```tsx
 * <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Connect Wallet">
 *   <p>Modal content here</p>
 * </Modal>
 * ```
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
  style,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: ModalProps): JSX.Element | null {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = title ? `modal-title-${Math.random().toString(36).slice(2, 9)}` : undefined;
  
  // SSR hydration fix: delay rendering until client-side
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape || !isMounted) return;

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [isOpen, onClose, closeOnEscape, isMounted]);

  // Focus management: focus the modal when it opens
  useEffect(() => {
    if (isOpen && modalRef.current && isMounted) {
      modalRef.current.focus();
    }
  }, [isOpen, isMounted]);

  // Don't render during SSR or if not open
  if (!isMounted || !isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={`modal-overlay ${className || ''}`}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        ...style,
      }}
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="modal-content"
        style={{
          background: '#0F172A',
          borderRadius: '1.5rem',
          boxShadow: '0 10px 15px rgba(0, 0, 0, 0.3)',
          width: '100%',
          maxWidth: '420px',
          maxHeight: '80vh',
          overflowY: 'auto',
          position: 'relative',
          outline: 'none',
        }}
      >
        {title && (
          <div
            className="modal-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.5rem',
              borderBottom: '1px solid #334155',
            }}
          >
            <h2
              id={titleId}
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#f8fafc',
              }}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                fontSize: '1.125rem',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        )}
        <div className="modal-body" style={{ padding: '1.5rem' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
