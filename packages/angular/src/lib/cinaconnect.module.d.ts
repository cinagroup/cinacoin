import { ModuleWithProviders } from '@angular/core';
import { type CinaConnectAngularConfig } from './cinaconnect.tokens.js';
/**
 * Angular module for CinaConnect.
 *
 * Use `CinaConnectModule.forRoot()` in your root `AppModule` to configure
 * the SDK with your project ID and chain list.
 *
 * ```ts
 * @NgModule({
 *   imports: [
 *     CinaConnectModule.forRoot({
 *       projectId: 'YOUR_PROJECT_ID',
 *       chains: [mainnet, arbitrum, base],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
export declare class CinaConnectModule {
    /**
     * Configure CinaConnect at the root level.
     *
     * Call this exactly once in your root `AppModule`.
     *
     * @param config - Project configuration including projectId and chains.
     * @returns Module with providers.
     */
    static forRoot(config: CinaConnectAngularConfig): ModuleWithProviders<CinaConnectModule>;
}
//# sourceMappingURL=cinaconnect.module.d.ts.map