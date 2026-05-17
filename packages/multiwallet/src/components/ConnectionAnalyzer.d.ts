/** Props for the ConnectionAnalyzer component. */
export interface ConnectionAnalyzerProps {
    /** Optional CSS class name for the root element. */
    className?: string;
    /** Whether to show detailed per-namespace breakdown. */
    showDetail?: boolean;
    /** Whether to show recommendations based on usage patterns. */
    showRecommendations?: boolean;
}
/**
 * React component that displays connection analytics: total connections,
 * usage patterns, wallet distribution, and smart recommendations.
 *
 * @example
 * ```tsx
 * <ConnectionAnalyzer showDetail showRecommendations />
 * ```
 */
export declare function ConnectionAnalyzer({ className, showDetail, showRecommendations, }: ConnectionAnalyzerProps): JSX.Element;
//# sourceMappingURL=ConnectionAnalyzer.d.ts.map