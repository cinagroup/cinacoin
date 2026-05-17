import type { PasskeyStorage } from './types.js';
/**
 * In-memory passkey storage implementation.
 * For production, replace with a persistent storage backend.
 */
export declare class MemoryStorage implements PasskeyStorage {
    private store;
    save(credential: import('./types.js').StoredPasskey): Promise<void>;
    load(id: string): Promise<import('./types.js').StoredPasskey | null>;
    list(): Promise<import('./types.js').StoredPasskey[]>;
    remove(id: string): Promise<boolean>;
    clear(): Promise<void>;
}
/**
 * localStorage-based passkey storage for browser environments.
 */
export declare class BrowserStorage implements PasskeyStorage {
    private prefix;
    constructor(prefix?: string);
    save(credential: import('./types.js').StoredPasskey): Promise<void>;
    load(id: string): Promise<import('./types.js').StoredPasskey | null>;
    list(): Promise<import('./types.js').StoredPasskey[]>;
    remove(id: string): Promise<boolean>;
    clear(): Promise<void>;
}
export declare const defaultStorage: MemoryStorage | BrowserStorage;
//# sourceMappingURL=storage.d.ts.map