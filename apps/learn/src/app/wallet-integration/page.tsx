import CodeBlock from "@/components/CodeBlock";
import StepIndicator from "@/components/StepIndicator";


export const metadata = {
  title: "Wallet integration. — CinaCoin Learn",
  description: "Learn how to connect wallets, sign transactions, and interact with smart contracts.",
};

export default function WalletIntegrationPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <StepIndicator currentStep={2} totalSteps={4} />

      <h1 className="text-display-lg mb-4">Wallet integration.</h1>
      <p className="text-body-lg mb-8" style={{ color: 'var(--cc-body)' }}>
        Connect wallets, sign messages, and interact with smart contracts using the CinaCoin SDK.
      </p>

      {/* Step 1 */}
      <section className="mb-12" aria-labelledby="install-sdk">
        <h2 id="install-sdk" className="text-display-md mb-4">1. Install the SDK.</h2>
        <p className="text-body-md mb-4" style={{ color: 'var(--cc-body)' }}>
          Start by installing the CinaCoin SDK in your project. It provides a unified interface
          for connecting to multiple wallets and chains.
        </p>
        <CodeBlock
          language="bash"
          title="Terminal"
          code={`npm install @cinacoin/sdk`}
        />
      </section>

      {/* Step 2 */}
      <section className="mb-12" aria-labelledby="initialize-client">
        <h2 id="initialize-client" className="text-display-md mb-4">2. Initialize the client.</h2>
        <p className="text-body-md mb-4" style={{ color: 'var(--cc-body)' }}>
          Create a CinaCoin client instance with your project configuration. You can get your
          project ID from the CinaCoin dashboard.
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
      <section className="mb-12" aria-labelledby="connect-wallet">
        <h2 id="connect-wallet" className="text-display-md mb-4">3. Connect a wallet.</h2>
        <p className="text-body-md mb-4" style={{ color: 'var(--cc-body)' }}>
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
      <section className="mb-12" aria-labelledby="sign-message">
        <h2 id="sign-message" className="text-display-md mb-4">4. Sign a message.</h2>
        <p className="text-body-md mb-4" style={{ color: 'var(--cc-body)' }}>
          Once connected, you can ask the user to sign messages for authentication or
          other purposes. This proves ownership of the wallet address.
        </p>
        <CodeBlock
          language="typescript"
          title="Signing a message."
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
      <section className="mb-12" aria-labelledby="send-transaction">
        <h2 id="send-transaction" className="text-display-md mb-4">5. Send a transaction.</h2>
        <p className="text-body-md mb-4" style={{ color: 'var(--cc-body)' }}>
          Send transactions to interact with smart contracts or transfer tokens.
          The SDK handles gas estimation, nonce management, and confirmation tracking.
        </p>
        <CodeBlock
          language="typescript"
          title="Sending a transaction."
          code={`import { cinacoin } from '@/lib/cinacoin';

async function sendTransaction() {
  const tx = await cinacoin.sendTransaction({
    to: '0x742d35Cc6634C0532925a3b844Bc9e7595f...',
    value: '0.1', // in native token (ETH, MATIC, etc.)
    chainId: 'ethereum',
    // Optional: call a smart contract
    data: '0x...', // ABI-encoded function call
  });

  // Wait for confirmation
  const receipt = await tx.wait();
}`}
        />
      </section>

      {/* Step 6 */}
      <section className="mb-12" aria-labelledby="listen-events">
        <h2 id="listen-events" className="text-display-md mb-4">6. Listen for events.</h2>
        <p className="text-body-md mb-4" style={{ color: 'var(--cc-body)' }}>
          React to wallet and chain events in real-time. The SDK emits events for
          account changes, chain switches, and disconnections.
        </p>
        <CodeBlock
          language="typescript"
          title="Event handling."
          code={`import { cinacoin } from '@/lib/cinacoin';

// Listen for account changes
cinacoin.on('accountsChanged', (accounts: string[]) => {
  // Handle account change
});

// Listen for chain switches
cinacoin.on('chainChanged', (chainId: string) => {
  // Handle chain change
});

// Listen for disconnection
cinacoin.on('disconnect', () => {
  // Clean up your app state
});`}
        />
      </section>

      {/* Navigation */}
      <nav className="flex justify-between items-center pt-8 border-t" style={{ borderColor: 'var(--cc-hairline)' }} aria-label="Tutorial navigation">
        <a
          href="/basics"
          className="text-body-sm cc-link-hover"
          style={{ color: 'var(--cc-body)' }}
        >
          ← Previous: Web3 basics.
        </a>
        <a
          href="/multichain"
          className="cc-btn-primary"
        >
          Next: Multichain development. →
        </a>
      </nav>
    </div>
  );
}
