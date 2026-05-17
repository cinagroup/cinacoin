'use client';

import { useState, useEffect, useCallback } from 'react';
import DemoLayout from '@/components/DemoLayout';

// ─── Chain Data ───────────────────────────────────────────────────────────────

interface ChainDemo {
  id: string;
  name: string;
  icon: string;
  color: string;
  gradient: string;
  adapter: string;
  wallets: string[];
  nativeToken: string;
  status: 'operational' | 'degraded' | 'outage';
  latency: number;
  tvl: string;
  txCount: string;
}

const CHAINS: ChainDemo[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    icon: 'Ξ',
    color: 'from-blue-500 to-indigo-600',
    gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    adapter: 'EvmAdapter',
    wallets: ['MetaMask', 'WalletConnect', 'Coinbase Wallet', 'Rabby', 'Ledger'],
    nativeToken: 'ETH',
    status: 'operational',
    latency: 12,
    tvl: '$32.1B',
    txCount: '1.2M',
  },
  {
    id: 'polygon',
    name: 'Polygon',
    icon: '⬡',
    color: 'from-purple-500 to-violet-500',
    gradient: 'bg-gradient-to-br from-purple-500 to-violet-500',
    adapter: 'EvmAdapter',
    wallets: ['MetaMask', 'WalletConnect', 'Coinbase Wallet', 'Rabby'],
    nativeToken: 'MATIC',
    status: 'operational',
    latency: 2,
    tvl: '$1.2B',
    txCount: '3.8M',
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    icon: '⊡',
    color: 'from-sky-400 to-blue-500',
    gradient: 'bg-gradient-to-br from-sky-400 to-blue-500',
    adapter: 'EvmAdapter',
    wallets: ['MetaMask', 'WalletConnect', 'Rabby'],
    nativeToken: 'ETH',
    status: 'operational',
    latency: 1,
    tvl: '$3.8B',
    txCount: '2.1M',
  },
  {
    id: 'base',
    name: 'Base',
    icon: '⊙',
    color: 'from-blue-400 to-cyan-400',
    gradient: 'bg-gradient-to-br from-blue-400 to-cyan-400',
    adapter: 'EvmAdapter',
    wallets: ['MetaMask', 'Coinbase Wallet', 'WalletConnect', 'Rabby'],
    nativeToken: 'ETH',
    status: 'operational',
    latency: 2,
    tvl: '$2.5B',
    txCount: '5.4M',
  },
  {
    id: 'optimism',
    name: 'Optimism',
    icon: '🔴',
    color: 'from-red-500 to-pink-500',
    gradient: 'bg-gradient-to-br from-red-500 to-pink-500',
    adapter: 'EvmAdapter',
    wallets: ['MetaMask', 'WalletConnect', 'Coinbase Wallet', 'Rabby'],
    nativeToken: 'ETH',
    status: 'operational',
    latency: 2,
    tvl: '$1.5B',
    txCount: '1.8M',
  },
  {
    id: 'bsc',
    name: 'BNB Chain',
    icon: '◆',
    color: 'from-yellow-400 to-amber-500',
    gradient: 'bg-gradient-to-br from-yellow-400 to-amber-500',
    adapter: 'EvmAdapter',
    wallets: ['MetaMask', 'WalletConnect', 'Trust Wallet', 'SafePal'],
    nativeToken: 'BNB',
    status: 'operational',
    latency: 3,
    tvl: '$5.6B',
    txCount: '4.2M',
  },
  {
    id: 'solana',
    name: 'Solana',
    icon: '◎',
    color: 'from-green-400 to-emerald-500',
    gradient: 'bg-gradient-to-br from-green-400 to-emerald-500',
    adapter: 'SolanaChainAdapter',
    wallets: ['Phantom', 'Solflare', 'Backpack', 'Torus'],
    nativeToken: 'SOL',
    status: 'operational',
    latency: 1,
    tvl: '$8.9B',
    txCount: '28.3M',
  },
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    icon: '₿',
    color: 'from-orange-400 to-amber-600',
    gradient: 'bg-gradient-to-br from-orange-400 to-amber-600',
    adapter: 'BitcoinChainAdapter',
    wallets: ['Xverse', 'Leather', 'Unisat', 'OKX Wallet'],
    nativeToken: 'BTC',
    status: 'operational',
    latency: 10,
    tvl: '$142B',
    txCount: '380K',
  },
  {
    id: 'ton',
    name: 'TON',
    icon: '◇',
    color: 'from-sky-500 to-blue-600',
    gradient: 'bg-gradient-to-br from-sky-500 to-blue-600',
    adapter: 'TonChainAdapter',
    wallets: ['Tonkeeper', 'Tonhub', 'OpenMask', 'MyTonWallet'],
    nativeToken: 'TON',
    status: 'operational',
    latency: 2,
    tvl: '$480M',
    txCount: '12.1M',
  },
  {
    id: 'tron',
    name: 'TRON',
    icon: '⟐',
    color: 'from-red-500 to-red-700',
    gradient: 'bg-gradient-to-br from-red-500 to-red-700',
    adapter: 'TronChainAdapter',
    wallets: ['TronLink', 'SafePal', 'TokenPocket', 'imToken'],
    nativeToken: 'TRX',
    status: 'operational',
    latency: 3,
    tvl: '$7.2B',
    txCount: '6.5M',
  },
  {
    id: 'cosmos',
    name: 'Cosmos',
    icon: '⬢',
    color: 'from-indigo-400 to-violet-500',
    gradient: 'bg-gradient-to-br from-indigo-400 to-violet-500',
    adapter: 'CosmosChainAdapter',
    wallets: ['Keplr', 'Cosmostation', 'Leap', 'Trust Wallet'],
    nativeToken: 'ATOM',
    status: 'degraded',
    latency: 7,
    tvl: '$620M',
    txCount: '1.1M',
  },
  {
    id: 'sui',
    name: 'Sui',
    icon: '◈',
    color: 'from-cyan-400 to-blue-500',
    gradient: 'bg-gradient-to-br from-cyan-400 to-blue-500',
    adapter: 'SuiChainAdapter',
    wallets: ['Sui Wallet', 'Ethos', 'Surf', 'Suiet'],
    nativeToken: 'SUI',
    status: 'operational',
    latency: 1,
    tvl: '$1.8B',
    txCount: '15.7M',
  },
  {
    id: 'starknet',
    name: 'Starknet',
    icon: '⬣',
    color: 'from-zinc-400 to-zinc-600',
    gradient: 'bg-gradient-to-br from-zinc-400 to-zinc-600',
    adapter: 'StarknetChainAdapter',
    wallets: ['Argent X', 'Braavos', 'OKX Wallet', 'MetaMask (Snaps)'],
    nativeToken: 'STRK',
    status: 'operational',
    latency: 4,
    tvl: '$180M',
    txCount: '890K',
  },
  {
    id: 'near',
    name: 'NEAR',
    icon: 'Ⓝ',
    color: 'from-green-500 to-teal-500',
    gradient: 'bg-gradient-to-br from-green-500 to-teal-500',
    adapter: 'NearChainAdapter',
    wallets: ['MyNear Wallet', 'Meteor', 'Welldone', 'Sender'],
    nativeToken: 'NEAR',
    status: 'operational',
    latency: 2,
    tvl: '$95M',
    txCount: '2.4M',
  },
  {
    id: 'hedera',
    name: 'Hedera',
    icon: '⊞',
    color: 'from-slate-400 to-slate-600',
    gradient: 'bg-gradient-to-br from-slate-400 to-slate-600',
    adapter: 'HederaChainAdapter',
    wallets: ['Blade', 'HashPack', 'Kabana', 'Drip'],
    nativeToken: 'HBAR',
    status: 'operational',
    latency: 2,
    tvl: '$42M',
    txCount: '8.7M',
  },
  {
    id: 'xrpl',
    name: 'XRPL',
    icon: '✕',
    color: 'from-gray-400 to-slate-500',
    gradient: 'bg-gradient-to-br from-gray-400 to-slate-500',
    adapter: 'XrplChainAdapter',
    wallets: ['Xaman', 'XRPL Wallet', 'Tangem', 'SafePal'],
    nativeToken: 'XRP',
    status: 'operational',
    latency: 4,
    tvl: '$1.2B',
    txCount: '1.6M',
  },
];

// ─── Network Status Indicator ─────────────────────────────────────────────────

function StatusIndicator({ status }: { status: string }) {
  const color =
    status === 'operational'
      ? 'bg-emerald-400 shadow-emerald-400/60'
      : status === 'degraded'
        ? 'bg-amber-400 shadow-amber-400/60'
        : 'bg-red-500 shadow-red-500/60';

  return (
    <span className="relative flex h-3 w-3">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${color}`} />
      <span className={`relative inline-flex rounded-full h-3 w-3 shadow-md ${color}`} />
    </span>
  );
}

// ─── Chain Card ───────────────────────────────────────────────────────────────

interface ChainCardProps {
  chain: ChainDemo;
  connected: boolean;
  balance: string | null;
  onConnect: () => void;
}

function ChainCard({ chain, connected, balance, onConnect }: ChainCardProps) {
  return (
    <div className="group bg-gray-800/40 backdrop-blur rounded-2xl border border-gray-700/60 overflow-hidden hover:border-gray-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5">
      {/* Top gradient bar */}
      <div className={`h-1 bg-gradient-to-r ${chain.color} opacity-70 group-hover:opacity-100 transition-opacity`} />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${chain.gradient} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md`}>
              {chain.icon}
            </div>
            <div>
              <h3 className="font-semibold text-white">{chain.name}</h3>
              <div className="flex items-center gap-1.5">
                <StatusIndicator status={chain.status} />
                <span className="text-xs text-gray-400">
                  {chain.status === 'operational' ? 'Operational' : chain.status === 'degraded' ? 'Degraded' : 'Outage'}
                </span>
                <span className="text-xs text-gray-600">·</span>
                <span className="text-xs text-gray-500">{chain.latency}ms</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">{chain.nativeToken}</div>
            <div className="text-xs text-gray-600">TVL {chain.tvl}</div>
          </div>
        </div>

        {/* Wallets */}
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Wallets</div>
          <div className="flex flex-wrap gap-1.5">
            {chain.wallets.map((w) => (
              <span key={w} className="px-2.5 py-1 bg-gray-700/50 rounded-md text-xs text-gray-300 border border-gray-600/40">
                {w}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-700/40">
          <div>
            <div className="text-[11px] text-gray-500">Balance</div>
            <div className="text-sm font-mono text-white">{balance ?? '—'}</div>
          </div>
          <div>
            <div className="text-[11px] text-gray-500">24h Txs</div>
            <div className="text-sm font-mono text-gray-300">{chain.txCount}</div>
          </div>
          <div>
            <div className="text-[11px] text-gray-500">Status</div>
            <div className="text-sm text-white">
              {connected ? (
                <span className="text-emerald-400">Connected</span>
              ) : (
                <span className="text-gray-500">Disconnected</span>
              )}
            </div>
          </div>
        </div>

        {/* Connect Button */}
        <button
          onClick={onConnect}
          className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
            connected
              ? 'bg-gray-700/60 text-emerald-400 border border-emerald-500/30 hover:bg-gray-700/80'
              : `bg-gradient-to-r ${chain.color} text-white hover:opacity-90 hover:shadow-lg`
          }`}
        >
          {connected ? '✓  Connected' : `Connect ${chain.name}`}
        </button>
      </div>
    </div>
  );
}

// ─── Cross-Chain Flow Diagram ─────────────────────────────────────────────────

function CrossChainFlow() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { label: 'Initiate', detail: 'User selects chain A', icon: '🔗' },
    { label: 'Lock', detail: 'Assets locked on source', icon: '🔒' },
    { label: 'Relay', detail: 'CinaConnect Relay', icon: '⚡' },
    { label: 'Mint/Release', detail: 'Assets on chain B', icon: '🔓' },
    { label: 'Complete', detail: 'Cross-chain transfer', icon: '✅' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((s) => (s + 1) % steps.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="bg-gray-800/40 backdrop-blur rounded-2xl border border-gray-700/60 p-8 overflow-hidden">
      <h2 className="text-xl font-semibold text-white mb-2">Cross-Chain Flow</h2>
      <p className="text-sm text-gray-400 mb-8">Atomic cross-chain transfers powered by CinaConnect Relay protocol</p>

      {/* Animated flow pipeline */}
      <div className="relative">
        {/* Connection line */}
        <div className="absolute top-10 left-10 right-10 h-0.5 bg-gray-700">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Step nodes */}
        <div className="relative flex justify-between">
          {steps.map((step, i) => (
            <div key={step.label} className="flex flex-col items-center gap-3 z-10 w-32">
              <div
                className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl transition-all duration-500 ${
                  i <= activeStep
                    ? 'bg-gradient-to-br from-blue-500/30 to-purple-500/30 border-2 border-blue-400/50 shadow-lg shadow-blue-500/10 scale-105'
                    : 'bg-gray-800 border border-gray-700/60 opacity-50'
                }`}
              >
                {step.icon}
              </div>
              <div className="text-center">
                <div className={`text-sm font-semibold ${i <= activeStep ? 'text-white' : 'text-gray-500'}`}>
                  {step.label}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{step.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chain pair selector */}
      <div className="mt-10 flex items-center justify-center gap-4">
        <div className="bg-gray-700/60 rounded-xl px-5 py-3 border border-gray-600/40">
          <div className="text-xs text-gray-500">From</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              Ξ
            </div>
            <span className="text-sm font-semibold text-white">Ethereum</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Bridge</span>
        </div>

        <div className="bg-gray-700/60 rounded-xl px-5 py-3 border border-gray-600/40">
          <div className="text-xs text-gray-500">To</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
              ◎
            </div>
            <span className="text-sm font-semibold text-white">Solana</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Unified API Code Example ─────────────────────────────────────────────────

function UnifiedApiExample() {
  const [copied, setCopied] = useState(false);

  const code = `// CinaConnect — Unified Multi-Chain API
// One interface. Every chain. Zero complexity.

import { CinaConnect } from '@cinaconnect/sdk';

const client = new CinaConnect();

// 🔗 Connect to ANY chain with the same API
const eth = await client.connect('ethereum', 'MetaMask');
const sol = await client.connect('solana', 'Phantom');
const btc = await client.connect('bitcoin', 'Xverse');
const ton = await client.connect('ton', 'Tonkeeper');

// 💰 Read balances across chains
const balances = await Promise.all([
  client.getBalance('ethereum', eth.address),
  client.getBalance('solana', sol.address),
  client.getBalance('bitcoin', btc.address),
  client.getBalance('ton', ton.address),
]);

// ⚡ Cross-chain transfer
const tx = await client.transfer({
  from: { chain: 'ethereum', address: eth.address },
  to:   { chain: 'solana',   address: sol.address },
  amount: '0.5 ETH',
  slippage: 0.5,
});

// 📡 Listen to events on all chains
client.on('transaction', (event) => {
  console.log(\`[\${event.chain}] \${event.type}: \${event.hash}\`);
});`;

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="bg-gray-800/40 backdrop-blur rounded-2xl border border-gray-700/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/40">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <span className="text-sm text-gray-400 font-mono">unified-api.ts</span>
        </div>
        <button
          onClick={handleCopy}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            copied
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-gray-700/60 text-gray-400 border border-gray-600/40 hover:text-white hover:border-gray-500'
          }`}
        >
          {copied ? '✓ Copied' : '📋 Copy'}
        </button>
      </div>

      {/* Code */}
      <pre className="p-6 text-sm leading-relaxed overflow-x-auto">
        <code className="text-gray-300 font-mono whitespace-pre">
          {code.split('\n').map((line, i) => {
            let color = 'text-gray-300';
            if (line.trim().startsWith('//')) color = 'text-gray-500 italic';
            else if (line.includes('import') || line.includes('from')) color = 'text-purple-400';
            else if (line.includes('const') || line.includes('let')) color = 'text-sky-400';
            else if (line.includes('await')) color = 'text-amber-400';
            else if (line.includes('console')) color = 'text-green-400';
            else if (line.includes('new ')) color = 'text-emerald-400';

            return (
              <div key={i} className={`${color} ${i === 0 ? 'mt-0' : ''}`}>
                <span className="select-none text-gray-600 w-8 inline-block text-right mr-4">
                  {i + 1}
                </span>
                {line}
              </div>
            );
          })}
        </code>
      </pre>
    </div>
  );
}

// ─── Network Status Overview ─────────────────────────────────────────────────

function NetworkStatusOverview() {
  const operational = CHAINS.filter((c) => c.status === 'operational').length;
  const degraded = CHAINS.filter((c) => c.status === 'degraded').length;

  return (
    <div className="bg-gray-800/40 backdrop-blur rounded-2xl border border-gray-700/60 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Network Status</h2>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-gray-400">{operational} Operational</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-gray-400">{degraded} Degraded</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
        {CHAINS.map((chain) => (
          <div
            key={chain.id}
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-700/30 border border-gray-600/30 hover:border-gray-500/50 transition-colors"
          >
            <div className={`w-8 h-8 ${chain.gradient} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
              {chain.icon}
            </div>
            <StatusIndicator status={chain.status} />
            <span className="text-xs text-gray-400 truncate w-full text-center">{chain.name}</span>
            <span className="text-[10px] text-gray-500">{chain.latency}ms</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar() {
  const stats = [
    { label: 'Chains Supported', value: '16', icon: '🌐' },
    { label: 'Wallet Integrations', value: '52', icon: '🔑' },
    { label: 'Cross-Chain Txns', value: '1.2M+', icon: '⚡' },
    { label: 'Total TVL', value: '$210B+', icon: '💎' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-gray-800/40 backdrop-blur rounded-xl border border-gray-700/60 p-5 text-center hover:border-gray-500/50 transition-colors"
        >
          <div className="text-2xl mb-1">{s.icon}</div>
          <div className="text-2xl font-bold text-white">{s.value}</div>
          <div className="text-xs text-gray-500 mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MultiChainPage() {
  const [connectedChains, setConnectedChains] = useState<Record<string, boolean>>({});
  const [balances, setBalances] = useState<Record<string, string>>({});

  // Generate mock balances on connect
  const handleConnect = useCallback(
    (chainId: string) => {
      setConnectedChains((prev) => ({
        ...prev,
        [chainId]: !prev[chainId],
      }));

      if (!connectedChains[chainId]) {
        const chain = CHAINS.find((c) => c.id === chainId);
        if (chain) {
          const mockBalance = (Math.random() * 100).toFixed(4);
          setBalances((prev) => ({
            ...prev,
            [chainId]: `${mockBalance} ${chain.nativeToken}`,
          }));
        }
      } else {
        setBalances((prev) => {
          const next = { ...prev };
          delete next[chainId];
          return next;
        });
      }
    },
    [connectedChains],
  );

  const connectedCount = Object.values(connectedChains).filter(Boolean).length;

  return (
    <DemoLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4 py-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-400 mb-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            {connectedCount > 0
              ? `${connectedCount} chain${connectedCount > 1 ? 's' : ''} connected`
              : '16 chains · 52 wallets · 1 API'}
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
            Multi-Chain Connectivity
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            CinaConnect unifies wallet connections across 16 blockchains — from EVM to Solana, Bitcoin to TON — through a single, elegant API.
          </p>
        </div>

        {/* Stats */}
        <StatsBar />

        {/* Network Status Overview */}
        <NetworkStatusOverview />

        {/* Chain Cards Grid */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Chain Demos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {CHAINS.map((chain) => (
              <ChainCard
                key={chain.id}
                chain={chain}
                connected={!!connectedChains[chain.id]}
                balance={balances[chain.id] ?? null}
                onConnect={() => handleConnect(chain.id)}
              />
            ))}
          </div>
        </div>

        {/* Cross-Chain Flow */}
        <CrossChainFlow />

        {/* Unified API Example */}
        <UnifiedApiExample />

        {/* Footer hint */}
        <div className="text-center py-4">
          <p className="text-sm text-gray-600">
            Powered by{' '}
            <span className="text-gray-400 font-semibold">CinaConnect SDK</span>
            {' '}— one interface, every chain.
          </p>
        </div>
      </div>
    </DemoLayout>
  );
}
