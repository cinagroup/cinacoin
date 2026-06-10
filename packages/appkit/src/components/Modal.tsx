/**
 * Modal component — the main dialog container
 * Renders a centered modal on desktop, bottom sheet on mobile
 */

import React, { useEffect, useRef, useCallback } from 'react';
import type { ModalProps } from '../types';

// ============================================================================
// Styles
// ============================================================================

const styles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    opacity: 0,
    transition: 'opacity 0.2s ease',
    pointerEvents: 'none' as const,
  },
  overlayOpen: {
    opacity: 1,
    pointerEvents: 'auto' as const,
  },
  modal: {
    position: 'relative' as const,
    backgroundColor: 'var(--cc-canvas, #ffffff)',
    borderRadius: 'var(--cc-radius, 16px)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px var(--cc-border, rgba(0,0,0,0.08))',
    width: '100%',
    maxWidth: '380px',
    maxHeight: '85vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
    transform: 'translateY(20px) scale(0.95)',
    transition: 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
    fontFamily: 'var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
    color: 'var(--cc-ink, #1a1a2e)',
  },
  modalOpen: {
    transform: 'translateY(0) scale(1)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 20px 0 20px',
  },
  title: {
    fontSize: 'var(--text-body-lg)',
    fontWeight: "var(--weight-semibold)",
    margin: 0,
    color: 'var(--cc-ink, #1a1a2e)',
  },
  closeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'var(--cc-surface, #f5f5f5)',
    cursor: 'pointer',
    color: 'var(--cc-ink, #1a1a2e)',
    fontSize: 'var(--text-body-lg)',
    transition: 'background-color 0.15s ease',
    padding: 0,
  },
  body: {
    padding: '16px 20px 20px 20px',
    overflowY: 'auto' as const,
    flex: 1,
  },
} as const;

// ============================================================================
// Mobile Bottom Sheet Styles
// ============================================================================

const mobileStyles = {
  overlay: {
    ...styles.overlay,
    alignItems: 'flex-end',
  },
  modal: {
    ...styles.modal,
    maxWidth: '100%',
    maxHeight: '80vh',
    borderRadius: 'var(--cc-radius, 16px) var(--cc-radius, 16px) 0 0',
    transform: 'translateY(100%)',
  },
  modalOpen: {
    transform: 'translateY(0)',
  },
  handle: {
    width: '36px',
    height: '4px',
    borderRadius: '2px',
    backgroundColor: 'var(--cc-border, rgba(0,0,0,0.15))',
    margin: '8px auto 0',
  },
} as const;

// ============================================================================
// Component
// ============================================================================

/**
 * Modal container component
 * Automatically switches between centered modal (desktop) and bottom sheet (mobile)
 */
export function Modal({
  isOpen,
  onClose,
  title = 'Connect Wallet',
  children,
  themeMode = 'auto',
  themeVariables,
}: ModalProps): React.ReactElement {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = React.useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 480);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle overlay click
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  // Apply theme
  const resolvedTheme =
    themeMode === 'auto'
      ? typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : themeMode;

  const themeVars: React.CSSProperties = {
    ...themeVariables,
    ...(resolvedTheme === 'dark'
      ? {
          '--cc-canvas': '#1a1a2e',
          '--cc-ink': '#e8e8f0',
          '--cc-surface': '#2a2a3e',
          '--cc-border': 'rgba(255,255,255,0.1)',
        }
      : {}),
  } as React.CSSProperties;

  const currentStyles = isMobile ? mobileStyles : styles;

  return (
    <div
      style={{
        ...currentStyles.overlay,
        ...(isOpen ? (isMobile ? { opacity: 1, pointerEvents: 'auto' as const } : styles.overlayOpen) : {}),
      }}
      onClick={handleOverlayClick}
      data-theme={resolvedTheme}
    >
      <div
        ref={modalRef}
        style={{
          ...currentStyles.modal,
          ...(isOpen ? currentStyles.modalOpen : {}),
          ...themeVars,
        }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Mobile drag handle */}
        {isMobile && <div style={mobileStyles.handle} />}

        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>{title}</h2>
          <button
            style={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={styles.body}>{children}</div>
      </div>
    </div>
  );
}

export default Modal;
