/**
 * SmartAccount — ERC-4337 compatible smart account implementation.
 *
 * Uses viem for real cryptographic signing of UserOperations.
 */

import {
  type Address,
  type Hex,
  type Hash,
  hashMessage,
  keccak256,
  encodeAbiParameters,
  parseAbiParameters,
  concat,
  pad,
  toHex,
  createPublicClient,
  http,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type {
  SmartAccountConfig,
  SmartAccountState,
  UserOperation,
  UserOperationResult,
  UserOperationReceipt,
  BatchTransaction,
} from './types.js';
import { UserOperationStatus } from './types.js';
import { BundlerClient } from './bundler-client.js';
import type { EnhancedBundlerConfig, SubmittedUserOp } from './bundler-client.js';

/**
 * SmartAccount wraps a signer key and manages UserOperation lifecycle.
 */
export class SmartAccount {
  readonly config: SmartAccountConfig;
  private readonly signer: ReturnType<typeof privateKeyToAccount>;
  private state: SmartAccountState;
  private publicClient: ReturnType<typeof createPublicClient>;
  private _bundler: BundlerClient | null = null;

  constructor(config: SmartAccountConfig & { privateKey: Hex; bundlerConfig?: EnhancedBundlerConfig }) {
    this.config = config;
    this.signer = privateKeyToAccount(config.privateKey);
    this.state = {
      address: this.deriveAddress(),
      owner: config.owner,
      nonce: 0n,
      balance: 0n,
      isDeployed: false,
    };
    this.publicClient = createPublicClient({
      transport: http(config.rpcUrl),
    });

    // Initialize bundler if config provided
    if (config.bundlerConfig) {
      this._bundler = new BundlerClient(config.bundlerConfig);
    }
  }

  /**
   * Create a new smart account.
   */
  static async create(
    config: SmartAccountConfig & { privateKey: Hex },
  ): Promise<SmartAccount> {
    return new SmartAccount(config);
  }

  // ── State ─────────────────────────────────────────────────────

  getState(): SmartAccountState {
    return { ...this.state };
  }

  getAddress(): Address {
    return this.state.address as Address;
  }

  /**
   * Fetch the current on-chain nonce from the entry point.
   * Falls back to the local counter if the RPC call fails.
   */
  async getNonce(): Promise<bigint> {
    try {
      // ERC-4337 entry point: getNonce(sender, key) → uint256
      const nonce = await this.publicClient.readContract({
        address: this.config.entryPoint,
        abi: [
          {
            name: 'getNonce',
            type: 'function',
            stateMutability: 'view',
            inputs: [
              { name: 'sender', type: 'address' },
              { name: 'key', type: 'uint192' },
            ],
            outputs: [{ name: 'nonce', type: 'uint256' }],
          },
        ],
        functionName: 'getNonce',
        args: [this.state.address, 0n],
      });
      this.state.nonce = nonce;
      return nonce;
    } catch (err) {
      console.warn(`[SmartAccount] Failed to fetch nonce, using local value:`, err instanceof Error ? err.message : String(err));
      return this.state.nonce;
    }
  }

  /**
   * Fetch the on-chain balance of this account.
   */
  async fetchBalance(): Promise<bigint> {
    try {
      const balance = await this.publicClient.getBalance({
        address: this.state.address as Address,
      });
      this.state.balance = balance;
      return balance;
    } catch (err) {
      console.warn(`[SmartAccount] Failed to fetch balance, using local value:`, err instanceof Error ? err.message : String(err));
      return this.state.balance;
    }
  }

  updateBalance(balance: bigint): void {
    this.state.balance = balance;
  }

  markDeployed(): void {
    this.state.isDeployed = true;
  }

  // ── Execution ─────────────────────────────────────────────────

  /**
   * Execute a single transaction through the smart account.
   *
   * If a bundler is configured (via bundlerConfig in constructor),
   * the UserOp is automatically:
   *   1. Built and signed
   *   2. Sent to the bundler via eth_sendUserOperation
   *   3. Tracked for receipt polling
   *
   * Without a bundler, returns the signed UserOp and hash for
   * manual submission via BundlerClient.
   */
  async execute(
    to: Address,
    value: bigint,
    data: Hex,
  ): Promise<
    | { userOp: UserOperation; userOpHash: Hash }
    | { userOp: UserOperation; userOpHash: Hash; submitted: SubmittedUserOp }
  > {
    const userOp = await this.buildUserOperation([{ to, value, data }]);
    const signed = await this.signUserOp(userOp);
    const userOpHash = this.hashUserOperation(signed);

    // If bundler is configured, send the UserOp through it
    if (this._bundler) {
      const submitted = await this._bundler.sendUserOperation(signed);
      return { userOp: signed, userOpHash: userOpHash as Hash, submitted };
    }

    return { userOp: signed, userOpHash: userOpHash as Hash };
  }

  /**
   * Execute multiple transactions in a batch.
   *
   * Same behavior as execute(): sends through bundler if configured.
   */
  async executeBatch(
    transactions: BatchTransaction[],
  ): Promise<
    | { userOp: UserOperation; userOpHash: Hash }
    | { userOp: UserOperation; userOpHash: Hash; submitted: SubmittedUserOp }
  > {
    const userOp = await this.buildUserOperation(transactions);
    const signed = await this.signUserOp(userOp);
    const userOpHash = this.hashUserOperation(signed);

    // If bundler is configured, send the UserOp through it
    if (this._bundler) {
      const submitted = await this._bundler.sendUserOperation(signed);
      return { userOp: signed, userOpHash: userOpHash as Hash, submitted };
    }

    return { userOp: signed, userOpHash: userOpHash as Hash };
  }

  // ── Bundler Integration ───────────────────────────────────────

  /**
   * Access the BundlerClient (if configured).
   */
  getBundler(): BundlerClient | null {
    return this._bundler;
  }

  /**
   * Set or replace the BundlerClient at runtime.
   */
  setBundler(config: EnhancedBundlerConfig): void {
    this._bundler = new BundlerClient(config);
  }

  /**
   * Wait for a previously submitted UserOperation to be confirmed.
   * Requires a configured bundler.
   */
  async waitForConfirmation(
    userOpHash: Hash,
  ): Promise<UserOperationReceipt> {
    if (!this._bundler) {
      throw new Error('No bundler configured. Use setBundler() or pass bundlerConfig in constructor.');
    }
    return this._bundler.waitForUserOperationReceipt(userOpHash);
  }

  /**
   * Get the current status of a tracked UserOperation.
   */
  getUserOpStatus(userOpHash: Hash): UserOperationStatus {
    if (!this._bundler) {
      return UserOperationStatus.Pending;
    }
    return this._bundler.getUserOperationStatus(userOpHash);
  }

  // ── UserOperation building ────────────────────────────────────

  /**
   * Build a UserOperation from batch transactions.
   * Gas limits are placeholder values — the caller should call
   * BundlerClient.estimateUserOperationGas() and PaymasterClient
   * to fill in real values before submission.
   */
  async buildUserOperation(
    transactions: BatchTransaction[],
  ): Promise<UserOperation> {
    const nonce = await this.getNonce();
    const callData = this.encodeBatch(transactions);

    const userOp: UserOperation = {
      sender: this.state.address as Address,
      nonce,
      initCode: this.state.isDeployed ? '0x' : this.getInitCode(),
      callData,
      callGasLimit: 100_000n,
      verificationGasLimit: 150_000n,
      preVerificationGas: 21_000n,
      maxFeePerGas: 20_000_000_000n,
      maxPriorityFeePerGas: 2_000_000_000n,
      paymasterAndData: '0x',
      signature: '0x',
    };

    return userOp;
  }

  // ── Signing ───────────────────────────────────────────────────

  /**
   * Sign a UserOperation using the owner's private key.
   *
   * The signature is over the ERC-4337 UserOperation hash
   * (keccak256 of the encoded operation fields).
   */
  async signUserOp(userOp: UserOperation): Promise<UserOperation> {
    const hash = this.hashUserOperation(userOp);

    // Sign the hash with the owner's account using viem
    const signature = await this.signer.sign({ hash: hash as Hash });

    // Return the userOp with the signature embedded
    return {
      ...userOp,
      signature,
    };
  }

  /**
   * Sign arbitrary data (utility).
   */
  async signMessage(message: string): Promise<Hex> {
    const hash = hashMessage(message);
    const signature = await this.signer.sign({ hash });
    return signature;
  }

  // ── Hashing ───────────────────────────────────────────────────

  /**
   * Hash a UserOperation according to EIP-4337.
   *
   * Packs the UserOperation fields (excluding signature and initCode)
   * into ABI-encoded bytes and returns keccak256.
   */
  hashUserOperation(userOp: UserOperation): Hex {
    const packed = encodeAbiParameters(
      parseAbiParameters(
        'address, uint256, bytes32, bytes32, uint256, uint256, uint256, uint256, uint256, bytes32',
      ),
      [
        userOp.sender,
        userOp.nonce,
        keccak256(userOp.initCode),
        keccak256(userOp.callData),
        userOp.callGasLimit,
        userOp.verificationGasLimit,
        userOp.preVerificationGas,
        userOp.maxFeePerGas,
        userOp.maxPriorityFeePerGas,
        keccak256(userOp.paymasterAndData),
      ],
    );
    return keccak256(packed);
  }

  // ── Private helpers ───────────────────────────────────────────

  private deriveAddress(): Hex {
    const input = concat([
      pad(this.config.owner as Hex, { size: 20 }),
      pad((this.config.factoryAddress ?? '0x') as Hex, { size: 20 }),
      pad(toHex(this.config.index ?? 0n), { size: 32 }),
    ]);
    return ('0x' + keccak256(input).slice(-40)) as Hex;
  }

  private encodeBatch(transactions: BatchTransaction[]): Hex {
    // ABI-encode: executeBatch((address,uint256,bytes)[])
    return encodeAbiParameters(
      parseAbiParameters('(address,uint256,bytes)[]'),
      [
        transactions.map((tx) => [tx.to, tx.value, tx.data] as const),
      ],
    );
  }

  private getInitCode(): Hex {
    if (!this.config.factoryAddress) return '0x';
    // factoryAddress + createAccount ABI call
    const factoryCallData = encodeAbiParameters(
      parseAbiParameters('address, uint256'),
      [this.config.owner, this.config.index ?? 0n],
    );
    return concat([this.config.factoryAddress as Hex, factoryCallData]);
  }
}
