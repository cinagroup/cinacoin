/// <reference types="vite/client" />

interface EthereumProvider {
  isMetaMask?: boolean
  isCoinbaseWallet?: boolean
  on(event: string, handler: (...args: any[]) => void): void
  removeListener(event: string, handler: (...args: any[]) => void): void
  removeAllListeners(event?: string): void
  request(args: { method: string; params?: unknown[] }): Promise<any>
  disconnect?(): void
}

interface Window {
  ethereum?: EthereumProvider
}
