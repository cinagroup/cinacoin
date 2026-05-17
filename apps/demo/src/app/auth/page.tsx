'use client';

import { useState } from 'react';
import Link from 'next/link';

const SUPPORTED_CHAINS = [
  { name: 'Ethereum', symbol: 'Ξ', color: 'from-blue-400 to-indigo-500', chainId: 1 },
  { name: 'Polygon', symbol: '⬡', color: 'from-purple-400 to-violet-600', chainId: 137 },
  { name: 'Arbitrum', symbol: 'λ', color: 'from-sky-400 to-blue-600', chainId: 42161 },
  { name: 'Base', symbol: '⊙', color: 'from-blue-500 to-cyan-400', chainId: 8453 },
];

const MOCK_ADDRESS = '0x7a3bF12e8C4d9A01bE5673cD8f29a1E0c49fc49f';
const MOCK_NONCE = 'a8f3c2e1b0d9456789abcdef01234567';
const MOCK_SIGNATURE = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12';
const MOCK_ISSUED_AT = '2025-05-17T13:10:00.000Z';

function generateSiweMessage(domain: string, address: string, nonce: string, chainId: number, issuedAt: string): string {
  return `${domain} wants you to sign in with your Ethereum account:
${address}

I accept the ServiceAgreement Terms and Conditions.

URI: https://${domain}
Version: 1
Chain ID: ${chainId}
Nonce: ${nonce}
Issued At: ${issuedAt}
Resources:
- https://${domain}/terms
- https://${domain}/privacy`;
}

const SIWE_CODE_EXAMPLE = `import { SiweMessage } from 'siwe';
import { CinaConnect } from '@cinaconnect/sdk';

const client = new CinaConnect({ chains: ['ethereum', 'polygon'] });
const message = new SiweMessage({ domain: window.location.host, address, ... });
const signature = await client.wallet.signMessage(message.prepareMessage());
const verified = await client.auth.verify({ message, signature });`;

type Step = 'connect' | 'sign' | 'verify' | 'done';

export default function AuthPage() {
  const [step, setStep] = useState<Step>('connect');
  const [selectedChain, setSelectedChain] = useState(SUPPORTED_CHAINS[0]);
  const [isLoading, setIsLoading] = useState(false);

  const siweMessage = generateSiweMessage(
    'demo.cinaconnect.io',
    MOCK_ADDRESS,
    MOCK_NONCE,
    selectedChain.chainId,
    MOCK_ISSUED_AT,
  );

  const handleConnect = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('sign');
    }, 800);
  };

  const handleSign = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('verify');
    }, 1200);
  };

  const handleVerify = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('done');
    }, 600);
  };

  const handleReset = () => {
    setStep('connect');
  };

  const stepIndex = ['connect', 'sign', 'verify', 'done'].indexOf(step);

  const stepLabels = ['Connect', 'Sign', 'Verify', 'Profile'];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              CinaConnect
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/swap" className="text-sm text-gray-400 hover:text-white transition-colors">
                Swap
              </Link>
              <Link href="/multi-chain" className="text-sm text-gray-400 hover:text-white transition-colors">
                Multi-Chain
              </Link>
              <Link href="/auth" className="text-sm text-blue-400 font-medium">
                SIWE Auth
              </Link>
              <a
                href="https://github.com/cinaseek/onux"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="py-16 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Sign-In with Ethereum
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              SIWE Auth
            </span>
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Authenticate users with their wallet. No passwords, no accounts to manage — just a signature.
            <br />
            <span className="text-gray-500">One message to prove ownership. Zero friction.</span>
          </p>
        </section>

        {/* Step Progress Indicator */}
        <section className="mb-10">
          <div className="flex items-center justify-center gap-0">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex items-center">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  i < stepIndex
                    ? 'bg-green-500/15 text-green-400 border border-green-500/25'
                    : i === stepIndex
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 ring-2 ring-blue-500/20'
                    : 'bg-gray-800/40 text-gray-500 border border-gray-800'
                }`}>
                  {i < stepIndex ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                      style={{ borderColor: i === stepIndex ? 'rgb(96 165 250)' : 'rgb(107 114 128)', color: i === stepIndex ? 'rgb(96 165 250)' : 'rgb(107 114 128)' }}>
                      {i + 1}
                    </span>
                  )}
                  {label}
                </div>
                {i < stepLabels.length - 1 && (
                  <div className={`w-8 sm:w-12 h-0.5 mx-1 sm:mx-2 ${
                    i < stepIndex ? 'bg-green-500/40' : 'bg-gray-800'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Main Auth Flow */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Left: Interactive Flow */}
          <div className="space-y-6">
            {/* Step 1: Connect Wallet */}
            <div className={`rounded-2xl border transition-all duration-300 ${
              step === 'connect'
                ? 'bg-gray-900/80 border-blue-500/30 shadow-lg shadow-blue-500/5'
                : stepIndex > 0
                ? 'bg-gray-900/50 border-green-500/20'
                : 'bg-gray-900/30 border-gray-800'
            }`}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    stepIndex > 0 ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {stepIndex > 0 ? '✓' : '1'}
                  </div>
                  <h3 className="text-lg font-semibold">Connect Wallet</h3>
                </div>

                {step === 'connect' ? (
                  <div className="space-y-4">
                    <p className="text-gray-400 text-sm">Select a chain and connect your wallet to begin authentication.</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {SUPPORTED_CHAINS.map((chain) => (
                        <button
                          key={chain.name}
                          onClick={() => setSelectedChain(chain)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            selectedChain.name === chain.name
                              ? `bg-gradient-to-r ${chain.color} text-white shadow-md`
                              : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                          }`}
                        >
                          {chain.symbol} {chain.name}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleConnect}
                      disabled={isLoading}
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Connecting...
                        </span>
                      ) : (
                        '🔗 Connect Wallet'
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm text-green-400 font-medium">Connected</p>
                      <p className="text-xs text-gray-400 font-mono">{MOCK_ADDRESS.slice(0, 10)}...{MOCK_ADDRESS.slice(-4)} · {selectedChain.name}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Sign Message */}
            <div className={`rounded-2xl border transition-all duration-300 ${
              step === 'sign'
                ? 'bg-gray-900/80 border-blue-500/30 shadow-lg shadow-blue-500/5'
                : stepIndex > 1
                ? 'bg-gray-900/50 border-green-500/20'
                : 'bg-gray-900/30 border-gray-800'
            }`}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    stepIndex > 1 ? 'bg-green-500/20 text-green-400' : step === 'sign' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700/50 text-gray-500'
                  }`}>
                    {stepIndex > 1 ? '✓' : '2'}
                  </div>
                  <h3 className="text-lg font-semibold">Sign Message</h3>
                </div>

                {step === 'sign' ? (
                  <div className="space-y-4">
                    <p className="text-gray-400 text-sm">Review and sign the SIWE message to prove wallet ownership.</p>
                    <div className="rounded-xl bg-gray-950 border border-gray-800 p-4 font-mono text-xs text-gray-300 overflow-x-auto whitespace-pre leading-relaxed">
                      {siweMessage}
                    </div>
                    <button
                      onClick={handleSign}
                      disabled={isLoading}
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Signing...
                        </span>
                      ) : (
                        '✍️ Sign Message'
                      )}
                    </button>
                  </div>
                ) : stepIndex > 1 ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm text-green-400 font-medium">Message signed</p>
                      <p className="text-xs text-gray-400 font-mono truncate">{MOCK_SIGNATURE.slice(0, 66)}...</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">Connect wallet to continue</p>
                )}
              </div>
            </div>

            {/* Step 3: Verify */}
            <div className={`rounded-2xl border transition-all duration-300 ${
              step === 'verify'
                ? 'bg-gray-900/80 border-blue-500/30 shadow-lg shadow-blue-500/5'
                : stepIndex > 2
                ? 'bg-gray-900/50 border-green-500/20'
                : 'bg-gray-900/30 border-gray-800'
            }`}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    stepIndex > 2 ? 'bg-green-500/20 text-green-400' : step === 'verify' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700/50 text-gray-500'
                  }`}>
                    {stepIndex > 2 ? '✓' : '3'}
                  </div>
                  <h3 className="text-lg font-semibold">Verify Signature</h3>
                </div>

                {step === 'verify' ? (
                  <div className="space-y-4">
                    <p className="text-gray-400 text-sm">Verify the signature on-chain to complete authentication.</p>
                    <button
                      onClick={handleVerify}
                      disabled={isLoading}
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Verifying...
                        </span>
                      ) : (
                        '🔐 Verify Signature'
                      )}
                    </button>
                  </div>
                ) : stepIndex > 2 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                      <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm text-green-400 font-medium">Signature verified</p>
                        <p className="text-xs text-gray-400">Recovered address matches signer</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-800">
                        <span className="text-gray-500">Valid</span>
                        <p className="text-green-400 font-semibold mt-1">✓ True</p>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-800">
                        <span className="text-gray-500">Nonce</span>
                        <p className="text-gray-300 font-mono mt-1 truncate">{MOCK_NONCE.slice(0, 12)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">Sign message to continue</p>
                )}
              </div>
            </div>
          </div>

          {/* Right: SIWE Message Preview & Profile */}
          <div className="space-y-6">
            {/* SIWE Message Preview */}
            <div className="rounded-2xl bg-gray-900/80 border border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span className="text-purple-400">📋</span> SIWE Message Format
                </h3>
                <span className="text-xs text-gray-500 font-mono">EIP-4361</span>
              </div>
              <div className="rounded-xl bg-gray-950 border border-gray-800 p-4 font-mono text-xs text-gray-300 overflow-x-auto whitespace-pre leading-relaxed select-all">
                {siweMessage}
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Standardized per <a href="https://eips.ethereum.org/EIPS/eip-4361" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">EIP-4361</a> — the canonical Sign-In with Ethereum format.
              </p>
            </div>

            {/* User Profile Card (shown when done) */}
            {step === 'done' ? (
              <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-900/80 border border-green-500/20 p-6 shadow-lg shadow-green-500/5">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg font-bold shadow-lg">
                    0x
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-400">Authenticated</h3>
                    <p className="text-xs text-gray-400">Session active</p>
                  </div>
                  <div className="ml-auto">
                    <button
                      onClick={handleReset}
                      className="text-xs text-gray-500 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-500"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                    <span className="text-sm text-gray-500">Address</span>
                    <span className="text-sm font-mono text-gray-300">{MOCK_ADDRESS}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                    <span className="text-sm text-gray-500">Chain</span>
                    <span className="text-sm text-gray-300">{selectedChain.name} (ID: {selectedChain.chainId})</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                    <span className="text-sm text-gray-500">Nonce</span>
                    <span className="text-xs font-mono text-gray-400">{MOCK_NONCE}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                    <span className="text-sm text-gray-500">Signature</span>
                    <span className="text-xs font-mono text-gray-400 truncate max-w-[200px]">{MOCK_SIGNATURE}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-500">Issued At</span>
                    <span className="text-xs text-gray-400">{MOCK_ISSUED_AT}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-gray-900/30 border border-gray-800 p-6 flex flex-col items-center justify-center min-h-[280px]">
                <div className="w-16 h-16 rounded-2xl bg-gray-800/50 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm text-center">Complete all steps to see your<br />authenticated profile card</p>
              </div>
            )}
          </div>
        </div>

        {/* Supported Chains */}
        <section className="py-12 border-t border-gray-800/50 mb-16">
          <p className="text-center text-sm text-gray-500 mb-8 uppercase tracking-wider font-medium">
            Supported Chains
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {SUPPORTED_CHAINS.map((chain) => (
              <div
                key={chain.name}
                className="group flex flex-col items-center gap-2 px-5 py-4 rounded-2xl bg-gray-800/30 border border-gray-800 hover:border-gray-600 transition-all cursor-default"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${chain.color} flex items-center justify-center text-lg font-bold shadow-lg group-hover:scale-110 transition-transform`}>
                  {chain.symbol}
                </div>
                <span className="text-xs text-gray-400 group-hover:text-gray-200 transition-colors">
                  {chain.name}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Code Example */}
        <section className="mb-16">
          <div className="rounded-2xl bg-gray-900/80 border border-gray-800 p-6 sm:p-8">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <span className="text-green-400">⚡</span> Implement SIWE in 3 Lines
            </h3>
            <p className="text-gray-400 text-sm mb-5">CinaConnect handles the complexity. You write the UX.</p>
            <div className="rounded-xl bg-gray-950 border border-gray-800 p-4 font-mono text-xs text-gray-300 overflow-x-auto whitespace-pre leading-relaxed">
              {SIWE_CODE_EXAMPLE}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="mb-20">
          <h3 className="text-xl font-bold mb-6 text-center">CinaConnect vs Reown (WalletConnect)</h3>
          <div className="overflow-x-auto rounded-2xl border border-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900/80">
                  <th className="text-left p-4 font-semibold text-gray-300 border-b border-gray-800">Feature</th>
                  <th className="text-center p-4 font-semibold border-b border-gray-800">
                    <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">CinaConnect</span>
                  </th>
                  <th className="text-center p-4 font-semibold border-b border-gray-800 text-gray-400">Reown</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['SIWE Support', '✅ Built-in', '✅ Available'],
                  ['Self-Hosted', '✅ Full control', '❌ Cloud-only'],
                  ['Open Source', '✅ MIT License', '⚠️ Partial'],
                  ['No Vendor Lock-in', '✅ Yes', '❌ Proprietary API'],
                  ['Multi-Chain SIWE', '✅ EVM + Solana', '✅ EVM only'],
                  ['Session Keys', '✅ Account Abstraction', '❌ Not supported'],
                  ['Gas Sponsorship', '✅ Built-in', '❌ Separate product'],
                  ['Pricing', '✅ Free forever', '💰 Tiered / paid'],
                  ['Custom Domains', '✅ Your infrastructure', '❌ WalletConnect relay'],
                ].map(([feature, cina, reown], i) => (
                  <tr key={feature} className={i % 2 === 0 ? 'bg-gray-900/40' : ''}>
                    <td className="p-4 text-gray-300 border-b border-gray-800/50 font-medium">{feature}</td>
                    <td className="p-4 text-center border-b border-gray-800/50 text-blue-400">{cina}</td>
                    <td className="p-4 text-center border-b border-gray-800/50 text-gray-400">{reown}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-gray-500">
          CinaConnect SIWE Demo — Self-hosted authentication, zero vendor lock-in
        </div>
      </footer>
    </div>
  );
}
