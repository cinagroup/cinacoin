/**
 * Event system — typed EventEmitter for SDK events.
 *
 * Provides a lightweight, dependency-free event emitter supporting
 * synchronous event dispatch, one-time listeners, and listener cleanup.
 */

import type { EventHandler } from './types.js';
import { logger } from '@cinacoin/logger';

/**
 * Lightweight event emitter.
 *
 * Supports on/off/once/emit with typed event names. Each event can have
 * multiple listeners. Errors in individual handlers are caught and logged
 * without affecting other handlers or the emitting code.
 *
 * @example
 * ```ts
 * const emitter = new EventEmitter();
 * emitter.on('connect', (account) => logger.info('Connected:', account));
 * emitter.emit('connect', '0xabc...');
 * ```
 */
export class EventEmitter {
  private listeners: Map<string, Set<EventHandler>> = new Map();

  /**
   * Register an event handler. The handler will be called each time
   * the event is emitted.
   *
   * @param event - Event name to listen for.
   * @param handler - Callback invoked when the event is emitted.
   */
  on(event: string, handler: EventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  /**
   * Register a one-time event handler. The handler is automatically
   * removed after it fires once.
   *
   * @param event - Event name to listen for.
   * @param handler - Callback invoked on the next emission.
   */
  once(event: string, handler: EventHandler): void {
    const onceHandler: EventHandler = (...args: unknown[]) => {
      this.off(event, onceHandler);
      handler(...args);
    };
    this.on(event, onceHandler);
  }

  /**
   * Remove a previously registered event handler.
   *
   * @param event - Event name.
   * @param handler - Handler to remove.
   */
  off(event: string, handler: EventHandler): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emit an event, invoking all registered handlers.
   *
   * Errors in individual handlers are caught and logged to console.error
   * but do not prevent other handlers from running.
   *
   * @param event - Event name to emit.
   * @param args - Arguments passed to each handler.
   */
  emit(event: string, ...args: unknown[]): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(...args);
        } catch (err) {
          logger.error(`[core-sdk:EventEmitter] Event handler error for "${event}":`, err);
        }
      }
    }
  }

  /**
   * Remove all listeners for a specific event, or all events if none specified.
   *
   * @param event - Event name to clear. Omit to clear all events.
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get the number of registered listeners for an event.
   *
   * @param event - Event name.
   * @returns Number of listeners, or 0 if none registered.
   */
  listenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}
