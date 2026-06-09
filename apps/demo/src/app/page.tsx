"use client";

import { useState } from "react";

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [balance, setBalance] = useState(0);
  const [txAmount, setTxAmount] = useState("");
  const [txRecipient, setTxRecipient] = useState("");
  const [txStatus, setTxStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const connectWallet = () => {
    setLoading(true);
    // Simulate wallet connection
    setTimeout(() => {
      const addr = "0x" + Array.from({ length: 40 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("");
      setWalletAddress(addr);
      setBalance(1000);
      setConnected(true);
      setLoading(false);
    }, 1500);
  };

  const disconnectWallet = () => {
    setConnected(false);
    setWalletAddress("");
    setBalance(0);
    setTxStatus("");
  };

  const sendTransaction = () => {
    if (!txAmount || !txRecipient) return;
    setLoading(true);
    setTxStatus("Sending transaction...");
    setTimeout(() => {
      setTxStatus("Confirming on blockchain...");
      setTimeout(() => {
        const amount = parseFloat(txAmount);
        setBalance((prev) => prev - amount);
        setTxStatus(`✅ Transaction successful! Sent ${txAmount} CINA to ${txRecipient.slice(0, 10)}...`);
        setTxAmount("");
        setTxRecipient("");
        setLoading(false);
      }, 1500);
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center border-b border-gray-800">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          CinaCoin Demo
        </h1>
        {connected ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 font-mono">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </span>
            <button
              onClick={disconnectWallet}
              className="px-4 py-2 text-sm border border-red-600 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-semibold transition-colors"
          >
            {loading ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
      </header>

      <div className="container mx-auto px-4 py-12">
        {!connected ? (
          /* Connect Prompt */
          <div className="max-w-md mx-auto text-center py-20">
            <div className="text-6xl mb-6">🔗</div>
            <h2 className="text-2xl font-bold mb-4">Welcome to CinaCoin Demo</h2>
            <p className="text-gray-400 mb-8">
              Connect your wallet to explore wallet management, transactions, and more.
            </p>
            <button
              onClick={connectWallet}
              disabled={loading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-semibold transition-colors"
            >
              {loading ? "Connecting..." : "Connect Wallet"}
            </button>
          </div>
        ) : (
          /* Dashboard */
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            {/* Balance Card */}
            <div className="p-6 border border-gray-800 rounded-xl bg-gradient-to-br from-gray-900 to-black">
              <p className="text-gray-400 text-sm mb-2">Your Balance</p>
              <p className="text-4xl font-bold mb-1">{balance.toFixed(2)} <span className="text-lg text-gray-400">CINA</span></p>
              <p className="text-gray-500 text-sm">≈ ${(balance * 0.42).toFixed(2)} USD</p>
            </div>

            {/* Network Info */}
            <div className="p-6 border border-gray-800 rounded-xl bg-gradient-to-br from-gray-900 to-black">
              <p className="text-gray-400 text-sm mb-2">Network</p>
              <p className="text-xl font-semibold mb-1">CinaCoin Mainnet</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-green-400 text-sm">Connected</span>
              </div>
            </div>

            {/* Send Transaction */}
            <div className="md:col-span-2 p-6 border border-gray-800 rounded-xl">
              <h3 className="text-xl font-semibold mb-6">Send Transaction</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Recipient Address</label>
                  <input
                    type="text"
                    value={txRecipient}
                    onChange={(e) => setTxRecipient(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Amount (CINA)</label>
                  <input
                    type="number"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={sendTransaction}
                  disabled={loading || !txAmount || !txRecipient}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-semibold transition-colors"
                >
                  {loading ? "Processing..." : "Send Transaction"}
                </button>
                {txStatus && (
                  <div className="p-4 bg-gray-900 rounded-lg text-sm font-mono">
                    {txStatus}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="md:col-span-2 p-6 border border-gray-800 rounded-xl">
              <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="p-4 border border-gray-700 rounded-lg hover:border-gray-500 transition-colors text-center">
                  <div className="text-2xl mb-2">📥</div>
                  <span className="text-sm">Receive</span>
                </button>
                <button className="p-4 border border-gray-700 rounded-lg hover:border-gray-500 transition-colors text-center">
                  <div className="text-2xl mb-2">🔄</div>
                  <span className="text-sm">Swap</span>
                </button>
                <button className="p-4 border border-gray-700 rounded-lg hover:border-gray-500 transition-colors text-center">
                  <div className="text-2xl mb-2">📊</div>
                  <span className="text-sm">Stake</span>
                </button>
                <button className="p-4 border border-gray-700 rounded-lg hover:border-gray-500 transition-colors text-center">
                  <div className="text-2xl mb-2">📜</div>
                  <span className="text-sm">History</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
