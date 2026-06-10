#!/usr/bin/env node

/**
 * @cinacoin/cli — add command
 *
 * Add Cinacoin components to an existing project.
 *
 * Usage:
 *   npx @cinacoin/cli add connect-button
 *   npx @cinacoin/cli add connect-modal
 *   npx @cinacoin/cli add chain-switcher
 *   npx @cinacoin/cli add wallet-display
 *   npx @cinacoin/cli add nft-gallery
 *   npx @cinacoin/cli add @cinacoin/react   — add package
 */

import type { Command } from 'commander';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spinner, warn, error, header, success, info } from '../utils/logger.js';

// ============================================================
// Package addon registry (existing)
// ============================================================

const ADDONS: Record<string, { pkg: string; description: string }> = {
  '@cinacoin/evm': { pkg: '@cinacoin/core-sdk', description: 'EVM chain adapter' },
  '@cinacoin/solana': { pkg: '@cinacoin/core-sdk', description: 'Solana chain adapter' },
  '@cinacoin/bitcoin': { pkg: '@cinacoin/core-sdk', description: 'Bitcoin chain adapter' },
  '@cinacoin/react': { pkg: '@cinacoin/react', description: 'React UI components' },
  '@cinacoin/vue': { pkg: '@cinacoin/vue', description: 'Vue UI components' },
  '@cinacoin/react-native': { pkg: '@cinacoin/react-native', description: 'React Native components' },
  '@cinacoin/swap-sdk': { pkg: '@cinacoin/swap-sdk', description: 'DEX swap aggregator' },
  '@cinacoin/siwe': { pkg: '@cinacoin/siwe', description: 'Sign-In With Ethereum' },
  '@cinacoin/onramp-sdk': { pkg: '@cinacoin/onramp-sdk', description: 'Fiat on-ramp aggregator' },
  '@cinacoin/walletconnect-v2': { pkg: '@cinacoin/walletconnect-v2', description: 'WalletConnect v2' },
  '@cinacoin/session-keys': { pkg: '@cinacoin/session-keys', description: 'ERC-4337 session keys' },
  '@cinacoin/social-login': { pkg: '@cinacoin/social-login', description: 'Social login providers' },
};

// ============================================================
// Component generators
// ============================================================

interface ComponentDef {
  description: string;
  files: Record<string, string>;
  dependencies: Record<string, string>;
  usage: string;
}

const COMPONENTS: Record<string, ComponentDef> = {
  'connect-button': {
    description: 'Wallet connect button component',
    files: {
      'src/components/ConnectButton.tsx': `import { useAccount, useConnect, useDisconnect } from '@cinacoin/react';

interface ConnectButtonProps {
  className?: string;
  label?: string;
}

export default function ConnectButton({ className, label = 'Connect Wallet' }: ConnectButtonProps) {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <button
        className={className}
        onClick={() => disconnect()}
        style={{
          background: '#333',
          color: 'white',
          border: '1px solid #444',
          borderRadius: '8px',
          padding: '0.5rem 1rem',
          cursor: 'pointer',
          fontFamily: 'monospace',
        }}
      >
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </button>
    );
  }

  return (
    <button
      className={className}
      onClick={() => connect({ connector: connectors[0] })}
      style={{
        background: '#6366f1',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '0.5rem 1.5rem',
        cursor: 'pointer',
        fontWeight: 'var(--weight-semibold)',
      }}
    >
      {label}
    </button>
  );
}
`,
    },
    dependencies: { '@cinacoin/react': '^0.1.0' },
    usage: `import ConnectButton from './components/ConnectButton';

// Usage:
<ConnectButton label="Connect" />
`,
  },

  'connect-modal': {
    description: 'Full wallet selection modal with multiple connectors',
    files: {
      'src/components/ConnectModal.tsx': `import { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from '@cinacoin/react';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WALLET_OPTIONS = [
  { id: 'injected', name: 'Browser Wallet', icon: '🦊', description: 'MetaMask, Rabby, etc.' },
  { id: 'walletconnect', name: 'WalletConnect', icon: '🔗', description: 'Scan with mobile wallet' },
  { id: 'coinbase', name: 'Coinbase Wallet', icon: '🔵', description: 'Coinbase Smart Wallet' },
  { id: 'phantom', name: 'Phantom', icon: '👻', description: 'Phantom wallet' },
];

export default function ConnectModal({ isOpen, onClose }: ConnectModalProps) {
  const { isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: '#1a1a2e', borderRadius: '16px', padding: '2rem',
        maxWidth: '400px', width: '100%', color: 'white',
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 1rem' }}>Connect Wallet</h3>

        {isConnected ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#22c55e' }}>✓ Wallet connected</p>
            <button onClick={() => { disconnect(); onClose(); }}
              style={{ marginTop: '1rem', background: '#ef4444', border: 'none', borderRadius: '8px', padding: '0.5rem 2rem', color: 'white', cursor: 'pointer' }}>
              Disconnect
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {WALLET_OPTIONS.map(wallet => (
              <button key={wallet.id}
                onClick={() => {
                  const connector = connectors.find(c => c.id === wallet.id) || connectors[0];
                  connect({ connector });
                  onClose();
                }}
                disabled={isPending}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  background: '#0d0d1a', border: '1px solid #333', borderRadius: '10px',
                  padding: '1rem', color: 'white', cursor: 'pointer', textAlign: 'left',
                }}>
                <span style={{ fontSize: '1.5rem' }}>{wallet.icon}</span>
                <div>
                  <div style={{ fontWeight: 'var(--weight-semibold)' }}>{wallet.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#888' }}>{wallet.description}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
`,
    },
    dependencies: { '@cinacoin/react': '^0.1.0' },
    usage: `import { useState } from 'react';
import ConnectModal from './components/ConnectModal';

// Usage:
const [modalOpen, setModalOpen] = useState(false);
<button onClick={() => setModalOpen(true)}>Connect</button>
<ConnectModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
`,
  },

  'chain-switcher': {
    description: 'Network/chain switcher dropdown component',
    files: {
      'src/components/ChainSwitcher.tsx': `import { useChainId, useSwitchChain } from '@cinacoin/react';

interface ChainSwitcherProps {
  className?: string;
  chains?: Array<{ id: number; name: string; icon?: string }>;
}

const DEFAULT_CHAINS = [
  { id: 1, name: 'Ethereum', icon: '💎' },
  { id: 137, name: 'Polygon', icon: '🟣' },
  { id: 42161, name: 'Arbitrum', icon: '🔵' },
  { id: 10, name: 'Optimism', icon: '🔴' },
  { id: 56, name: 'BNB Chain', icon: '🟡' },
];

export default function ChainSwitcher({ className, chains = DEFAULT_CHAINS }: ChainSwitcherProps) {
  const chainId = useChainId();
  const { switchChain, chains: sdkChains } = useSwitchChain();

  const currentChain = chains.find(c => c.id === chainId);

  return (
    <select
      className={className}
      value={chainId}
      onChange={(e) => switchChain(parseInt(e.target.value))}
      style={{
        background: '#1a1a2e',
        color: 'white',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '0.5rem 2rem 0.5rem 0.75rem',
        cursor: 'pointer',
        appearance: 'none',
        backgroundImage: \`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='white' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")\`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.75rem center',
      }}
    >
      {chains.map(chain => (
        <option key={chain.id} value={chain.id}>
          {chain.icon} {chain.name}{chain.id === chainId ? ' ✓' : ''}
        </option>
      ))}
    </select>
  );
}
`,
    },
    dependencies: { '@cinacoin/react': '^0.1.0' },
    usage: `import ChainSwitcher from './components/ChainSwitcher';

// Usage:
<ChainSwitcher />

// Custom chains:
<ChainSwitcher chains={[
  { id: 1, name: 'Ethereum', icon: '💎' },
  { id: 10, name: 'Optimism', icon: '🔴' },
]} />
`,
  },

  'wallet-display': {
    description: 'Wallet info card with address, balance, and disconnect',
    files: {
      'src/components/WalletDisplay.tsx': `import { useState } from 'react';
import { useAccount, useBalance, useDisconnect } from '@cinacoin/react';

interface WalletDisplayProps {
  className?: string;
  showBalance?: boolean;
}

export default function WalletDisplay({ className, showBalance = true }: WalletDisplayProps) {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);

  if (!isConnected || !address) return null;

  const copyAddress = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={className} style={{
      background: '#1a1a2e',
      border: '1px solid #333',
      borderRadius: '12px',
      padding: '1.5rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0 }}>Wallet</h4>
        <button onClick={() => disconnect()}
          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}>
          Disconnect
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
        <code style={{
          background: '#0d0d1a', padding: '0.5rem 1rem', borderRadius: '4px',
          fontSize: '0.85rem', flex: 1, fontFamily: 'monospace',
        }}>
          {address}
        </code>
        <button onClick={copyAddress}
          style={{ background: copied ? '#22c55e' : '#333', border: 'none', color: 'white', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer' }}>
          {copied ? '✓' : '📋'}
        </button>
      </div>

      {showBalance && balance && (
        <p style={{ margin: '1rem 0 0', color: '#888' }}>
          Balance: {balance.formatted} {balance.symbol}
        </p>
      )}
    </div>
  );
}
`,
    },
    dependencies: { '@cinacoin/react': '^0.1.0' },
    usage: `import WalletDisplay from './components/WalletDisplay';

// Usage:
<WalletDisplay />
<WalletDisplay showBalance={false} />
`,
  },

  'wallet-modal': {
    description: 'Full wallet connection modal with QR code and multi-wallet support',
    files: {
      'src/components/WalletModal.tsx': `import { useState, useCallback } from 'react';
import { useCoinConnect, useCoinAccount } from '@cinacoin/core-sdk/react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

const WALLETS = [
  { id: 'metamask', name: 'MetaMask', icon: '🦊', description: 'Connect using MetaMask wallet' },
  { id: 'walletconnect', name: 'WalletConnect', icon: '🔗', description: 'Scan with your mobile wallet' },
  { id: 'coinbase', name: 'Coinbase Wallet', icon: '🔵', description: 'Connect with Coinbase' },
  { id: 'phantom', name: 'Phantom', icon: '👻', description: 'Solana & multi-chain wallet' },
  { id: 'bitcoin', name: 'Bitcoin', icon: '₿', description: 'BTC wallet (Leather, Xverse)' },
];

export default function WalletModal({ isOpen, onClose, projectId }: WalletModalProps) {
  const { connect, isConnecting, error, connectors } = useCoinConnect();
  const { address, isConnected, disconnect } = useCoinAccount();
  const [showQR, setShowQR] = useState(false);

  const handleConnect = useCallback(async (walletId: string) => {
    try {
      await connect(walletId);
      onClose();
    } catch (err) {
      // Error handled by hook
    }
  }, [connect, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--cc-surface-primary, #161b22)',
        borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px',
        color: 'var(--cc-text-primary, #e6edf3)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: 'var(--text-body-md)', fontWeight: "var(--weight-semibold)" }}>
            {isConnected ? 'Account' : 'Connect Wallet'}
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--cc-text-muted, #6e7681)',
            fontSize: 'var(--text-display-sm)', cursor: 'pointer', padding: '4px',
          }}>✕</button>
        </div>

        {isConnected && address ? (
          <div>
            <div style={{
              background: 'var(--cc-bg-secondary, #21262d)', borderRadius: '12px',
              padding: '16px', marginBottom: '16px',
            }}>
              <p style={{ margin: '0 0 8px', fontSize: 'var(--text-caption)', color: 'var(--cc-text-secondary)' }}>Connected</p>
              <code style={{
                fontFamily: 'monospace', fontSize: 'var(--text-body-sm)',
                wordBreak: 'break-all', color: 'var(--cc-text-primary)',
              }}>{address}</code>
            </div>
            <button onClick={() => { disconnect(); onClose(); }} style={{
              width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--cc-error, #ef4444)',
              background: 'transparent', color: 'var(--cc-error, #ef4444)', cursor: 'pointer',
              fontWeight: "var(--weight-semibold)", fontSize: 'var(--text-body-sm)',
            }}>Disconnect</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '8px' }}>
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid var(--cc-error, #ef4444)',
                borderRadius: '8px', padding: '8px', fontSize: 'var(--text-caption)', color: 'var(--cc-error, #ef4444)',
                marginBottom: '8px',
              }}>{error}</div>
            )}
            {WALLETS.map(wallet => (
              <button key={wallet.id} onClick={() => handleConnect(wallet.id)}
                disabled={isConnecting}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
                  padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--cc-border-primary, #30363d)',
                  background: 'var(--cc-bg-secondary, #21262d)', color: 'var(--cc-text-primary)',
                  cursor: isConnecting ? 'wait' : 'pointer', textAlign: 'left',
                  transition: 'all 0.15s ease', fontSize: 'var(--text-body-sm)',
                }}>
                <span style={{ fontSize: 'var(--text-display-md)' }}>{wallet.icon}</span>
                <div>
                  <div style={{ fontWeight: "var(--weight-semibold)" }}>{wallet.name}</div>
                  <div style={{ fontSize: 'var(--text-caption)', color: 'var(--cc-text-muted, #6e7681)' }}>{wallet.description}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
`,
    },
    dependencies: { '@cinacoin/core-sdk': '^0.2.0' },
    usage: `import { useState } from 'react';
import WalletModal from './components/WalletModal';

function App() {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <>
      <button onClick={() => setModalOpen(true)}>Connect Wallet</button>
      <WalletModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
`,
  },

  'chain-selector': {
    description: 'Multi-chain selector component with EVM, Solana, and Bitcoin support',
    files: {
      'src/components/ChainSelector.tsx': `import { useCoinConnect, useCoinAccount } from '@cinacoin/core-sdk/react';

interface ChainOption {
  id: number;
  name: string;
  icon: string;
  namespace?: string;
}

interface ChainSelectorProps {
  chains?: ChainOption[];
  className?: string;
  onChange?: (chainId: number) => void;
}

const DEFAULT_CHAINS: ChainOption[] = [
  { id: 1, name: 'Ethereum', icon: '💎', namespace: 'eip155' },
  { id: 137, name: 'Polygon', icon: '🟣', namespace: 'eip155' },
  { id: 42161, name: 'Arbitrum', icon: '🔷', namespace: 'eip155' },
  { id: 10, name: 'Optimism', icon: '🔴', namespace: 'eip155' },
  { id: 8453, name: 'Base', icon: '🔵', namespace: 'eip155' },
  { id: 56, name: 'BNB Chain', icon: '🟡', namespace: 'eip155' },
  { id: 101, name: 'Solana', icon: '◎', namespace: 'solana' },
  { id: 0, name: 'Bitcoin', icon: '₿', namespace: 'bip122' },
];

export default function ChainSelector({ chains = DEFAULT_CHAINS, className, onChange }: ChainSelectorProps) {
  const { switchChain } = useCoinConnect();
  const { chainId, isConnected } = useCoinAccount();

  const currentChain = chains.find(c => c.id === chainId);

  const handleSwitch = async (newChainId: number) => {
    if (!isConnected) return;
    try {
      await switchChain(newChainId);
      onChange?.(newChainId);
    } catch (err) {
      console.error('Failed to switch chain:', err);
    }
  };

  return (
    <div className={className} style={{ position: 'relative' }}>
      <select
        value={chainId ?? ''}
        onChange={(e) => handleSwitch(Number(e.target.value))}
        disabled={!isConnected}
        style={{
          appearance: 'none',
          background: 'var(--cc-bg-secondary, #21262d)',
          color: 'var(--cc-text-primary, #e6edf3)',
          border: '1px solid var(--cc-border-primary, #30363d)',
          borderRadius: '10px',
          padding: '8px 36px 8px 12px',
          fontSize: 'var(--text-body-sm)',
          fontWeight: "var(--weight-medium)",
          cursor: isConnected ? 'pointer' : 'not-allowed',
          opacity: isConnected ? 1 : 0.5,
          minWidth: '160px',
          backgroundImage: \\\`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%238b949e' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")\\\`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
        }}
      >
        {!currentChain && <option value="">Select Chain</option>}
        {chains.map(chain => (
          <option key={chain.id} value={chain.id}>
            {chain.icon} {chain.name}{chain.id === chainId ? ' ✓' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
`,
    },
    dependencies: { '@cinacoin/core-sdk': '^0.2.0' },
    usage: `import ChainSelector from './components/ChainSelector';

// Default chains (Ethereum, Polygon, Arbitrum, Optimism, Base, BNB, Solana, Bitcoin):
<ChainSelector />

// Custom chains:
<ChainSelector chains={[
  { id: 1, name: 'Ethereum', icon: '💎' },
  { id: 8453, name: 'Base', icon: '🔵' },
]} onChange={(chainId) => logger.info('Switched to', chainId)} />
`,
  },

  'signature': {
    description: 'Sign-In With Ethereum (SIWE) component with nonce and verification',
    files: {
      'src/components/SignIn.tsx': `import { useState, useCallback } from 'react';
import { useCoinAccount, useCoinSign } from '@cinacoin/core-sdk/react';
import { createSIWEMessage, generateNonce } from '@cinacoin/core-sdk/utils/signature';
import { logger } from '@cinacoin/logger';

interface SignInProps {
  /** Domain for the SIWE message (defaults to window.location.host) */
  domain?: string;
  /** Statement shown to the user */
  statement?: string;
  /** Callback after successful signature */
  onSuccess?: (data: { message: string; signature: string; address: string }) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Custom className */
  className?: string;
}

export default function SignIn({
  domain,
  statement = 'Sign in to verify your identity',
  onSuccess,
  onError,
  className,
}: SignInProps) {
  const { address, isConnected, chainId } = useCoinAccount();
  const { signMessage, isLoading, error } = useCoinSign();
  const [signature, setSignature] = useState<string | null>(null);

  const handleSignIn = useCallback(async () => {
    if (!address || !isConnected) return;

    try {
      const nonce = generateNonce();
      const message = createSIWEMessage({
        domain: domain || (typeof window !== 'undefined' ? window.location.host : 'localhost'),
        address,
        statement,
        uri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
        chainId: chainId || 1,
        nonce,
      });

      const sig = await signMessage(message);
      setSignature(sig);

      onSuccess?.({ message, signature: sig, address });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      onError?.(error);
    }
  }, [address, isConnected, chainId, domain, statement, signMessage, onSuccess, onError]);

  if (!isConnected) {
    return (
      <div className={className} style={{
        padding: '16px', borderRadius: '12px',
        background: 'var(--cc-bg-secondary, #21262d)',
        border: '1px solid var(--cc-border-primary, #30363d)',
        textAlign: 'center', color: 'var(--cc-text-muted, #6e7681)',
      }}>
        Connect your wallet to sign in
      </div>
    );
  }

  if (signature) {
    return (
      <div className={className} style={{
        padding: '16px', borderRadius: '12px',
        background: 'rgba(34,197,94,0.1)',
        border: '1px solid var(--cc-success, #22c55e)',
        textAlign: 'center',
      }}>
        <span style={{ fontSize: 'var(--text-display-md)' }}>✅</span>
        <p style={{ margin: '8px 0 0', color: 'var(--cc-success, #22c55e)', fontWeight: "var(--weight-semibold)" }}>
          Signed in successfully
        </p>
        <code style={{
          display: 'block', marginTop: '8px', fontSize: 'var(--text-caption)',
          color: 'var(--cc-text-muted)', wordBreak: 'break-all',
        }}>{signature.slice(0, 20)}...{signature.slice(-10)}</code>
      </div>
    );
  }

  return (
    <button
      className={className}
      onClick={handleSignIn}
      disabled={isLoading}
      style={{
        padding: '12px 24px', borderRadius: '8px', border: 'none',
        background: isLoading ? 'var(--cc-text-muted, #6e7681)' : 'var(--cc-primary, #58a6ff)',
        color: 'white', fontWeight: "var(--weight-semibold)", fontSize: 'var(--text-body-sm)',
        cursor: isLoading ? 'wait' : 'pointer', transition: 'all 0.15s ease',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}
    >
      {isLoading ? (
        <>
          <span style={{
            width: '14px', height: '14px', border: '2px solid white',
            borderTopColor: 'transparent', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', display: 'inline-block',
          }} />
          Signing...
        </>
      ) : (
        <>✍️ Sign In with Ethereum</>
      )}
      {error && <span style={{ fontSize: 'var(--text-caption)', opacity: 0.8 }}>({error})</span>}
    </button>
  );
}
`,
    },
    dependencies: { '@cinacoin/core-sdk': '^0.2.0' },
    usage: `import SignIn from './components/SignIn';

// Basic usage:
<SignIn />

// With callbacks:
<SignIn
  statement="Sign in to My dApp"
  onSuccess={({ message, signature, address }) => {
    // Send to backend for verification
    fetch('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ message, signature, address }),
    });
  }}
  onError={(err) => console.error('Sign-in failed:', err)}
/>
`,
  },

  'nft-gallery': {
    description: 'NFT gallery grid component for displaying collections',
    files: {
      'src/components/NftGallery.tsx': `interface NftItem {
  id: string | number;
  name: string;
  collection: string;
  price: string;
  image: string;
  currency?: string;
}

interface NftGalleryProps {
  nfts: NftItem[];
  className?: string;
  onBuy?: (nft: NftItem) => void;
  columns?: number;
}

export default function NftGallery({ nfts, className, onBuy, columns = 3 }: NftGalleryProps) {
  return (
    <div className={className}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: \`repeat(auto-fill, minmax(\${280}px, 1fr))\`,
        gap: '1.5rem',
      }}>
        {nfts.map(nft => (
          <div key={nft.id} style={{
            background: '#1a1a2e',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #333',
          }}>
            <div style={{
              height: '220px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '4rem',
              background: '#0d0d1a',
            }}>
              {nft.image.startsWith('http') ? (
                <img src={nft.image} alt={nft.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                nft.image
              )}
            </div>
            <div style={{ padding: '1rem' }}>
              <h4 style={{ margin: '0 0 0.25rem' }}>{nft.name}</h4>
              <p style={{ color: '#888', margin: '0 0 0.75rem', fontSize: '0.85rem' }}>{nft.collection}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'var(--weight-semibold)' }}>{nft.price} {nft.currency || 'ETH'}</span>
                {onBuy && (
                  <button onClick={() => onBuy(nft)}
                    style={{ background: '#6366f1', border: 'none', borderRadius: '6px', padding: '0.4rem 1rem', color: 'white', fontWeight: 'var(--weight-semibold)', cursor: 'pointer' }}>
                    Buy
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
`,
    },
    dependencies: {},
    usage: `import NftGallery from './components/NftGallery';

// Usage:
<NftGallery
  nfts={[
    { id: 1, name: 'NFT #1', collection: 'My Collection', price: '0.5', image: '🎨' },
  ]}
  onBuy={(nft) => logger.info('Buy', nft.name)}
/>
`,
  },
};

// ============================================================
// List subcommand
// ============================================================

function listCommand(cli: Command): void {
  cli
    .command('list')
    .alias('ls')
    .description('List all available Cinacoin addons and components')
    .action(() => {
      header('Available Addons (packages)');
      for (const [name, info] of Object.entries(ADDONS)) {
        logger.info(`  ${name.padEnd(32)} ${info.description}`);
      }
      logger.info();
      header('Available Components');
      for (const [name, info] of Object.entries(COMPONENTS)) {
        logger.info(`  ${name.padEnd(32)} ${info.description}`);
      }
      logger.info();
    });
}

// ============================================================
// add command
// ============================================================

export function addCommand(cli: Command): void {
  // Register 'list' subcommand
  listCommand(cli);

  // Register 'add' command
  cli
    .command('add')
    .description('Add a Cinacoin component or package to your project')
    .argument('<name>', 'Component or package name')
    .option('--dev', 'Add package as dev dependency')
    .option('--force', 'Overwrite existing files')
    .option('--dry-run', 'Show what would be added without writing')
    .action(async (name: string, opts: { dev?: boolean; force?: boolean; dryRun?: boolean }) => {
      const cwd = process.cwd();
      const pkgPath = join(cwd, 'package.json');

      // ── Check if it's a component ─────────────────────────
      const compDef = COMPONENTS[name];
      if (compDef) {
        if (!existsSync(pkgPath)) {
          error('No package.json found. Run "cinacoin init" first.');
          process.exit(1);
        }

        if (opts.dryRun) {
          header(`Dry Run — Would add component '${name}'`);
          logger.info(`  ${compDef.description}\n`);
          logger.info('  Files:');
          for (const [path] of Object.entries(compDef.files)) {
            logger.info(`    ${path}`);
          }
          if (Object.keys(compDef.dependencies).length > 0) {
            logger.info('\n  Dependencies:');
            for (const [dep, ver] of Object.entries(compDef.dependencies)) {
              logger.info(`    ${dep}: ${ver}`);
            }
          }
          logger.info(`\n  Usage:\n${compDef.usage}`);
          logger.info();
          return;
        }

        const s = spinner(`Adding component '${name}'...`);

        try {
          // Create directories
          for (const [path] of Object.entries(compDef.files)) {
            const dir = join(cwd, path.split('/').slice(0, -1).join('/'));
            mkdirSync(dir, { recursive: true });
          }

          // Write component files
          for (const [path, content] of Object.entries(compDef.files)) {
            const fullPath = join(cwd, path);
            if (existsSync(fullPath) && !opts.force) {
              s.warn(`${path} already exists. Use --force to overwrite.`);
              process.exit(1);
            }
            writeFileSync(fullPath, content);
          }

          // Add dependencies
          const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
          if (!pkg.dependencies) pkg.dependencies = {};
          for (const [dep, ver] of Object.entries(compDef.dependencies)) {
            if (!pkg.dependencies[dep]) {
              pkg.dependencies[dep] = ver;
            }
          }
          writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

          s.succeed(`Component '${name}' added successfully!`);

          header('Usage');
          logger.info(compDef.usage);
          logger.info();

        } catch (err) {
          s.fail(`Failed to add component: ${err instanceof Error ? err.message : String(err)}`);
          process.exit(1);
        }
        return;
      }

      // ── Check if it's a package addon ─────────────────────
      const addonInfo = ADDONS[name];
      if (addonInfo) {
        if (!existsSync(pkgPath)) {
          error('No package.json found. Run "cinacoin init" first.');
          process.exit(1);
        }

        const s = spinner(`Adding ${name}...`);

        try {
          const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
          const depKey = opts.dev ? 'devDependencies' : 'dependencies';
          if (!pkg[depKey]) pkg[depKey] = {};
          pkg[depKey][addonInfo.pkg] = '^0.1.0';
          writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

          s.succeed(`Added ${name} to ${depKey}`);
          info(`Import and use ${name} in your project.`);
          logger.info();
        } catch (err) {
          s.fail(`Failed to add ${name}: ${err instanceof Error ? err.message : String(err)}`);
          process.exit(1);
        }
        return;
      }

      // ── Unknown ───────────────────────────────────────────
      error(`Unknown component or package '${name}'`);
      logger.info();
      info('Available components:');
      for (const [cn] of Object.entries(COMPONENTS)) {
        logger.info(`    ${cn}`);
      }
      logger.info();
      info('Available packages:');
      for (const [pn] of Object.entries(ADDONS)) {
        logger.info(`    ${pn}`);
      }
      logger.info();
      process.exit(1);
    });
}
