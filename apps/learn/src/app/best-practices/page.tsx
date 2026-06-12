import CodeBlock from "@/components/CodeBlock";
import StepIndicator from "@/components/StepIndicator";


export const metadata = {
  title: "Best practices. — CinaCoin Learn",
  description: "Production-ready patterns for security, performance, error handling, and UX in Web3 apps.",
};

export default function BestPracticesPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <StepIndicator currentStep={4} totalSteps={4} />

      <h1 className="text-display-lg mb-4">Best practices</h1>
      <p className="text-body-lg mb-8" style={{ color: 'var(--cc-body)' }}>
        Production-ready patterns for building secure, performant, and user-friendly Web3 applications.
      </p>

      {/* Section 1 */}
      <section className="mb-12" aria-labelledby="security-first">
        <h2 id="security-first" className="text-display-md mb-4">1. Security first.</h2>
        <p className="text-body-md mb-4" style={{ color: 'var(--cc-body)' }}>
          Web3 applications handle real money. Security isn&apos;t optional — it&apos;s the foundation.
          Follow these rules to protect your users.
        </p>
        <CodeBlock
          language="typescript"
          title="Security patterns."
          code={`// ✅ DO: Validate all addresses before use
import { isAddress } from '@cinacoin/sdk';

function safeTransfer(to: string, amount: string) {
  if (!isAddress(to)) {
    throw new Error('Invalid recipient address');
  }
  if (parseFloat(amount) <= 0) {
    throw new Error('Amount must be positive');
  }
  // Proceed with transfer...
}

// ✅ DO: Set transaction deadlines (slippage protection)
const tx = await cinacoin.sendTransaction({
  to: contractAddress,
  data: swapData,
  // Transaction reverts if not confirmed within 20 minutes
  deadline: Math.floor(Date.now() / 1000) + 1200,
});

// ❌ DON'T: Store private keys in frontend code
// ❌ DON'T: Trust user input without validation
// ❌ DON'T: Skip contract verification on Etherscan`}
        />
      </section>

      {/* Section 2 */}
      <section className="mb-12" aria-labelledby="error-handling">
        <h2 id="error-handling" className="text-display-md mb-4">2. Error handling.</h2>
        <p className="text-body-md mb-4" style={{ color: 'var(--cc-body)' }}>
          Blockchain transactions can fail in many ways. Good error handling makes the
          difference between a frustrating and a delightful user experience.
        </p>
        <CodeBlock
          language="typescript"
          title="Robust error handling."
          code={`import { CinaCoinError, ErrorCode } from '@cinacoin/sdk';

async function handleTransaction() {
  try {
    const tx = await cinacoin.sendTransaction({ /* ... */ });
    const receipt = await tx.wait();
    return { success: true, receipt };
  } catch (error) {
    if (error instanceof CinaCoinError) {
      switch (error.code) {
        case ErrorCode.USER_REJECTED:
          return { success: false, message: 'Transaction rejected by user' };

        case ErrorCode.INSUFFICIENT_FUNDS:
          return { success: false, message: 'Not enough funds for this transaction' };

        case ErrorCode.NETWORK_ERROR:
          return { success: false, message: 'Network error. Please check your connection.' };

        case ErrorCode.TRANSACTION_REVERTED:
          // Decode the revert reason
          const reason = error.data?.reason || 'Transaction failed';
          return { success: false, message: reason };

        default:
          return { success: false, message: 'An unexpected error occurred' };
      }
    }
    throw error; // Re-throw unknown errors
  }
}`}
        />
      </section>

      {/* Section 3 */}
      <section className="mb-12" aria-labelledby="performance-optimization">
        <h2 id="performance-optimization" className="text-display-md mb-4">3. Performance optimization.</h2>
        <p className="text-body-md mb-4" style={{ color: 'var(--cc-body)' }}>
          Web3 apps can be slow due to RPC calls and block times. Optimize for speed
          with caching, parallel requests, and optimistic updates.
        </p>
        <CodeBlock
          language="typescript"
          title="Performance patterns."
          code={`// ✅ DO: Cache RPC responses for read-only data
import { cinacoin } from '@cinacoin/sdk';

const cache = new Map<string, { data: unknown; expiry: number }>();

async function getCachedBalance(address: string, chainId: number) {
  const key = \`\${address}-\${chainId}\`;
  const cached = cache.get(key);

  if (cached && cached.expiry > Date.now()) {
    return cached.data; // Return cached data
  }

  const balance = await cinacoin.getBalance({ address, chainId });

  // Cache for 15 seconds (roughly one block)
  cache.set(key, { data: balance, expiry: Date.now() + 15_000 });
  return balance;
}

// ✅ DO: Batch multiple reads into one request
const [balance, nonce, gasPrice] = await Promise.all([
  cinacoin.getBalance({ address, chainId }),
  cinacoin.getTransactionCount({ address, chainId }),
  cinacoin.getGasPrice({ chainId }),
]);

// ✅ DO: Use optimistic updates for better UX
function useTokenTransfer() {
  const [status, setStatus] = useState('idle');

  async function transfer(to: string, amount: string) {
    setStatus('pending');
    // Optimistically update UI
    updateBalanceOptimistic(amount);

    try {
      const tx = await cinacoin.sendTransaction({ to, value: amount });
      setStatus('confirming');
      await tx.wait();
      setStatus('confirmed');
    } catch {
      // Rollback optimistic update
      rollbackBalance();
      setStatus('failed');
    }
  }

  return { status, transfer };
}`}
        />
      </section>

      {/* Section 4 */}
      <section className="mb-12" aria-labelledby="user-experience">
        <h2 id="user-experience" className="text-display-md mb-4">4. User experience.</h2>
        <p className="text-body-md mb-4" style={{ color: 'var(--cc-body)' }}>
          Web3 UX has a reputation for being confusing. Bridge the gap between
          crypto-native and mainstream users with clear feedback and sensible defaults.
        </p>
        <ul className="list-disc list-inside space-y-3 mb-4" style={{ color: 'var(--cc-body)' }}>
          <li><strong className="font-semibold">Show pending states</strong> — Always indicate when a transaction is being processed.</li>
          <li><strong className="font-semibold">Explain gas fees</strong> — Users should understand what they&apos;re paying for.</li>
          <li><strong className="font-semibold">Provide block explorer links</strong> — Let users track transactions independently.</li>
          <li><strong className="font-semibold">Handle disconnections gracefully</strong> — Don&apos;t crash; prompt reconnection.</li>
          <li><strong className="font-semibold">Use human-readable addresses</strong> — Show ENS names or truncated addresses (0x742d...5678).</li>
          <li><strong className="font-semibold">Confirm before signing</strong> — Show users exactly what they&apos;re signing.</li>
        </ul>
        <CodeBlock
          language="typescript"
          title="UX helper: format address."
          code={`function formatAddress(address: string, chars = 4): string {
  return \`\${address.slice(0, chars + 2)}...\${address.slice(-chars)}\`;
}

// formatAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bd24')
// → '0x742d...0bd24'

function formatBalance(value: string, decimals = 4): string {
  const num = parseFloat(value);
  if (num === 0) return '0';
  if (num < 0.0001) return '< 0.0001';
  return num.toFixed(decimals);
}

// formatBalance('0.00001234')
// → '< 0.0001'`}
        />
      </section>

      {/* Section 5 */}
      <section className="mb-12" aria-labelledby="testing-integration">
        <h2 id="testing-integration" className="text-display-md mb-4">5. Testing your integration.</h2>
        <p className="text-body-md mb-4" style={{ color: 'var(--cc-body)' }}>
          Test your Web3 integration thoroughly before deploying to production.
          Use testnets, mock providers, and automated tests.
        </p>
        <CodeBlock
          language="typescript"
          title="Testing with mock provider."
          code={`import { cinacoin } from '@cinacoin/sdk';
import { describe, it, expect, vi } from 'vitest';

describe('Wallet Integration', () => {
  it('should connect and return address', async () => {
    // Mock the connect method
    vi.spyOn(cinacoin, 'connect').mockResolvedValue({
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bd24',
      chainId: '1',
    });

    const session = await cinacoin.connect();
    expect(session.address).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f0bd24');
  });

  it('should handle user rejection', async () => {
    vi.spyOn(cinacoin, 'connect').mockRejectedValue(
      new Error('User rejected connection')
    );

    await expect(cinacoin.connect()).rejects.toThrow('User rejected');
  });
});`}
        />
      </section>

      {/* Navigation */}
      <nav className="flex justify-between items-center pt-8 border-t" style={{ borderColor: 'var(--cc-hairline)' }} aria-label="Tutorial navigation">
        <a
          href="/multichain"
          className="text-body-sm cc-link-hover"
          style={{ color: 'var(--cc-body)' }}
        >
          ← Previous: Multichain development.
        </a>
        <a
          href="/"
          className="cc-btn-secondary"
        >
          Back to home.
        </a>
      </nav>
    </div>
  );
}
