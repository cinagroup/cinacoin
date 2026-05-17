import { InjectionToken } from '@angular/core';
import type { Chain, AppMetadata, Connector } from '@cinaconnect/core-sdk';
/**
 * Configuration options for CinaConnectModule.forRoot().
 */
export interface CinaConnectAngularConfig {
    /** Project ID for relay connection. */
    projectId: string;
    /** Chains to support. */
    chains?: Chain[];
    /** dApp metadata for wallet pairing. */
    metadata?: AppMetadata;
    /** Relay server URL override. */
    relayUrl?: string;
    /** Custom connector instance. */
    connector?: Connector;
    /** Enable debug logging. */
    debug?: boolean;
}
/**
 * Injection token for CinaConnect configuration options.
 *
 * Provided via `CinaConnectModule.forRoot()`.
 *
 * ```ts
 * {
 *   provide: CINA_CONNECT_OPTIONS,
 *   useValue: { projectId: 'YOUR_PROJECT_ID', chains: [...] }
 * }
 * ```
 */
export declare const CINA_CONNECT_OPTIONS: InjectionToken<CinaConnectAngularConfig>;
/**
 * Injection token for the CinaConnect SDK Connector instance.
 *
 * Created internally from `CINA_CONNECT_OPTIONS` and provided at the root level.
 */
export declare const CINA_CONNECT_INSTANCE: InjectionToken<Connector>;
//# sourceMappingURL=cinaconnect.tokens.d.ts.map