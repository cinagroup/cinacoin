/**
 * CDN global configuration via window.CinaConnect.
 *
 * Users can set configuration before loading the CDN bundle:
 *
 * ```html
 * <script>
 *   window.CinaConnect = {
 *     projectId: 'your-project-id',
 *     theme: 'dark',
 *     primaryColor: '#6366F1',
 *     chains: [1, 10, 137],
 *   };
 * </script>
 * <script src="https://cdn.cinaconnect.dev/connect.js"></script>
 * ```
 */
/**
 * Default configuration values.
 */
const DEFAULT_CONFIG = {
    theme: "light",
    chains: [1],
    showRecent: true,
};
/**
 * Get the merged configuration from window.CinaConnect.
 * Falls back to defaults for any missing values.
 */
export function getConfig() {
    const userConfig = typeof window !== "undefined" ? window.CinaConnect : undefined;
    return {
        ...DEFAULT_CONFIG,
        ...userConfig,
    };
}
/**
 * Validate that required configuration is present.
 * Returns a list of missing keys.
 */
export function validateConfig(config) {
    const missing = [];
    if (!config.projectId) {
        missing.push("projectId");
    }
    return missing;
}
//# sourceMappingURL=config.js.map