import CodeBlock from "@/components/CodeBlock";
import StepIndicator from "@/components/StepIndicator";
import Link from "next/link";

export const metadata = {
  title: "Wallet Integration — Cinacoin Learn",
  description: "Learn how to connect wallets, sign transactions, and interact with smart contracts.",
};

export default function WalletIntegrationPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <StepIndicator currentStep={2} totalSteps={4} />

      <h1 className="text-3xl font-bold mb-4">Wallet Integration</h1>
      <p className="text-text-secondary mb-8">
        Connect wallets, sign messages, and interact with smart contracts using the Cinacoin SDK.
      </p>

      {/* Step 1 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">1. Install the SDK</h2>
        <p className="text-text-secondary mb-4">
          Start by installing the Cinacoin SDK in your project. It provides a unified interface
          for connecting to multiple wallets and chains.
        </p>
        <CodeBlock
          language="bash"
          title="Terminal"
          code={`npm install @cinacoin/sdk`}
        />
      </section>

      {/* Step 2 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">2. Initialize the Client</h2>
        <p className="text-text-secondary mb-4">
          Create a Cinacoin client instance with your project configuration. You can get your
          project ID from the Cinacoin dashboard.
        </p>
        <CodeBlock
          language="typescript"
          title="src/lib/cinacoin.ts"
          code={`import { CinaCoin } from '@cinacoin/sdk';

export const cinacoin = new CinaCoin({
  projectId: process.env.NEXT_PUBLIC_CINACOIN_PROJECT_ID!,
  chains: ['ethereum', 'polygon', 'bsc'],
  metadata: {
    name: 'My DApp',
    description: 'My awesome decentralized application',
    url: 'https://mydapp.com',
    icons: ['https://mydapp.com/icon.png'],
  },
});`}
        />
      </section>

      {/* Step 3 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">3. Connect a Wallet</h2>
        <p className="text-text-secondary mb-4">
          Use the SDK to connect a user's wallet. The SDK handles WalletConnect, MetaMask,
          and other popular wallets automatically.
        </p>
        <CodeBlock
          language="typescript"
          title="src/hooks/useWallet.ts"
          code={`'use client';
import { useState, useCallback } from 'react';
import { cinacoin } from '@/lib/cinacoin';

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const session = await cinacoin.connect();
      setAddress(session.address);
      setChainId(session.chainId);
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await cinacoin.disconnect();
    setAddress(null);
    setChainId(null);
  }, []);

  return { address, chainId, connecting, connect, disconnect };
}`}
        />
      </section>

      {/* Step 4 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">4. Sign a Message</h2>
        <p className="text-text-secondary mb-4">
          Once connected, you can ask the user to sign messages for authentication or
          other purposes. This proves ownership of the wallet address.
        </p>
        <CodeBlock
          language="typescript"
          title="Signing a message"
          code={`import { cinacoin } from '@/lib/cinacoin';

async function signMessage(message: string) {
  const signature = await cinacoin.signMessage({
    message,
    // Optional: specify which chain to use
    chainId: 'ethereum',
  });

  // Verify the signature on your backend
  const isValid = await cinacoin.verifyMessage({
    message,
    signature,
    address: session.address,
  });

  return { signature, isValid };
}`}
        />
      </section>

      {/* Step 5 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">5. Send a Transaction</h2>
        <p className="text-text-secondary mb-4">
          Send transactions to interact with smart contracts or transfer tokens.
          The SDK handles gas estimation, nonce management, and confirmation tracking.
        </p>
        <CodeBlock
          language="typescript"
          title="Sending a transaction"
          code={`import { cinacoin } from '@/lib/cinacoin';

async function sendTransaction() {
  const tx = await cinacoin.sendTransaction({
    to: '0x742d35Cc6634C0532925a3b844Bc9e7595f...',
    value: '0.1', // in native token (ETH, MATIC, etc.)
    chainId: 'ethereum',
    // Optional: call a smart contract
    data: '0x...', // ABI-encoded function call
  });

  console.log('Transaction hash:', tx.hash);

  // Wait for confirmation
  const receipt = await tx.wait();
  console.log('Confirmed in block:', receipt.blockNumber);
}`}
        />
      </section>

      {/* Step 6 */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">6. Listen for Events</h2>
        <p className="text-text-secondary mb-4">
          React to wallet and chain events in real-time. The SDK emits events for
          account changes, chain switches, and disconnections.
        </p>
        <CodeBlock
          language="typescript"
          title="Event handling"
          code={`import { cinacoin } from '@/lib/cinacoin';

// Listen for account changes
cinacoin.on('accountsChanged', (accounts: string[]) => {
  console.log('Active account changed:', accounts[0]);
});

// Listen for chain switches
cinacoin.on('chainChanged', (chainId: string) => {
  console.log('Switched to chain:', chainId);
});

// Listen for disconnection
cinacoin.on('disconnect', () => {
  console.log('Wallet disconnected');
  // Clean up your app state
});`}
        />
      </section>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-8 border-t border-border-color">
        <Link
          href="/basics"
          className="text-text-secondary hover:text-accent-blue transition-colors text-sm"
        >
          ← Previous: Web3 Basics
        </Link>
        <Link
          href="/multichain"
          className="px-4 py-2 bg-accent-blue hover:bg-accent-blue/80 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Next: Multichain Development →
        </Link>
      </div>
    </div>
  );
}
