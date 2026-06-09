"use client";

import SearchBar from "@/components/SearchBar";
import WalletInfo from "@/components/WalletInfo";
import TransactionList from "@/components/TransactionList";
import TransactionDetail from "@/components/TransactionDetail";

// Mock data
const mockWallet = {
  address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  balance: "1,234,567.89",
  tokenBalance: "50,000.00",
  txCount: 1247,
  firstSeen: "Jan 15, 2024",
};

const mockTransactions = [
  {
    hash: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
    type: "receive" as const,
    from: "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
    to: mockWallet.address,
    value: "100.50",
    fee: "0.0021",
    block: 18543210,
    timestamp: "2 hours ago",
    status: "success" as const,
  },
  {
    hash: "0x1f4e2d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e",
    type: "send" as const,
    from: mockWallet.address,
    to: "0xDeaDBeeF00000000000000000000000000000000",
    value: "50.25",
    fee: "0.0018",
    block: 18543195,
    timestamp: "5 hours ago",
    status: "success" as const,
  },
  {
    hash: "0x2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d",
    type: "contract" as const,
    from: mockWallet.address,
    to: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    value: "0",
    fee: "0.0045",
    block: 18543180,
    timestamp: "8 hours ago",
    status: "success" as const,
  },
  {
    hash: "0x3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e",
    type: "receive" as const,
    from: "0x1234567890AbCdEf1234567890aBcDeF12345678",
    to: mockWallet.address,
    value: "250.00",
    fee: "0.0023",
    block: 18543165,
    timestamp: "12 hours ago",
    status: "success" as const,
  },
  {
    hash: "0x4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f",
    type: "send" as const,
    from: mockWallet.address,
    to: "0xFEDCBA0987654321FEDCBA0987654321FEDCBA09",
    value: "75.80",
    fee: "0.0019",
    block: 18543150,
    timestamp: "1 day ago",
    status: "failed" as const,
  },
];

const mockTransactionDetail = {
  hash: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
  status: "success" as const,
  block: 18543210,
  timestamp: "Jun 8, 2026 23:00 UTC",
  from: "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
  to: mockWallet.address,
  value: "100.50",
  fee: "0.0021",
  gasUsed: "21,000",
  gasPrice: "25",
  input: "0x",
  confirmations: 1247,
};

export default function WalletExplorerPage() {
  const handleSearch = (query: string) => {
    // In a real app, this would trigger an API call or navigation
    console.log("Searching for:", query);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-heading-2 text-ink">
          CinaCoin Wallet Explorer
        </h1>
        <p className="mt-2 text-body text-mute">
          Search addresses, view balances, and explore transactions
        </p>
      </div>

      {/* Search Bar */}
      <SearchBar onSearch={handleSearch} />

      {/* Wallet Info */}
      <WalletInfo {...mockWallet} />

      {/* Transaction Detail (sample) */}
      <TransactionDetail tx={mockTransactionDetail} />

      {/* Transaction List */}
      <TransactionList transactions={mockTransactions} />

      {/* Footer */}
      <footer className="border-t border-hairline pt-6 text-center text-body-sm text-mute">
        <p>© 2026 CinaCoin. All rights reserved.</p>
        <p className="mt-1">Powered by CinaCoin Blockchain</p>
      </footer>
    </div>
  );
}
