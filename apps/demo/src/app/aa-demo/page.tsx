'use client';

import { useState, useCallback } from 'react';
import DemoLayout from '@/components/DemoLayout';
import { useWallet, shortenAddress } from '@/lib/useWallet';
import { useToast } from '@/lib/toast';

/* ── types ── */

interface SessionKey {
  id: string;
  name: string;
  address: string;
  permissions: string[];
  expiry: string;
  active: boolean;
}

/* ── mock data ── */

const MOCK_SESSION_KEYS: SessionKey[] = [
  {
    id: 'sk-1',
    name: 'Trading Session',
    address: '0xaB58...f3E2',
    permissions: ['swap', 'approve'],
    expiry: '2026-06-01',
    active: true,
  },
  {
    id: 'sk-2',
    name: 'NFT Minting',
    address: '0xcD91...a7C4',
    permissions: ['mint', 'approve'],
    expiry: '2026-05-28',
    active: false,
  },
];

const MOCK_GAS_SPONSORS = [
  { name: 'App Sponsor', status: 'active', covered: '100%' },
  { name: 'Paymaster Pool', status: 'active', covered: '50%' },
  { name: 'Free Tier', status: 'limited', covered: '10 tx/day' },
];

/* ── Toggle Switch ── */

function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center ${
        checked ? 'bg-[var(--cc-link)]' : 'bg-[var(--cc-canvas-soft-2)]'
      }`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-[var(--cc-canvas)] shadow-md transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

/* ── main page ── */

export default function AADemoPage() {
  const { account, status, connectors, connect, disconnect } = useWallet();
  const { success, error: toastError, info } = useToast();
  const isConnected = status === 'connected';

  // Smart account state
  const [smartAccount, setSmartAccount] = useState<string | null>(null);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

  // Session keys
  const [sessionKeys, setSessionKeys] = useState<SessionKey[]>(MOCK_SESSION_KEYS);
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  // Gas sponsorship
  const [gasSponsored, setGasSponsored] = useState(true);
  const [txCount, setTxCount] = useState(47);

  // Batch demo
  type BatchTxStatus = 'ready' | 'pending' | 'completed';
  interface BatchTx { to: string; action: string; amount: string; status: BatchTxStatus }
  const [batchTxs, setBatchTxs] = useState<BatchTx[]>([
    { to: '0x1234...5678', action: 'Transfer', amount: '0.1 ETH', status: 'ready' },
    { to: '0xabcd...ef01', action: 'Approve', amount: '1000 USDC', status: 'ready' },
    { to: '0x9876...5432', action: 'Swap', amount: '0.05 ETH → USDC', status: 'ready' },
  ]);
  const [batchExecuting, setBatchExecuting] = useState(false);

  const handleConnect = useCallback(() => {
    connect(connectors.find((c) => c.id === 'io.metamask')?.id ?? 'io.metamask');
  }, [connect, connectors]);

  /* DEMO ONLY — simulated smart account creation for demonstration purposes */
  /* In production, this would deploy a real smart account contract */
  const handleCreateSmartAccount = useCallback(async () => {
    if (!isConnected || !account.address) return;
    setCreatingAccount(true);

    // Simulate account creation delay
    await new Promise((r) => setTimeout(r, 2000));

    // Generate a demo address (clearly labeled as simulated)
    const newAddr = `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`;
    setSmartAccount(newAddr);
    setAccountCreated(true);
    setCreatingAccount(false);
    success('Demo Smart Account Created', `Simulated address: 0x${account.address.slice(2, 6)}...${account.address.slice(-4)}`);
  }, [isConnected, account.address, success]);

  /* DEMO ONLY — simulated session key creation for demonstration purposes */
  /* In production, this would create a real session key with actual permissions */
  const handleCreateSessionKey = useCallback(() => {
    if (!newKeyName.trim()) {
      toastError('Validation Error', 'Please enter a name for the session key');
      return;
    }

    // Generate a demo session key (clearly labeled as simulated)
    const newKey: SessionKey = {
      id: `sk-${Date.now()}`,
      name: newKeyName.trim(),
      address: `Demo: 0x${Math.random().toString(16).slice(2, 6).toUpperCase()}...${Math.random().toString(16).slice(2, 6).toUpperCase()}`,
      permissions: ['swap'],
      expiry: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      active: true,
    };

    setSessionKeys((prev) => [newKey, ...prev]);
    setNewKeyName('');
    setShowCreateKey(false);
    success('Demo Session Key Created', `${newKey.name} (simulated)`);
  }, [newKeyName, success, toastError]);

  const handleToggleKey = useCallback((id: string) => {
    setSessionKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, active: !k.active } : k))
    );
  }, []);

  const handleRemoveKey = useCallback((id: string) => {
    setSessionKeys((prev) => prev.filter((k) => k.id !== id));
    info('Session Key Removed', 'Key has been revoked');
  }, [info]);

  const handleExecuteBatch = useCallback(async () => {
    if (!smartAccount) {
      toastError('No Smart Account', 'Create a smart account first');
      return;
    }

    setBatchExecuting(true);
    setBatchTxs((prev: BatchTx[]) => prev.map((t) => ({ ...t, status: 'pending' })));

    // Simulate batch execution
    for (let i = 0; i < batchTxs.length; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      setBatchTxs((prev) =>
        prev.map((t, j) => (j <= i ? { ...t, status: 'completed' as const } : t))
      );
    }

    setBatchExecuting(false);
    setTxCount((c) => c + batchTxs.length);
    success('Batch Executed', `${batchTxs.length} transactions completed`);
  }, [smartAccount, batchTxs, success, toastError]);

  return (
    <DemoLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* ── Header ── */}
        <div className="text-center space-y-2">
          <h1 className="text-[32px] font-semibold tracking-tighter bg-gradient-to-r from-[var(--cc-violet)] via-[var(--cc-highlight-pink)] to-[var(--cc-link)] bg-clip-text text-transparent">
            Account Abstraction Demo
          </h1>
          <p className="text-[var(--cc-muted)] text-[14px]">ERC-4337 smart accounts, session keys, gas sponsorship, and batch transactions</p>
        </div>

        {/* ── Wallet connect ── */}
        <div className="flex items-center justify-between bg-[var(--cc-canvas-soft-2)]/40 backdrop-blur rounded-[var(--cc-radius-md)] border border-[var(--cc-hairline-strong)]/50 px-5 py-4">
          {isConnected ? (
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-gradient-to-br from-[var(--cc-violet)] to-[var(--cc-violet-deep)] flex items-center justify-center text-[12px] font-semibold tracking-tighter text-[var(--cc-ink)]">
                {account.address?.slice(2, 4).toUpperCase()}
              </div>
              <div>
                <p className="text-[14px] font-[var(--font-mono)] text-[var(--cc-body)]">{shortenAddress(account.address ?? '')}</p>
                <p className="text-[12px] text-[var(--cc-body)]">{account.chainName}</p>
              </div>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              className="px-5 py-3 rounded-md text-[14px] font-semibold bg-violet-600 hover:bg-violet-500 text-[var(--cc-ink)] transition-all"
            >
              Connect Wallet
            </button>
          )}
          {isConnected && (
            <button
              onClick={() => disconnect()}
              className="px-4 py-2 rounded-md text-[12px] font-semibold bg-[var(--cc-canvas-soft-2)]/60 text-[var(--cc-body)] border border-[var(--cc-hairline-strong)]/40 hover:text-[var(--cc-ink)] transition-all"
            >
              Disconnect
            </button>
          )}
        </div>

        {/* ═══════════════════════════════════════════
            Section 1: Smart Account Creation
           ═══════════════════════════════════════════ */}
        <div className="bg-[var(--cc-canvas-soft-2)]/60 backdrop-blur-xl rounded-[var(--cc-radius-md)] border border-[var(--cc-hairline-strong)]/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--cc-hairline-strong)]/50 flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-semibold tracking-tighter text-[var(--cc-ink)]">🏦 Smart Account</h2>
              <p className="text-[12px] text-[var(--cc-body)] mt-1">ERC-4337 Account Abstraction wallet</p>
            </div>
            {accountCreated && smartAccount && (
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-semibold bg-[var(--cc-success)]/15 text-[var(--cc-success)] border border-[var(--cc-success)]/25">
                <span className="size-2 rounded-full bg-[var(--cc-success)] animate-pulse" />
                Deployed
              </span>
            )}
          </div>

          <div className="p-5 space-y-4">
            {!isConnected && (
              <div className="text-center py-6 text-[14px] text-[var(--cc-body)]">
                Connect your wallet to create a smart account
              </div>
            )}

            {isConnected && !accountCreated && (
              <>
                {/* How it works */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { step: '1', title: 'Deploy', desc: 'Create smart contract wallet' },
                    { step: '2', title: 'Configure', desc: 'Set session keys & permissions' },
                    { step: '3', title: 'Use', desc: 'Gasless, batched transactions' },
                  ].map((s) => (
                    <div key={s.step} className="text-center p-3 rounded-md bg-[var(--cc-canvas)]/40 border border-[var(--cc-hairline)]/40">
                      <div className="size-8 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-[14px] font-semibold mx-auto mb-2">
                        {s.step}
                      </div>
                      <p className="text-[14px] font-semibold text-[var(--cc-body)]">{s.title}</p>
                      <p className="text-[12px] text-[var(--cc-body)] mt-1">{s.desc}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleCreateSmartAccount}
                  disabled={creatingAccount}
                  className={`w-full py-4 rounded-md font-semibold text-[14px] transition-all ${
                    creatingAccount
                      ? 'bg-violet-500/60 text-[var(--cc-ink)] cursor-wait'
                      : 'bg-[var(--cc-primary)] text-[var(--cc-on-primary)] hover:opacity-90 shadow-[var(--cc-level3)]'
                  }`}
                >
                  {creatingAccount ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Deploying Smart Account...
                    </span>
                  ) : (
                    'Create Smart Account'
                  )}
                </button>
              </>
            )}

            {accountCreated && smartAccount && (
              <div className="space-y-4">
                <div className="p-4 rounded-md bg-[var(--cc-canvas)]/60 border border-[var(--cc-hairline-strong)]/40">
                  <p className="text-[12px] text-[var(--cc-body)] mb-1">Smart Account Address</p>
                  <p className="font-[var(--font-mono)] text-[14px] text-violet-400">{smartAccount}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-md bg-[var(--cc-canvas)]/40 border border-[var(--cc-hairline)]/40">
                    <p className="text-[12px] text-[var(--cc-body)]">Owner</p>
                    <p className="text-[12px] font-[var(--font-mono)] text-[var(--cc-body)] mt-1">{shortenAddress(account.address ?? '')}</p>
                  </div>
                  <div className="p-3 rounded-md bg-[var(--cc-canvas)]/40 border border-[var(--cc-hairline)]/40">
                    <p className="text-[12px] text-[var(--cc-body)]">ERC-4337</p>
                    <p className="text-[12px] text-[var(--cc-success)] mt-1 font-semibold">Supported ✓</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            Section 2: Session Key Management
           ═══════════════════════════════════════════ */}
        <div className="bg-[var(--cc-canvas-soft-2)]/60 backdrop-blur-xl rounded-[var(--cc-radius-md)] border border-[var(--cc-hairline-strong)]/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--cc-hairline-strong)]/50 flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-semibold tracking-tighter text-[var(--cc-ink)]">🔑 Session Keys</h2>
              <p className="text-[12px] text-[var(--cc-body)] mt-1">Temporary keys with limited permissions</p>
            </div>
            <button
              onClick={() => setShowCreateKey(!showCreateKey)}
              className="px-3 py-2 rounded-lg text-[12px] font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/30 hover:bg-violet-500/25 transition-all"
            >
              + New Key
            </button>
          </div>

          <div className="p-5 space-y-3">
            {/* Create key form */}
            {showCreateKey && (
              <div className="p-4 rounded-md bg-[var(--cc-canvas)]/50 border border-[var(--cc-hairline-strong)]/40 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Key name (e.g., Trading Bot)"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[var(--cc-canvas-soft-2)]/80 border border-[var(--cc-hairline-strong)]/50 rounded-lg text-[14px] text-[var(--cc-body)] placeholder:text-[var(--cc-body)] focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                  <button
                    onClick={handleCreateSessionKey}
                    disabled={!newKeyName.trim()}
                    className="px-4 py-2 rounded-lg text-[14px] font-semibold bg-violet-600 hover:bg-violet-500 text-[var(--cc-ink)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Create
                  </button>
                </div>
                <div className="flex gap-2">
                  {['swap', 'approve', 'mint', 'transfer'].map((p) => (
                    <span key={p} className="px-2 py-1 rounded text-[12px] font-medium bg-[var(--cc-canvas-soft-2)]/50 text-[var(--cc-muted)] border border-[var(--cc-hairline-strong)]/40">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Key list */}
            {sessionKeys.map((key) => (
              <div
                key={key.id}
                className={`p-4 rounded-md border transition-all ${
                  key.active
                    ? 'bg-violet-500/5 border-violet-500/30'
                    : 'bg-[var(--cc-canvas)]/30 border-[var(--cc-hairline)]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`size-8 rounded-md flex items-center justify-center text-[14px] font-semibold ${
                      key.active
                        ? 'bg-violet-500/20 text-violet-400'
                        : 'bg-[var(--cc-canvas-soft-2)]/50 text-[var(--cc-body)]'
                    }`}>
                      🔑
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-[var(--cc-body)]">{key.name}</p>
                      <p className="text-[12px] text-[var(--cc-body)] font-[var(--font-mono)]">{key.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ToggleSwitch checked={key.active} onChange={() => handleToggleKey(key.id)} label={`Toggle ${key.name}`} />
                    <button
                      onClick={() => handleRemoveKey(key.id)}
                      className="text-[12px] text-[var(--cc-error)] hover:text-[var(--cc-error-deep)] transition-colors px-2 py-1 rounded hover:bg-[var(--cc-error)]/10"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {key.permissions.map((p) => (
                    <span key={p} className="px-2 py-1 rounded text-[12px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                      {p}
                    </span>
                  ))}
                  <span className="px-2 py-1 rounded text-[12px] font-medium bg-[var(--cc-canvas-soft-2)]/50 text-[var(--cc-muted)]">
                    Expires: {key.expiry}
                  </span>
                </div>
              </div>
            ))}

            {sessionKeys.length === 0 && (
              <div className="text-center py-8 text-[14px] text-[var(--cc-body)]">
                No session keys. Create one to enable delegated transactions.
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            Section 3: Gas Sponsorship
           ═══════════════════════════════════════════ */}
        <div className="bg-[var(--cc-canvas-soft-2)]/60 backdrop-blur-xl rounded-[var(--cc-radius-md)] border border-[var(--cc-hairline-strong)]/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--cc-hairline-strong)]/50 flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-semibold tracking-tighter text-[var(--cc-ink)]">⛽ Gas Sponsorship</h2>
              <p className="text-[12px] text-[var(--cc-body)] mt-1">Paymaster coverage — users don't pay gas</p>
            </div>
            <ToggleSwitch checked={gasSponsored} onChange={setGasSponsored} label="Toggle gas sponsorship" />
          </div>

          <div className="p-5 space-y-4">
            {gasSponsored && (
              <div className="p-4 rounded-md bg-[var(--cc-success)]/10 border border-[var(--cc-success)]/20">
                <div className="flex items-center gap-3">
                  <span className="text-[24px]">✓</span>
                  <div>
                    <p className="text-[14px] font-semibold text-[var(--cc-success)]">Gas Sponsorship Active</p>
                    <p className="text-[12px] text-[var(--cc-muted)] mt-1">All transactions will be sponsored by the paymaster</p>
                  </div>
                </div>
              </div>
            )}

            {/* Sponsor sources */}
            <div className="grid grid-cols-3 gap-3">
              {MOCK_GAS_SPONSORS.map((s) => (
                <div key={s.name} className="p-3 rounded-md bg-[var(--cc-canvas)]/40 border border-[var(--cc-hairline)]/40 text-center">
                  <p className="text-[12px] font-semibold text-[var(--cc-body)]">{s.name}</p>
                  <p className={`text-[12px] font-semibold mt-1 ${
                    s.status === 'active' ? 'text-[var(--cc-success)]' : 'text-[var(--cc-warning)]'
                  }`}>
                    {s.status === 'active' ? '✓ Active' : '⚠ Limited'}
                  </p>
                  <p className="text-[12px] text-[var(--cc-body)] mt-1">Covers: {s.covered}</p>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-md bg-[var(--cc-canvas)]/50 border border-[var(--cc-hairline)]/50 text-center">
                <p className="text-[24px] font-semibold tracking-tighter bg-gradient-to-r from-[var(--cc-link)]/80 to-[var(--cc-link)] bg-clip-text text-transparent">
                  {txCount}
                </p>
                <p className="text-[12px] text-[var(--cc-body)] mt-1">Gasless TXs</p>
              </div>
              <div className="p-3 rounded-md bg-[var(--cc-canvas)]/50 border border-[var(--cc-hairline)]/50 text-center">
                {/* TODO: Calculate real gas saved from on-chain data */}
                <p className="text-[24px] font-semibold tracking-tighter bg-gradient-to-r from-[var(--cc-link)] to-[var(--cc-violet)] bg-clip-text text-transparent">
                  ~$2.40
                </p>
                <p className="text-[12px] text-[var(--cc-body)] mt-1">Gas Saved</p>
              </div>
              <div className="p-3 rounded-md bg-[var(--cc-canvas)]/50 border border-[var(--cc-hairline)]/50 text-center">
                <p className="text-[24px] font-semibold tracking-tighter bg-gradient-to-r from-[var(--cc-violet)]/70 to-[var(--cc-violet-deep)]/70 bg-clip-text text-transparent">
                  0
                </p>
                <p className="text-[12px] text-[var(--cc-body)] mt-1">User Gas Paid</p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            Section 4: Batch Transaction Demo
           ═══════════════════════════════════════════ */}
        <div className="bg-[var(--cc-canvas-soft-2)]/60 backdrop-blur-xl rounded-[var(--cc-radius-md)] border border-[var(--cc-hairline-strong)]/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--cc-hairline-strong)]/50">
            <h2 className="text-[18px] font-semibold tracking-tighter text-[var(--cc-ink)]">📦 Batch Transaction Demo</h2>
            <p className="text-[12px] text-[var(--cc-body)] mt-1">Execute multiple transactions in a single user operation</p>
          </div>

          <div className="p-5 space-y-3">
            {/* Transaction list */}
            {batchTxs.map((tx, i) => (
              <div
                key={i}
                className={`p-3 rounded-md border transition-all ${
                  tx.status === 'completed'
                    ? 'bg-[var(--cc-success)]/5 border-[var(--cc-success)]/25'
                    : tx.status === 'pending'
                    ? 'bg-[var(--cc-warning)]/5 border-[var(--cc-warning)]/25'
                    : 'bg-[var(--cc-canvas)]/40 border-[var(--cc-hairline)]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`size-6 rounded-full flex items-center justify-center text-[12px] font-semibold ${
                      tx.status === 'completed'
                        ? 'bg-[var(--cc-success)]/20 text-[var(--cc-success)]'
                        : tx.status === 'pending'
                        ? 'bg-[var(--cc-warning)]/20 text-[var(--cc-warning)]'
                        : 'bg-[var(--cc-canvas-soft-2)]/50 text-[var(--cc-body)]'
                    }`}>
                      {tx.status === 'completed' ? '✓' : tx.status === 'pending' ? '⏳' : (i + 1)}
                    </span>
                    <div>
                      <p className="text-[14px] font-medium text-[var(--cc-body)]">{tx.action}</p>
                      <p className="text-[12px] text-[var(--cc-body)] font-[var(--font-mono)]">{tx.to}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[14px] font-semibold text-[var(--cc-body)]">{tx.amount}</p>
                    <p className={`text-[12px] font-semibold ${
                      tx.status === 'completed' ? 'text-[var(--cc-success)]' : tx.status === 'pending' ? 'text-[var(--cc-warning)]' : 'text-[var(--cc-body)]'
                    }`}>
                      {tx.status}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Execute button */}
            <button
              onClick={handleExecuteBatch}
              disabled={batchExecuting || !smartAccount}
              className={`w-full py-4 rounded-md font-semibold text-[14px] transition-all ${
                batchExecuting
                  ? 'bg-violet-500/60 text-[var(--cc-ink)] cursor-wait'
                  : smartAccount
                  ? 'bg-[var(--cc-primary)] text-[var(--cc-on-primary)] hover:opacity-90 shadow-[var(--cc-level3)]'
                  : 'bg-[var(--cc-canvas-soft-2)]/60 text-[var(--cc-body)] cursor-not-allowed'
              }`}
            >
              {batchExecuting ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Executing Batch...
                </span>
              ) : (
                `Execute ${batchTxs.length} Transactions (Single UserOp)`
              )}
            </button>

            {!smartAccount && (
              <p className="text-[12px] text-[var(--cc-body)] text-center">Create a smart account first to execute batch transactions</p>
            )}

            {gasSponsored && (
              <div className="flex items-center gap-2 text-[12px] text-[var(--cc-success)]">
                <span>⛽</span>
                <span>Gas will be sponsored — you won't pay any gas fees</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Info Section ── */}
        <div className="bg-violet-500/5 border border-violet-500/20 rounded-[var(--cc-radius-md)] p-6 space-y-4">
          <h3 className="text-[16px] font-semibold tracking-tighter text-violet-400">What is Account Abstraction?</h3>
          <p className="text-[14px] text-[var(--cc-muted)] leading-relaxed">
            ERC-4337 enables smart contract wallets that replace EOAs. Users get features like social recovery,
            session keys, batched transactions, and gas sponsorship — all without changing the Ethereum consensus layer.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '🔑', title: 'Session Keys', desc: 'Delegate specific permissions temporarily' },
              { icon: '⛽', title: 'Gas Sponsorship', desc: 'Apps pay gas on behalf of users' },
              { icon: '📦', title: 'Batch Transactions', desc: 'Multiple actions in one UserOperation' },
              { icon: '🔄', title: 'Social Recovery', desc: 'Recover accounts via guardians' },
            ].map((f) => (
              <div key={f.title} className="p-3 rounded-md bg-[var(--cc-canvas)]/40 border border-[var(--cc-hairline)]/40">
                <div className="text-[18px] mb-1">{f.icon}</div>
                <p className="text-[12px] font-semibold text-[var(--cc-body)]">{f.title}</p>
                <p className="text-[12px] text-[var(--cc-body)] mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Code Example ── */}
        <div className="bg-[var(--cc-canvas-soft-2)]/60 backdrop-blur-xl rounded-[var(--cc-radius-md)] border border-[var(--cc-hairline-strong)]/60 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--cc-hairline-strong)]/40">
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[var(--cc-error)]/70" />
                <div className="w-3 h-3 rounded-full bg-[var(--cc-warning)]/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <span className="text-[12px] text-[var(--cc-body)] font-[var(--font-mono)]">userop-example.ts</span>
            </div>
            <span className="text-[12px] px-2 py-1 rounded bg-[var(--cc-canvas-soft-2)]/50 text-[var(--cc-muted)]">TypeScript</span>
          </div>
          <pre className="p-5 text-[12px] text-[var(--cc-body)] font-[var(--font-mono)] overflow-x-auto leading-relaxed">
{`import { createBundlerClient } from '@cinacoin/aa';

// Create smart account
const bundler = createBundlerClient({
  chain: mainnet,
  entryPoint: '0x0000...0001',
});

// Send gasless batch transaction
const userOp = await bundler.sendUserOperation({
  calls: [
    { to: '0x1234', value: parseEther('0.1') },
    { to: '0x5678', data: encodeFunctionData(...) },
  ],
  paymaster: true,  // ⛽ Gas sponsored
  sessionKey: '0xabcd',  // 🔑 Session key
});

console.log('UserOp hash:', userOp.hash);`}
          </pre>
        </div>
      </div>
    </DemoLayout>
  );
}
