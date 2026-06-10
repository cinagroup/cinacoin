/**
 * CinacoinModal — imperative handle for opening/closing the AppKit modal
 *
 * This component does not render anything visible itself; it exposes
 * `open()` and `close()` methods via a ref or the `useCinacoinModal()` hook.
 */

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { useCinacoinAppKit } from './CinacoinProvider';

// ============================================================================
// Types
// ============================================================================

export interface CinacoinModalHandle {
  /** Open the connection modal */
  open: () => void;
  /** Close the connection modal */
  close: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Imperative modal controller.
 *
 * @example
 * ```tsx
 * const modalRef = useRef<CinacoinModalHandle>(null);
 *
 * <CinacoinModal ref={modalRef} />
 * <button onClick={() => modalRef.current?.open()}>Open</button>
 * ```
 */
export const CinacoinModal = forwardRef<CinacoinModalHandle>(function CinacoinModal(_props, ref) {
  const appkit = useCinacoinAppKit();
  const appkitRef = useRef(appkit);
  appkitRef.current = appkit;

  useImperativeHandle(
    ref,
    () => ({
      open: () => appkitRef.current.open(),
      close: () => appkitRef.current.close(),
    }),
    [],
  );

  // Nothing to render — this is a controller-only component
  return null;
});

// ============================================================================
// Hook alternative
// ============================================================================

/**
 * Hook that returns `open` and `close` functions for the AppKit modal.
 *
 * @example
 * ```tsx
 * const { open, close } = useCinacoinModal();
 * <button onClick={open}>Connect</button>
 * ```
 */
export function useCinacoinModal(): { open: () => void; close: () => void } {
  const appkit = useCinacoinAppKit();
  return {
    open: () => appkit.open(),
    close: () => appkit.close(),
  };
}
