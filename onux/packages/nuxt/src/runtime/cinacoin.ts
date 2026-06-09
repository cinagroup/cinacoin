/**
 * Cinacoin application instance for the Nuxt plugin.
 *
 * @cinacoin/vue does not export a Cinacoin class (only a provider component
 * and composables). This class provides the interface expected by the Nuxt
 * composables (useCinacoin, useCinacoinAccount, useCinacoinNetwork).
 *
 * Actual wallet connections are handled by @cinacoin/vue composables at
 * runtime; this class holds configuration and connection state.
 */

export interface MetaOptions {
  name?: string
  description?: string
  url?: string
  icons?: string[]
}

export interface CinacoinOptions {
  projectId: string
  networks?: string[]
  metadata?: MetaOptions
  themeMode?: 'auto' | 'dark' | 'light'
  themeVariables?: Record<string, string>
}

/**
 * Lightweight Cinacoin application wrapper for Nuxt.
 *
 * Provides the interface expected by Nuxt composables:
 * - address, balance, chain, isConnected (getters)
 * - networks (configured network list)
 * - switchNetwork(network)
 */
export class Cinacoin {
  readonly projectId: string
  readonly metadata?: MetaOptions
  readonly themeMode: string
  readonly themeVariables?: Record<string, string>
  readonly networks: string[]

  private _address: string | undefined
  private _balance: string | undefined
  private _chain: string | undefined
  private _isConnected = false

  constructor(options: CinacoinOptions) {
    this.projectId = options.projectId
    this.networks = options.networks ?? ['mainnet']
    this.metadata = options.metadata
    this.themeMode = options.themeMode ?? 'auto'
    this.themeVariables = options.themeVariables
  }

  get address(): string | undefined {
    return this._address
  }

  set address(value: string | undefined) {
    this._address = value
  }

  get balance(): string | undefined {
    return this._balance
  }

  set balance(value: string | undefined) {
    this._balance = value
  }

  get chain(): string | undefined {
    return this._chain
  }

  set chain(value: string | undefined) {
    this._chain = value
  }

  get isConnected(): boolean {
    return this._isConnected
  }

  set isConnected(value: boolean) {
    this._isConnected = value
  }

  /**
   * Switch to a different network.
   */
  async switchNetwork(_network: string): Promise<void> {
    // Handled by @cinacoin/vue composables at runtime
  }

  /**
   * Connect to a wallet (placeholder — handled by composables).
   */
  async connect(): Promise<void> {
    // Handled by @cinacoin/vue composables at runtime
  }

  /**
   * Disconnect the current wallet (placeholder).
   */
  async disconnect(): Promise<void> {
    this._address = undefined
    this._balance = undefined
    this._chain = undefined
    this._isConnected = false
  }
}
