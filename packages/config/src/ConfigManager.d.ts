/**
 * Remote configuration options for initializing the feature flag system.
 */
export interface RemoteConfig {
    /** Project identifier used to fetch remote feature flags. */
    projectId: string;
    /** Polling interval in milliseconds. Defaults to 300000 (5 min). */
    pollingInterval?: number;
    /** Fallback flag values used when the remote endpoint is unreachable. */
    fallback?: Record<string, boolean>;
}
/**
 * Built-in feature flags available in the system.
 * Additional flags can be defined at runtime via the `[key: string]` index.
 */
export interface FeatureFlags {
    headless: boolean;
    analytics_enabled: boolean;
    swap_enabled: boolean;
    onramp_enabled: boolean;
    smart_accounts_enabled: boolean;
    social_login_enabled: boolean;
    [key: string]: boolean;
}
/**
 * Callback signature for feature flag change listeners.
 */
export type FeatureChangeCallback = (flag: string, value: boolean) => void;
/**
 * **ConfigManager** — Central manager for remote feature flags.
 *
 * Handles fetching, caching, polling, and change notifications for
 * feature flags tied to a project.  Falls back to local defaults when
 * the remote endpoint is unavailable.
 *
 * @example
 * ```ts
 * const config = ConfigManager.create({ projectId: "proj_abc123" });
 * await config.init();
 *
 * if (config.getFeature("swap_enabled")) {
 *   // show swap UI
 * }
 *
 * config.onFeatureChange("swap_enabled", (flag, value) => {
 *   console.log(`${flag} is now ${value}`);
 * });
 * ```
 */
export declare class ConfigManager {
    /** @internal */
    private config;
    /** Current merged feature flags. */
    private features;
    /** Flag-specific listener maps: flag → set of callbacks. */
    private listeners;
    /** Active AbortController for the polling loop. */
    private abortController;
    /** Whether `init()` has completed. */
    private initialized;
    private constructor();
    /**
     * Create a new ConfigManager instance.
     *
     * @param config - Remote configuration options.
     * @returns A new (uninitialized) ConfigManager.
     */
    static create(config: RemoteConfig): ConfigManager;
    /**
     * Initialize the manager by fetching remote feature flags and
     * starting the background polling loop.
     *
     * Safe to call multiple times — subsequent calls are no-ops.
     */
    init(): Promise<void>;
    /**
     * Stop the background polling loop.  Existing flag values remain
     * available through `getFeature()` / `getAllFeatures()`.
     */
    destroy(): void;
    /**
     * Get the current value of a single feature flag.
     *
     * @param flag - Flag key (e.g. `"swap_enabled"`).
     * @returns The boolean value of the flag.  Returns `false` for
     *          unknown flags.
     */
    getFeature(flag: string): boolean;
    /**
     * Return a snapshot of all active feature flags.
     *
     * @returns A shallow copy of the current flags.
     */
    getAllFeatures(): Readonly<FeatureFlags>;
    /**
     * Subscribe to changes on a specific feature flag.
     *
     * The callback is invoked immediately if the flag already has a value.
     *
     * @param flag - Flag key to watch.
     * @param callback - Called with `(flag, newValue)` on every change.
     * @returns An unsubscribe function.
     */
    onFeatureChange(flag: string, callback: FeatureChangeCallback): () => void;
    /** Fetch remote flags and merge them over local defaults. */
    private fetchRemoteFlags;
    /** Start the periodic polling loop. */
    private startPolling;
    /** Notify listeners whose flags changed between two snapshots. */
    private notifyChanges;
}
export type { ConfigManager as ConfigManagerInterface };
//# sourceMappingURL=ConfigManager.d.ts.map