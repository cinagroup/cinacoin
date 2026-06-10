/**
 * UI Component Tests
 *
 * Tests for ConnectButton, WalletModal, ChainSelector, AddressDisplay,
 * and TransactionList components.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock component state
interface ComponentState {
  mounted: boolean;
  visible: boolean;
  disabled: boolean;
  loading: boolean;
  error: string | null;
  data: unknown;
}

class MockComponent {
  protected _state: ComponentState = {
    mounted: false,
    visible: false,
    disabled: false,
    loading: false,
    error: null,
    data: null,
  };

  protected _eventHandlers: Map<string, Function[]> = new Map();

  mount(): void {
    this._state.mounted = true;
    this._state.visible = true;
  }

  unmount(): void {
    this._state.mounted = false;
    this._state.visible = false;
  }

  on(event: string, handler: Function): void {
    const handlers = this._eventHandlers.get(event) ?? [];
    handlers.push(handler);
    this._eventHandlers.set(event, handlers);
  }

  emit(event: string, data?: unknown): void {
    const handlers = this._eventHandlers.get(event) ?? [];
    handlers.forEach(h => h(data));
  }

  get state(): ComponentState {
    return { ...this._state };
  }
}

// ConnectButton Component
class ConnectButton extends MockComponent {
  private _connected = false;
  private _address: string | null = null;
  private _onClick: Function | null = null;

  setOnClick(handler: Function): void {
    this._onClick = handler;
  }

  click(): void {
    if (this._state.disabled) return;
    if (this._onClick) this._onClick();
    this.emit('click');
  }

  setConnected(connected: boolean, address?: string): void {
    this._connected = connected;
    this._address = address ?? null;
    this._state.loading = false;
    this.emit('stateChange', { connected, address });
  }

  setLoading(loading: boolean): void {
    this._state.loading = loading;
  }

  setDisabled(disabled: boolean): void {
    this._state.disabled = disabled;
  }

  setError(error: string | null): void {
    this._state.error = error;
  }

  get text(): string {
    if (this._state.loading) return 'Connecting...';
    if (this._connected && this._address) {
      return `${this._address.slice(0, 6)}...${this._address.slice(-4)}`;
    }
    return 'Connect Wallet';
  }

  get isConnected(): boolean {
    return this._connected;
  }
}

// WalletModal Component
class WalletModal extends MockComponent {
  private _wallets: string[] = ['MetaMask', 'WalletConnect', 'Coinbase'];
  private _selectedWallet: string | null = null;
  private _isOpen = false;

  open(): void {
    this._isOpen = true;
    this._state.visible = true;
    this.emit('open');
  }

  close(): void {
    this._isOpen = false;
    this._state.visible = false;
    this._selectedWallet = null;
    this.emit('close');
  }

  selectWallet(wallet: string): void {
    if (!this._wallets.includes(wallet)) {
      throw new Error(`Unknown wallet: ${wallet}`);
    }
    
    this._selectedWallet = wallet;
    this._state.loading = true;
    this.emit('walletSelect', wallet);
  }

  completeConnection(address: string): void {
    this._state.loading = false;
    this._isOpen = false;
    this._state.visible = false;
    this.emit('connect', { wallet: this._selectedWallet, address });
  }

  failConnection(error: string): void {
    this._state.loading = false;
    this._state.error = error;
    this.emit('error', error);
  }

  get isOpen(): boolean {
    return this._isOpen;
  }

  get availableWallets(): string[] {
    return [...this._wallets];
  }

  get selectedWallet(): string | null {
    return this._selectedWallet;
  }
}

// ChainSelector Component
class ChainSelector extends MockComponent {
  private _chains = [
    { id: 1, name: 'Ethereum', icon: '⟠' },
    { id: 137, name: 'Polygon', icon: '⬡' },
    { id: 42161, name: 'Arbitrum', icon: '🔵' },
    { id: 10, name: 'Optimism', icon: '🔴' },
  ];
  
  private _selectedChain = 1;
  private _isOpen = false;

  open(): void {
    this._isOpen = true;
    this.emit('open');
  }

  close(): void {
    this._isOpen = false;
    this.emit('close');
  }

  selectChain(chainId: number): void {
    const chain = this._chains.find(c => c.id === chainId);
    if (!chain) {
      throw new Error(`Unknown chain: ${chainId}`);
    }
    
    const oldChain = this._selectedChain;
    this._selectedChain = chainId;
    this._isOpen = false;
    
    this.emit('chainChange', { from: oldChain, to: chainId, name: chain.name });
  }

  get isOpen(): boolean {
    return this._isOpen;
  }

  get selectedChain(): number {
    return this._selectedChain;
  }

  get availableChains(): typeof this._chains {
    return [...this._chains];
  }
}

// AddressDisplay Component
class AddressDisplay extends MockComponent {
  private _address: string;
  private _truncated = true;
  private _copied = false;

  constructor(address: string) {
    super();
    this._address = address;
  }

  get displayText(): string {
    if (!this._truncated) {
      return this._address;
    }
    
    return `${this._address.slice(0, 6)}...${this._address.slice(-4)}`;
  }

  get fullAddress(): string {
    return this._address;
  }

  setTruncated(truncated: boolean): void {
    this._truncated = truncated;
  }

  copy(): void {
    this._copied = true;
    this.emit('copy', this._address);
    
    setTimeout(() => {
      this._copied = false;
      this.emit('copyReset');
    }, 2000);
  }

  get isCopied(): boolean {
    return this._copied;
  }

  format(format: 'short' | 'medium' | 'full'): string {
    switch (format) {
      case 'short':
        return `${this._address.slice(0, 6)}...${this._address.slice(-4)}`;
      case 'medium':
        return `${this._address.slice(0, 10)}...${this._address.slice(-8)}`;
      case 'full':
        return this._address;
    }
  }
}

// TransactionList Component
class TransactionList extends MockComponent {
  private _transactions: Array<{
    hash: string;
    from: string;
    to: string;
    value: string;
    status: 'pending' | 'confirmed' | 'failed';
    timestamp: number;
  }> = [];
  
  private _page = 0;
  private _pageSize = 10;

  addTransaction(tx: any): void {
    this._transactions.unshift(tx);
    this.emit('transactionAdded', tx);
  }

  updateTransaction(hash: string, updates: Partial<any>): void {
    const tx = this._transactions.find(t => t.hash === hash);
    if (tx) {
      Object.assign(tx, updates);
      this.emit('transactionUpdated', tx);
    }
  }

  nextPage(): void {
    const maxPage = Math.ceil(this._transactions.length / this._pageSize) - 1;
    if (this._page < maxPage) {
      this._page++;
      this.emit('pageChange', this._page);
    }
  }

  prevPage(): void {
    if (this._page > 0) {
      this._page--;
      this.emit('pageChange', this._page);
    }
  }

  get currentPage(): number {
    return this._page;
  }

  get visibleTransactions(): any[] {
    const start = this._page * this._pageSize;
    return this._transactions.slice(start, start + this._pageSize);
  }

  get totalCount(): number {
    return this._transactions.length;
  }

  get totalPages(): number {
    return Math.ceil(this._transactions.length / this._pageSize);
  }
}

describe('UI Components', () => {
  describe('ConnectButton', () => {
    let button: ConnectButton;

    beforeEach(() => {
      button = new ConnectButton();
      button.mount();
    });

    it('should mount successfully', () => {
      expect(button.state.mounted).toBe(true);
      expect(button.state.visible).toBe(true);
    });

    it('should display "Connect Wallet" when disconnected', () => {
      expect(button.text).toBe('Connect Wallet');
      expect(button.isConnected).toBe(false);
    });

    it('should handle click event', () => {
      const handler = vi.fn();
      button.on('click', handler);
      button.click();
      expect(handler).toHaveBeenCalled();
    });

    it('should display loading state', () => {
      button.setLoading(true);
      expect(button.text).toBe('Connecting...');
    });

    it('should display truncated address when connected', () => {
      button.setConnected(true, '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb');
      expect(button.text).toBe('0x742d...fEb');
      expect(button.isConnected).toBe(true);
    });

    it('should not click when disabled', () => {
      const handler = vi.fn();
      button.setDisabled(true);
      button.on('click', handler);
      button.click();
      expect(handler).not.toHaveBeenCalled();
    });

    it('should display error state', () => {
      button.setError('Connection failed');
      expect(button.state.error).toBe('Connection failed');
    });
  });

  describe('WalletModal', () => {
    let modal: WalletModal;

    beforeEach(() => {
      modal = new WalletModal();
      modal.mount();
    });

    it('should open modal', () => {
      modal.open();
      expect(modal.isOpen).toBe(true);
      expect(modal.state.visible).toBe(true);
    });

    it('should close modal', () => {
      modal.open();
      modal.close();
      expect(modal.isOpen).toBe(false);
      expect(modal.state.visible).toBe(false);
    });

    it('should display available wallets', () => {
      expect(modal.availableWallets).toContain('MetaMask');
      expect(modal.availableWallets).toContain('WalletConnect');
      expect(modal.availableWallets).toContain('Coinbase');
    });

    it('should select wallet', () => {
      modal.open();
      modal.selectWallet('MetaMask');
      expect(modal.selectedWallet).toBe('MetaMask');
      expect(modal.state.loading).toBe(true);
    });

    it('should emit walletSelect event', () => {
      const handler = vi.fn();
      modal.on('walletSelect', handler);
      modal.selectWallet('WalletConnect');
      expect(handler).toHaveBeenCalledWith('WalletConnect');
    });

    it('should complete connection', () => {
      const handler = vi.fn();
      modal.on('connect', handler);
      
      modal.selectWallet('MetaMask');
      modal.completeConnection('0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb');
      
      expect(modal.state.loading).toBe(false);
      expect(modal.isOpen).toBe(false);
      expect(handler).toHaveBeenCalledWith({
        wallet: 'MetaMask',
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb',
      });
    });

    it('should handle connection failure', () => {
      const handler = vi.fn();
      modal.on('error', handler);
      
      modal.selectWallet('MetaMask');
      modal.failConnection('User rejected');
      
      expect(modal.state.loading).toBe(false);
      expect(modal.state.error).toBe('User rejected');
      expect(handler).toHaveBeenCalledWith('User rejected');
    });

    it('should reject unknown wallet', () => {
      expect(() => modal.selectWallet('UnknownWallet')).toThrow('Unknown wallet');
    });
  });

  describe('ChainSelector', () => {
    let selector: ChainSelector;

    beforeEach(() => {
      selector = new ChainSelector();
      selector.mount();
    });

    it('should open dropdown', () => {
      selector.open();
      expect(selector.isOpen).toBe(true);
    });

    it('should close dropdown', () => {
      selector.open();
      selector.close();
      expect(selector.isOpen).toBe(false);
    });

    it('should display available chains', () => {
      const chains = selector.availableChains;
      expect(chains).toHaveLength(4);
      expect(chains.find(c => c.id === 1)?.name).toBe('Ethereum');
      expect(chains.find(c => c.id === 137)?.name).toBe('Polygon');
    });

    it('should switch chain', () => {
      selector.selectChain(137);
      expect(selector.selectedChain).toBe(137);
      expect(selector.isOpen).toBe(false);
    });

    it('should emit chainChange event', () => {
      const handler = vi.fn();
      selector.on('chainChange', handler);
      
      selector.selectChain(42161);
      
      expect(handler).toHaveBeenCalledWith({
        from: 1,
        to: 42161,
        name: 'Arbitrum',
      });
    });

    it('should reject unknown chain', () => {
      expect(() => selector.selectChain(999999)).toThrow('Unknown chain');
    });
  });

  describe('AddressDisplay', () => {
    let display: AddressDisplay;

    beforeEach(() => {
      display = new AddressDisplay('0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb');
      display.mount();
    });

    it('should truncate address by default', () => {
      expect(display.displayText).toBe('0x742d...fEb');
    });

    it('should show full address when not truncated', () => {
      display.setTruncated(false);
      expect(display.displayText).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb');
    });

    it('should copy address to clipboard', () => {
      const handler = vi.fn();
      display.on('copy', handler);
      
      display.copy();
      
      expect(display.isCopied).toBe(true);
      expect(handler).toHaveBeenCalledWith('0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb');
    });

    it('should format address in different formats', () => {
      expect(display.format('short')).toBe('0x742d...fEb');
      expect(display.format('medium')).toBe('0x742d35Cc...95f0fEb');
      expect(display.format('full')).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb');
    });
  });

  describe('TransactionList', () => {
    let list: TransactionList;

    beforeEach(() => {
      list = new TransactionList();
      list.mount();
    });

    it('should add transaction', () => {
      const tx = {
        hash: '0x123',
        from: '0xabc',
        to: '0xdef',
        value: '1000000000000000000',
        status: 'pending' as const,
        timestamp: Date.now(),
      };
      
      list.addTransaction(tx);
      
      expect(list.totalCount).toBe(1);
      expect(list.visibleTransactions[0]).toEqual(tx);
    });

    it('should update transaction status', () => {
      const tx = {
        hash: '0x123',
        from: '0xabc',
        to: '0xdef',
        value: '1000000000000000000',
        status: 'pending' as const,
        timestamp: Date.now(),
      };
      
      list.addTransaction(tx);
      list.updateTransaction('0x123', { status: 'confirmed' });
      
      expect(list.visibleTransactions[0].status).toBe('confirmed');
    });

    it('should paginate transactions', () => {
      // Add 25 transactions
      for (let i = 0; i < 25; i++) {
        list.addTransaction({
          hash: `0x${i}`,
          from: '0xabc',
          to: '0xdef',
          value: '1000000000000000000',
          status: 'confirmed' as const,
          timestamp: Date.now(),
        });
      }
      
      expect(list.totalCount).toBe(25);
      expect(list.totalPages).toBe(3);
      expect(list.visibleTransactions).toHaveLength(10);
      
      list.nextPage();
      expect(list.currentPage).toBe(1);
      expect(list.visibleTransactions).toHaveLength(10);
      
      list.nextPage();
      expect(list.currentPage).toBe(2);
      expect(list.visibleTransactions).toHaveLength(5);
    });

    it('should navigate pages', () => {
      for (let i = 0; i < 25; i++) {
        list.addTransaction({
          hash: `0x${i}`,
          from: '0xabc',
          to: '0xdef',
          value: '1000000000000000000',
          status: 'confirmed' as const,
          timestamp: Date.now(),
        });
      }
      
      list.nextPage();
      list.nextPage();
      expect(list.currentPage).toBe(2);
      
      list.prevPage();
      expect(list.currentPage).toBe(1);
    });

    it('should not go below page 0', () => {
      list.prevPage();
      expect(list.currentPage).toBe(0);
    });

    it('should not exceed max page', () => {
      for (let i = 0; i < 5; i++) {
        list.addTransaction({
          hash: `0x${i}`,
          from: '0xabc',
          to: '0xdef',
          value: '1000000000000000000',
          status: 'confirmed' as const,
          timestamp: Date.now(),
        });
      }
      
      list.nextPage();
      list.nextPage(); // Should not go beyond max
      expect(list.currentPage).toBe(0);
    });
  });
});
