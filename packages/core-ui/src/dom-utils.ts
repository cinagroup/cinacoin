/**
 * SSR-safe DOM utility helpers for @cinacoin/core-ui.
 *
 * All functions guard against missing `window` / `document` globals
 * so they can be called during SSR (Node.js) without throwing.
 *
 * @module dom-utils
 */

/**
 * Check whether code is running in a browser environment.
 *
 * @returns `true` when `window` and `document` are available.
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Safely access the global `document` object.
 *
 * @returns The `document` object in the browser, or `undefined` during SSR.
 */
export function getDocument(): Document | undefined {
  return typeof document !== 'undefined' ? document : undefined;
}

/**
 * Safely access the global `window` object.
 *
 * @returns The `window` object in the browser, or `undefined` during SSR.
 */
export function getWindow(): Window & typeof globalThis | undefined {
  return typeof window !== 'undefined' ? window : undefined;
}

/**
 * Safely add an event listener to `document`.
 * No-op during SSR.
 *
 * @param type - Event name (e.g. `'keydown'`, `'click'`).
 * @param listener - Event handler.
 * @param options - Optional `AddEventListenerOptions`.
 */
export function addDocumentListener<K extends keyof DocumentEventMap>(
  type: K,
  listener: (ev: DocumentEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions,
): void {
  const doc = getDocument();
  if (doc) {
    doc.addEventListener(type, listener as EventListener, options);
  }
}

/**
 * Safely remove an event listener from `document`.
 * No-op during SSR.
 *
 * @param type - Event name.
 * @param listener - Event handler to remove.
 * @param options - Optional `EventListenerOptions`.
 */
export function removeDocumentListener<K extends keyof DocumentEventMap>(
  type: K,
  listener: (ev: DocumentEventMap[K]) => void,
  options?: boolean | EventListenerOptions,
): void {
  const doc = getDocument();
  if (doc) {
    doc.removeEventListener(type, listener as EventListener, options);
  }
}

/**
 * Safely query a DOM element by selector.
 *
 * @param selector - CSS selector string.
 * @returns The matched `Element` or `null` (including during SSR).
 */
export function querySelector(selector: string): Element | null {
  const doc = getDocument();
  return doc ? doc.querySelector(selector) : null;
}

/**
 * Safely get the `navigator` object.
 *
 * @returns The `navigator` in the browser, or `undefined` during SSR.
 */
export function getNavigator(): Navigator | undefined {
  return typeof navigator !== 'undefined' ? navigator : undefined;
}

/**
 * Copy text to clipboard safely. No-op during SSR.
 *
 * @param text - Text to copy.
 * @returns A promise that resolves when the copy completes.
 */
export async function copyToClipboard(text: string): Promise<void> {
  const nav = getNavigator();
  if (nav?.clipboard) {
    await nav.clipboard.writeText(text);
  }
}

/**
 * Get the current scroll position safely.
 *
 * @returns `{ x, y }` scroll position, or `{ 0, 0 }` during SSR.
 */
export function getScrollPosition(): { x: number; y: number } {
  const win = getWindow();
  if (win) {
    return { x: win.scrollX, y: win.scrollY };
  }
  return { x: 0, y: 0 };
}

/**
 * Request animation frame with SSR fallback.
 * During SSR, the callback is invoked synchronously.
 *
 * @param callback - Function to call on the next animation frame.
 * @returns An ID that can be passed to `cancelAnimationFrameSafe`.
 */
export function requestAnimationFrameSafe(callback: FrameRequestCallback): number {
  const win = getWindow();
  if (win?.requestAnimationFrame) {
    return win.requestAnimationFrame(callback);
  }
  // SSR fallback: execute immediately
  callback(0);
  return 0;
}

/**
 * Cancel animation frame safely. No-op during SSR.
 *
 * @param id - The ID returned by `requestAnimationFrameSafe`.
 */
export function cancelAnimationFrameSafe(id: number): void {
  const win = getWindow();
  if (win?.cancelAnimationFrame) {
    win.cancelAnimationFrame(id);
  }
}
