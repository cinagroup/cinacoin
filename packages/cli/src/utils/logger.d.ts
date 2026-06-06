/** Log a success message with a green checkmark. */
export declare function success(message: string): void;
/** Log an error message with a red cross. */
export declare function error(message: string): void;
/** Log a warning with a yellow triangle. */
export declare function warn(message: string): void;
/** Log an info message with a cyan bullet. */
export declare function info(message: string): void;
/** Log a debug message in gray. */
export declare function debug(message: string): void;
/** Log a bold header. */
export declare function header(text: string): void;
/**
 * Simple spinner implementation (no ora dependency required).
 * Returns an object with succeed/fail methods.
 */
export declare function spinner(message: string): {
    succeed: (msg?: string) => void;
    fail: (msg?: string) => void;
    warn: (msg?: string) => void;
};
//# sourceMappingURL=logger.d.ts.map