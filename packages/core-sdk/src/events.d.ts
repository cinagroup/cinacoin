/**
 * Event system — typed EventEmitter for SDK events.
 */
import type { EventHandler } from './types.js';
/**
 * Lightweight event emitter.
 *
 * Supports on/off/once/emit with typed event names.
 */
export declare class EventEmitter {
    private listeners;
    /**
     * Register an event handler.
     */
    on(event: string, handler: EventHandler): void;
    /**
     * Register a one-time event handler.
     */
    once(event: string, handler: EventHandler): void;
    /**
     * Remove an event handler.
     */
    off(event: string, handler: EventHandler): void;
    /**
     * Emit an event with arbitrary arguments.
     */
    emit(event: string, ...args: unknown[]): void;
    /**
     * Remove all listeners for an event (or all events if none specified).
     */
    removeAllListeners(event?: string): void;
    /**
     * Get the number of listeners for an event.
     */
    listenerCount(event: string): number;
}
//# sourceMappingURL=events.d.ts.map