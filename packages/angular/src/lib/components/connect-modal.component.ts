/**
 * Cinacoin Connect Modal Component
 *
 * A real modal overlay that displays wallet options for connecting.
 * Triggered via `CinacoinService.open()` or used directly via selector.
 *
 * Usage:
 *   <cina-connect-modal [isOpen]="true" (close)="onClose()"></cina-connect-modal>
 */
import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CinacoinService } from '../cinacoin.service.js';

interface WalletOption {
  id: string;
  name: string;
  iconUrl?: string;
  installed?: boolean;
}

const DEFAULT_WALLETS: WalletOption[] = [
  { id: 'metamask', name: 'MetaMask', installed: false },
  { id: 'walletconnect', name: 'WalletConnect', installed: false },
  { id: 'coinbase', name: 'Coinbase Wallet', installed: false },
  { id: 'rainbow', name: 'Rainbow', installed: false },
  { id: 'trust', name: 'Trust Wallet', installed: false },
  { id: 'phantom', name: 'Phantom', installed: false },
];

@Component({
  selector: 'cina-connect-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="cina-modal-overlay"
      *ngIf="isOpen"
      (click)="onOverlayClick($event)"
    >
      <div class="cina-modal-content" role="dialog" aria-label="Connect Wallet">
        <div class="cina-modal-header">
          <h2>Connect Wallet</h2>
          <button
            class="cina-close-btn"
            aria-label="Close modal"
            (click)="close()"
          >
            ×
          </button>
        </div>
        <div class="cina-wallet-list">
          <button
            *ngFor="let w of wallets"
            class="cina-wallet-row"
            (click)="onWalletSelect(w)"
          >
            <span class="cina-wallet-icon">{{ getWalletEmoji(w.id) }}</span>
            <span class="cina-wallet-name">{{ w.name }}</span>
            <span *ngIf="w.installed" class="cina-badge">Installed</span>
          </button>
        </div>
        <div class="cina-modal-footer">
          <p class="cina-footer-text">
            Connecting via WalletConnect v2 · Encrypted & secure
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cina-modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
    }
    .cina-modal-content {
      background: #1a1a2e;
      border-radius: 16px;
      width: 400px;
      max-width: 95vw;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      animation: cina-slide-up 0.2s ease-out;
    }
    @keyframes cina-slide-up {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .cina-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .cina-modal-header h2 {
      margin: 0;
      color: #fff;
      font-size: 18px;
      font-weight: 600;
    }
    .cina-close-btn {
      background: none;
      border: none;
      color: #888;
      font-size: 24px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: background 0.15s;
    }
    .cina-close-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }
    .cina-wallet-list {
      padding: 8px;
      overflow-y: auto;
    }
    .cina-wallet-row {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 12px 16px;
      background: none;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: background 0.15s;
      color: #fff;
    }
    .cina-wallet-row:hover {
      background: rgba(255, 255, 255, 0.08);
    }
    .cina-wallet-icon {
      font-size: 24px;
      width: 32px;
      text-align: center;
    }
    .cina-wallet-name {
      flex: 1;
      font-size: 15px;
      font-weight: 500;
    }
    .cina-badge {
      font-size: 11px;
      padding: 0px 8px;
      background: rgba(59, 130, 246, 0.2);
      color: #60a5fa;
      border-radius: 4px;
    }
    .cina-modal-footer {
      padding: 12px 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      text-align: center;
    }
    .cina-footer-text {
      margin: 0;
      font-size: 12px;
      color: #666;
    }
  `],
})
export class ConnectModalComponent {
  /** Whether the modal is currently open. */
  @Input() isOpen = false;

  /** Wallets to display. Defaults to built-in list. */
  @Input() wallets: WalletOption[] = DEFAULT_WALLETS;

  /** Emitted when the modal is closed. */
  @Output() close = new EventEmitter<void>();

  /** Emitted when a wallet is selected. */
  @Output() walletSelect = new EventEmitter<WalletOption>();

  private _service = inject(CinacoinService, { optional: true });

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) this.closeModal();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('cina-modal-overlay')) {
      this.closeModal();
    }
  }

  onWalletSelect(wallet: WalletOption): void {
    this.walletSelect.emit(wallet);
    // If CinacoinService is available, trigger connection
    if (this._service) {
      this._service.connect(wallet.id).then(() => {
        this.closeModal();
      }).catch(() => {
        // keep modal open on error
      });
    } else {
      this.closeModal();
    }
  }

  closeModal(): void {
    if (this._service) {
      this._service.close();
    }
    this.close.emit();
  }

  getWalletEmoji(id: string): string {
    const map: Record<string, string> = {
      metamask: '🦊',
      walletconnect: '🔗',
      coinbase: '🔵',
      rainbow: '🌈',
      trust: '🛡️',
      phantom: '👻',
    };
    return map[id] ?? '💼';
  }
}
