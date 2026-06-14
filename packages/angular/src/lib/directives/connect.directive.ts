import { logger } from '@cinacoin/logger';
import { Directive, HostListener, Input, ElementRef, Renderer2 } from '@angular/core';
import { CinacoinService } from '../cinacoin.service.js';

/**
 * Directive that automatically triggers wallet connection on click.
 *
 * Apply to any element to make it a connect trigger.
 *
 * ```html
 * <button cinaConnect>Connect Wallet</button>
 * <div cinaConnect [connectorId]="'walletconnect'">Connect via Cinacoin</div>
 * ```
 */
@Directive({
  selector: '[cinaConnect]',
})
export class ConnectDirective {
  /** Optional connector ID to use for connection. */
  @Input('cinaConnect') connectorId?: string;

  /** Whether the directive is disabled. */
  @Input('cinaConnectDisabled') disabled = false;

  constructor(
    private _service: CinacoinService,
    private _el: ElementRef<HTMLElement>,
    private _renderer: Renderer2,
  ) {
    this._renderer.setStyle(this._el.nativeElement, 'cursor', 'pointer');
  }

  /**
   * Handle click events by initiating a wallet connection.
   *
   * @param event - The click event.
   */
  @HostListener('click', ['$event'])
  async onClick(event: Event): Promise<void> {
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    event.preventDefault();

    try {
      await this._service.connect(this.connectorId);
    } catch (error) {
      logger.error('[cinaConnect] Connection failed:', error);
    }
  }
}
