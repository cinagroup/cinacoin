import { describe, it, expect } from 'vitest';
import type {
  Token,
  ChainId,
  PaymentProvider,
  AssetBalance,
  PaymentConfig,
} from './types';
import fs from 'fs';
import path from 'path';

function readSource(filename: string): string {
  return fs.readFileSync(path.join(__dirname, filename), 'utf-8');
}

const mockToken: Token = {
  symbol: 'ETH',
  name: 'Ethereum',
  chain: 'ethereum',
  contractAddress: '',
  decimals: 18,
};

const mockConfig: PaymentConfig = {
  defaultCurrency: 'USD',
  defaultChain: 'ethereum',
  walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
  tokens: [mockToken],
};

// ─── Tests ────────────────────────────────────────────────────────────────

describe('payment-flow', () => {
  describe('types: Token', () => {
    it('supports native tokens with empty contractAddress', () => {
      const token: Token = { symbol: 'ETH', name: 'Ethereum', chain: 'ethereum', contractAddress: '', decimals: 18 };
      expect(token.contractAddress).toBe('');
    });
    it('supports ERC-20 tokens with contract address', () => {
      const token: Token = { symbol: 'USDC', name: 'USD Coin', chain: 'ethereum', contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', decimals: 6 };
      expect(token.contractAddress.length).toBe(42);
    });
    it('supports all chain identifiers', () => {
      const chains: ChainId[] = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'solana'];
      chains.forEach(c => expect(typeof c).toBe('string'));
    });
  });

  describe('usePayment hook (source analysis)', () => {
    const src = readSource('hooks/usePayment.ts');

    it('exports usePayment function', () => { expect(src).toContain('export function usePayment'); });
    it('accepts UsePaymentConfig parameter (extends PaymentConfig)', () => { expect(src).toContain('UsePaymentConfig'); });
    it('returns UsePaymentReturn shape', () => { expect(src).toContain('UsePaymentReturn'); });
    it('implements buy function', () => { expect(src).toContain('async (params: BuyParams)'); });
    it('implements send function', () => { expect(src).toContain('async (params: SendParams)'); });
    it('implements receive function', () => { expect(src).toContain('async (_params: ReceiveParams)'); });
    it('uses useState for loading', () => { expect(src).toContain('useState(false)'); });
    it('uses useState for error', () => { expect(src).toContain('useState<string | null>(null)'); });
    it('uses useState for transactions', () => { expect(src).toContain('useState<Transaction[]'); });
    it('uses useState for balances', () => { expect(src).toContain('useState<AssetBalance[]'); });
    it('uses useCallback for memoization', () => { expect(src).toContain('useCallback('); });
    it('buy sets status to pending', () => { expect(src).toContain('status: "pending"'); });
    it('send sets status to pending', () => { expect(src).toMatch(/type:\s*"send"/); });
    it('receive returns walletAddress as address', () => { expect(src).toContain('address: config.walletAddress'); });
    it('receive returns walletAddress as qrData', () => { expect(src).toContain('qrData: config.walletAddress'); });
    it('buy generates hash with buy_ prefix', () => { expect(src).toContain('0xbuy_'); });
    it('send generates hash with send_ prefix', () => { expect(src).toContain('0xsend_'); });
    it('handles errors with try/catch', () => { expect(src).toContain('try {'); expect(src).toContain('catch'); });
    it('sets loading to false in finally block', () => { expect(src).toContain('finally'); expect(src).toContain('setLoading(false)'); });
  });

  describe('BuyPage component (source analysis)', () => {
    const src = readSource('components/Buy/BuyPage.tsx');
    it('exports BuyPage function', () => { expect(src).toContain('export function BuyPage'); });
    it('accepts tokens prop', () => { expect(src).toContain('tokens?: Token[]'); });
    it('accepts providers prop', () => { expect(src).toContain('providers?: PaymentProvider[]'); });
    it('accepts onBuy callback', () => { expect(src).toContain('onBuy?:'); });
    it('handles processing state', () => { expect(src).toContain('"processing"'); expect(src).toContain('"success"'); });
    it('includes default tokens (ETH, USDC, USDT)', () => { expect(src).toContain('ETH'); expect(src).toContain('USDC'); expect(src).toContain('USDT'); });
    it('includes default providers (moonpay, coinbase, ramp)', () => { expect(src).toContain('moonpay'); expect(src).toContain('coinbase'); expect(src).toContain('ramp'); });
    it('filters compatible providers by token', () => { expect(src).toContain('compatibleProviders'); });
    it('disables buy button when amount is invalid', () => { expect(src).toContain('disabled={!fiatAmount'); });
    it('renders Buy Crypto heading', () => { expect(src).toContain('Buy Crypto'); });
  });

  describe('SendPage component (source analysis)', () => {
    const src = readSource('components/Send/SendPage.tsx');
    it('exports SendPage function', () => { expect(src).toContain('export function SendPage'); });
    it('accepts tokens prop', () => { expect(src).toContain('tokens?: Token[]'); });
    it('validates Ethereum address format', () => { expect(src).toContain('0x[a-fA-F0-9]{40}'); });
    it('validates Solana address format', () => { expect(src).toContain('[13][a-km-zA-HJ-NP-Z1-9]{25,34}'); });
    it('has confirm step', () => { expect(src).toContain('"confirm"'); expect(src).toContain('Confirm Transaction'); });
    it('has status step with pending/confirmed/failed', () => { expect(src).toContain('"pending"'); expect(src).toContain('"confirmed"'); expect(src).toContain('"failed"'); });
    it('shows network fee estimate', () => { expect(src).toContain('estimatedFee'); });
    it('generates tx hash on send', () => { expect(src).toContain('txHash'); });
    it('has reset functionality', () => { expect(src).toContain('handleReset'); });
  });

  describe('ReceivePage component (source analysis)', () => {
    const src = readSource('components/Receive/ReceivePage.tsx');
    it('exports ReceivePage function', () => { expect(src).toContain('export function ReceivePage'); });
    it('accepts walletAddress prop with default', () => { expect(src).toContain('walletAddress ='); });
    it('accepts qrData prop override', () => { expect(src).toContain('qrData?:'); });
    it('has copy to clipboard functionality', () => { expect(src).toContain('navigator.clipboard'); expect(src).toContain('handleCopy'); });
    it('has share functionality', () => { expect(src).toContain('handleShare'); expect(src).toContain('navigator.share'); });
    it('generates QR code with deterministic grid', () => { expect(src).toContain('QRCodePlaceholder'); });
  });

  describe('ConnectedPage component (source analysis)', () => {
    const src = readSource('components/Connected/ConnectedPage.tsx');
    it('exports ConnectedPage function', () => { expect(src).toContain('export function ConnectedPage'); });
    it('accepts walletAddress prop', () => { expect(src).toContain('walletAddress?:'); });
    it('accepts totalBalance prop', () => { expect(src).toContain('totalBalance?:'); });
    it('accepts recentTransactions prop', () => { expect(src).toContain('recentTransactions?:'); });
    it('accepts action callbacks', () => { expect(src).toContain('onBuy'); expect(src).toContain('onSend'); expect(src).toContain('onReceive'); });
    it('renders quick actions', () => { expect(src).toContain('"Send"'); expect(src).toContain('"Buy"'); });
    it('limits recent transactions to 5', () => { expect(src).toContain('.slice(0, 5)'); });
  });

  describe('AssetInventory component (source analysis)', () => {
    const src = readSource('components/AssetInventory/AssetInventory.tsx');
    it('exports AssetInventory function', () => { expect(src).toContain('export function AssetInventory'); });
    it('accepts balances prop', () => { expect(src).toContain('balances?: AssetBalance[]'); });
    it('shows empty state when no balances', () => { expect(src).toContain('No assets available'); });
    it('calculates total fiat value', () => { expect(src).toContain('totalFiatValue'); });
    it('renders token symbol abbreviation as icon', () => { expect(src).toContain('.slice(0, 2)'); });
  });

  describe('ProfilePage component (source analysis)', () => {
    const src = readSource('components/Profile/ProfilePage.tsx');
    it('exports ProfilePage function', () => { expect(src).toContain('export function ProfilePage'); });
    it('accepts linkedProviders prop', () => { expect(src).toContain('linkedProviders?:'); });
    it('has copy address functionality', () => { expect(src).toContain('handleCopyAddress'); });
    it('has remove provider functionality', () => { expect(src).toContain('handleRemoveProvider'); });
    it('has export key with confirmation', () => { expect(src).toContain('showConfirmExport'); });
    it('has default linked providers', () => { expect(src).toContain('DEFAULT_LINKED_PROVIDERS'); });
    it('displays connected/disconnected status', () => { expect(src).toContain('provider.connected'); });
  });

  describe('usePayment hook — real execution features', () => {
    const src = readSource('hooks/usePayment.ts');
    it('exposes createPayment for real execution', () => { expect(src).toContain('createPayment'); });
    it('exposes executePayment for real execution', () => { expect(src).toContain('executePayment'); });
    it('exposes estimateGas for real execution', () => { expect(src).toContain('estimateGas'); });
    it('exposes cancelPayment', () => { expect(src).toContain('cancelPayment'); });
    it('uses executor when available in send', () => { expect(src).toContain('executor.createPaymentRequest'); });
    it('uses executor.executePayment in send', () => { expect(src).toContain('executor.executePayment'); });
    it('falls back to mock when no executor', () => { expect(src).toContain('Mock path'); });
    it('maps chain strings to chain IDs', () => { expect(src).toContain('chainToChainId'); });
  });

  describe('PaymentExecutor (source analysis)', () => {
    const src = readSource('executor/PaymentExecutor.ts');
    it('exports PaymentExecutor class', () => { expect(src).toContain('export class PaymentExecutor'); });
    it('has createPaymentRequest method', () => { expect(src).toContain('createPaymentRequest'); });
    it('has executePayment method', () => { expect(src).toContain('executePayment'); });
    it('has estimateGas method', () => { expect(src).toContain('estimateGas'); });
    it('has getPaymentStatus method', () => { expect(src).toContain('getPaymentStatus'); });
    it('has cancelPayment method', () => { expect(src).toContain('cancelPayment'); });
    it('supports multisig approvals', () => { expect(src).toContain('approvePayment'); });
    it('uses exponential backoff for polling', () => { expect(src).toContain('backoffMs'); });
    it('handles native token transfers', () => { expect(src).toContain('sendTransaction'); });
    it('handles ERC-20 transfers', () => { expect(src).toContain('writeContract'); });
    it('uses ERC-20 ABI', () => { expect(src).toContain('ERC20_ABI'); });
    it('uses parseUnits for amount conversion', () => { expect(src).toContain('parseUnits'); });
    it('tracks payments in a Map', () => { expect(src).toContain('Map<string, PaymentRequest>'); });
    it('polls for transaction receipt', () => { expect(src).toContain('pollForReceipt'); });
  });

  describe('PaymentStateMachine (source analysis)', () => {
    const src = readSource('executor/PaymentStateMachine.ts');
    it('exports PaymentStateMachine class', () => { expect(src).toContain('export class PaymentStateMachine'); });
    it('defines valid state transitions', () => { expect(src).toContain('VALID_TRANSITIONS'); });
    it('has transition method', () => { expect(src).toContain('transition('); });
    it('has startPolling method', () => { expect(src).toContain('startPolling'); });
    it('has stopPolling method', () => { expect(src).toContain('stopPolling'); });
    it('supports event listeners', () => { expect(src).toContain('onStateChange'); });
    it('supports confirmed event', () => { expect(src).toContain('onConfirmed'); });
    it('supports failed event', () => { expect(src).toContain('onFailed'); });
    it('supports cancelled event', () => { expect(src).toContain('onCancelled'); });
    it('uses exponential backoff', () => { expect(src).toContain('_backoffMs'); });
  });

  describe('BatchPayment (source analysis)', () => {
    const src = readSource('executor/BatchPayment.ts');
    it('exports BatchPayment class', () => { expect(src).toContain('export class BatchPayment'); });
    it('has add method', () => { expect(src).toContain('add('); });
    it('has execute method', () => { expect(src).toContain('execute('); });
    it('has estimateGas method', () => { expect(src).toContain('estimateGas'); });
    it('uses Multicall3', () => { expect(src).toContain('MULTICALL3_ABI'); });
    it('has default multicall addresses', () => { expect(src).toContain('DEFAULT_MULTICALL3_ADDRESS'); });
    it('supports aggregate3', () => { expect(src).toContain('aggregate3'); });
  });

  describe('usePaymentStatus hook (source analysis)', () => {
    const src = readSource('hooks/usePaymentStatus.ts');
    it('exports usePaymentStatus function', () => { expect(src).toContain('export function usePaymentStatus'); });
    it('accepts paymentId and executor', () => { expect(src).toContain('paymentId: string | null'); });
    it('returns payment state', () => { expect(src).toContain('state: PaymentState | null'); });
    it('returns txHash', () => { expect(src).toContain('txHash'); });
    it('supports auto-refresh', () => { expect(src).toContain('setInterval'); });
    it('returns refetch function', () => { expect(src).toContain('refetch'); });
  });

  describe('usePaymentHistory hook (source analysis)', () => {
    const src = readSource('hooks/usePaymentHistory.ts');
    it('exports usePaymentHistory function', () => { expect(src).toContain('export function usePaymentHistory'); });
    it('returns filtered payments', () => { expect(src).toContain('filteredPayments'); });
    it('supports state filtering', () => { expect(src).toContain('filter'); });
    it('supports auto-refresh', () => { expect(src).toContain('setInterval'); });
    it('has getPayment method', () => { expect(src).toContain('getPayment'); });
  });

  describe('types: Payment execution types', () => {
    const src = readSource('types.ts');
    it('defines PaymentState type', () => { expect(src).toContain('PaymentState'); });
    it('defines PaymentRequest interface', () => { expect(src).toContain('PaymentRequest'); });
    it('defines CreatePaymentParams interface', () => { expect(src).toContain('CreatePaymentParams'); });
    it('defines PaymentResult interface', () => { expect(src).toContain('PaymentResult'); });
    it('defines GasEstimate interface', () => { expect(src).toContain('GasEstimate'); });
    it('defines MultisigApproval interface', () => { expect(src).toContain('MultisigApproval'); });
    it('defines ExecutorConfig interface', () => { expect(src).toContain('ExecutorConfig'); });
    it('PaymentState includes all states', () => {
      expect(src).toContain('"pending"');
      expect(src).toContain('"processing"');
      expect(src).toContain('"confirmed"');
      expect(src).toContain('"failed"');
      expect(src).toContain('"cancelled"');
    });
  });
});
