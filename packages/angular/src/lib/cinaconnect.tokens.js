import { InjectionToken } from '@angular/core';
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
export const CINA_CONNECT_OPTIONS = new InjectionToken('CINA_CONNECT_OPTIONS');
/**
 * Injection token for the CinaConnect SDK Connector instance.
 *
 * Created internally from `CINA_CONNECT_OPTIONS` and provided at the root level.
 */
export const CINA_CONNECT_INSTANCE = new InjectionToken('CINA_CONNECT_INSTANCE');
//# sourceMappingURL=cinaconnect.tokens.js.map