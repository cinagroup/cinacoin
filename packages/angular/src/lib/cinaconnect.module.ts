import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Connector, CinaConnectCore } from '@cinaconnect/core-sdk';
import { CinaConnectService } from './cinaconnect.service.js';
import {
  CINA_CONNECT_OPTIONS,
  CINA_CONNECT_INSTANCE,
  type CinaConnectAngularConfig,
} from './cinaconnect.tokens.js';

// Components
import { ConnectButtonComponent } from './components/connect-button.component.js';
import { AccountButtonComponent } from './components/account-button.component.js';
import { NetworkButtonComponent } from './components/network-button.component.js';

// Pipes
import { AddressPipe } from './pipes/address.pipe.js';
import { BalancePipe } from './pipes/balance.pipe.js';

// Directives
import { ConnectDirective } from './directives/connect.directive.js';

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
@NgModule({
  imports: [CommonModule],
  declarations: [
    ConnectButtonComponent,
    AccountButtonComponent,
    NetworkButtonComponent,
    AddressPipe,
    BalancePipe,
    ConnectDirective,
  ],
  providers: [CinaConnectService],
  exports: [
    ConnectButtonComponent,
    AccountButtonComponent,
    NetworkButtonComponent,
    AddressPipe,
    BalancePipe,
    ConnectDirective,
  ],
})
export class CinaConnectModule {
  /**
   * Configure CinaConnect at the root level.
   *
   * Call this exactly once in your root `AppModule`.
   *
   * @param config - Project configuration including projectId and chains.
   * @returns Module with providers.
   */
  static forRoot(config: CinaConnectAngularConfig): ModuleWithProviders<CinaConnectModule> {
    return {
      ngModule: CinaConnectModule,
      providers: [
        {
          provide: CINA_CONNECT_OPTIONS,
          useValue: config,
        },
        {
          provide: CINA_CONNECT_INSTANCE,
          useFactory: (options: CinaConnectAngularConfig): Connector | CinaConnectCore => {
            if (options.connector) {
              return options.connector;
            }
            // Create a default connector instance from core SDK
            const core = new CinaConnectCore({
              projectId: options.projectId,
              chains: options.chains,
              metadata: options.metadata,
              relayUrl: options.relayUrl,
              debug: options.debug,
            });
            return core.getConnector();
          },
          deps: [CINA_CONNECT_OPTIONS],
        },
      ],
    };
  }
}
