"use client";

import { useCallback } from "react";
import { Search, Terminal } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import WalletInfo from "@/components/WalletInfo";
import TransactionList from "@/components/TransactionList";
import TransactionDetail from "@/components/TransactionDetail";
import { useWallet } from "@/hooks/useWallet";
import { classifySearchQuery } from "@/lib/utils";
import type { Transaction, TransactionDetail as TxDetail } from "@/types";

const MOCK_WALLET_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

const mockTransactions: Transaction[] = [
  {
    hash: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
    type: "receive",
    from: "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
    to: MOCK_WALLET_ADDRESS,
    value: "100.50",
    fee: "0.0021",
    block: 18543210,
    timestamp: "2 hours ago",
    status: "success",
  },
  {
    hash: "0x1f4e2d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e",
    type: "send",
    from: MOCK_WALLET_ADDRESS,
    to: "0xDeaDBeeF00000000000000000000000000000000",
    value: "50.25",
    fee: "0.0018",
    block: 18543195,
    timestamp: "5 hours ago",
    status: "success",
  },
  {
    hash: "0x2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d",
    type: "contract",
    from: MOCK_WALLET_ADDRESS,
    to: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    value: "0",
    fee: "0.0045",
    block: 18543180,
    timestamp: "8 hours ago",
    status: "success",
  },
  {
    hash: "0x3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e",
    type: "receive",
    from: "0x1234567890AbCdEf1234567890aBcDeF12345678",
    to: MOCK_WALLET_ADDRESS,
    value: "250.00",
    fee: "0.0023",
    block: 18543165,
    timestamp: "12 hours ago",
    status: "success",
  },
  {
    hash: "0x4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f",
    type: "send",
    from: MOCK_WALLET_ADDRESS,
    to: "0xFEDCBA0987654321FEDCBA0987654321FEDCBA09",
    value: "75.80",
    fee: "0.0019",
    block: 18543150,
    timestamp: "1 day ago",
    status: "failed",
  },
];

const mockTransactionDetail: TxDetail = {
  hash: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
  status: "success",
  block: 18543210,
  timestamp: "Jun 8, 2026 23:00 UTC",
  from: "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
  to: MOCK_WALLET_ADDRESS,
  value: "100.50",
  fee: "0.0021",
  gasUsed: "21,000",
  gasPrice: "25",
  input: "0x",
  confirmations: 1247,
};

export default function WalletExplorerPage() {
  const { connected, address, balance, tokenBalance, txCount, firstSeen, connect } = useWallet();

  const handleSearch = useCallback((query: string) => {
    const type = classifySearchQuery(query);
    // TODO: Route to appropriate view based on type
    console.debug('Search:', { query, type });
  }, []);

  if (!connected) {
    return (
      <div className="space-y-8">
        {/* Dark band hero */}
        <div className="rounded-sm bg-[#171717] px-8 py-12">
          <p className="font-mono text-xs text-[#888] mb-3">wallet-explorer</p>
          <h1 className="text-2xl font-semibold text-white tracking-tight">CinaCoin Wallet Explorer.</h1>
          <p className="mt-2 text-sm text-[#b3b3b3] max-w-lg">Search addresses, view balances, and explore transactions on the CinaCoin blockchain.</p>
          <button onClick={connect} className="cc-btn-primary mt-6">
            Connect wallet
          </button>
        </div>
        {/* Code mockup */}
        <div className="rounded-sm border border-[var(--cc-hairline)] bg-[var(--cc-canvas)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--cc-hairline)] bg-[var(--cc-canvas-soft-2)]">
            <Terminal className="h-4 w-4 text-[var(--cc-muted)]" aria-hidden="true" />
            <span className="font-mono text-xs text-[var(--cc-muted)]">Quick start</span>
          </div>
          <pre className="p-4 font-mono text-sm text-[var(--cc-body)] overflow-x-auto"><code>{`import { CinaCoin } from "@cinacoin/sdk";

const client = new CinaCoin({ network: "mainnet" });
const wallet = await client.wallet.connect();

const balance = await wallet.getBalance();
console.log(balance); // "1,234,567.89 CINA"`}</code></pre>
        </div>
      </div>
    );
  }

  const walletAddress = address || '';

  return (
    <div className="space-y-8">
      {/* Header — split layout */}
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">wallet-explorer</p>
          <h1 className="text-2xl font-semibold text-[var(--cc-ink)] tracking-tight">
            CinaCoin Wallet Explorer.
          </h1>
          <p className="mt-1 text-sm text-[var(--cc-body)]">
            Search addresses, view balances, and explore transactions.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[var(--cc-muted)]">
          <Search className="h-3.5 w-3.5" aria-hidden="true" />
          <span>cmd+k</span>
        </div>
      </div>

      {/* Search Bar */}
      <SearchBar onSearch={handleSearch} />

      {/* Wallet Info */}
      <WalletInfo
        address={walletAddress}
        balance={balance || '0'}
        tokenBalance={tokenBalance || '0'}
        txCount={txCount || 0}
        firstSeen={firstSeen || ''}
      />

      {/* Transaction Detail (sample) */}
      <TransactionDetail tx={mockTransactionDetail} />

      {/* Transaction List */}
      <TransactionList transactions={mockTransactions} />

      {/* Footer */}
      <footer className="border-t border-[var(--cc-hairline)] pt-6 flex items-center justify-between text-xs text-[var(--cc-muted)]">
        <p>&copy; 2026 CinaCoin.</p>
        <p className="font-mono">Powered by CinaCoin Blockchain</p>
      </footer>
    </div>
  );
}
