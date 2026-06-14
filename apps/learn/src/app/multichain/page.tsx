import CodeBlock from "@/components/CodeBlock";
import StepIndicator from "@/components/StepIndicator";


export const metadata = {
  title: "Multichain development. — Cinacoin Learn",
  description: "Build applications that work across multiple blockchains with Cinacoin's unified API.",
};

export default function MultichainPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <StepIndicator currentStep={3} totalSteps={4} />

      <h1 className="text-display-lg mb-4">Multichain development.</h1>
      <p className="text-body-lg mb-8" style={{ color: 'var(--cc-body)' }}>
        Build applications that seamlessly work across multiple blockchains using Cinacoin&apos;s
        unified multichain infrastructure.
      </p>

      {/* Section 1 */}
      <section className="mb-12" aria-labelledby="why-multichain">
        <h2 id="why-multichain" className="text-display-md mb-4">Why multichain?</h2>
        <p className="text-body-md mb-4" style={{ color: 'var(--cc-body)' }}>
          The blockchain ecosystem is multi-chain by nature. Users hold assets on Ethereum,
          Polygon, BSC, Arbitrum, and dozens of other chains. Your application should meet
          users where they are — not force them onto a single network.
        </p>
        <p className="text-body-md mb-4" style={{ color: 'var(--cc-body)' }}>
          Cinacoin provides a unified API that abstracts away chain-specific differences,
          letting you write code once and deploy everywhere.
        </p>
      </section>

      {/* Section 2 */}
      <section className="mb-12" aria-labelledby="configure-chains">
        <h2 id="configure-chains" className="text-display-md mb-4">Configure supported chains.</h2>
        <p className="text-body-md mb-4" style={{ color: 'var(--cc-body)' }}>
          Define which chains your application supports. Cinacoin handles RPC management,
          chain switching, and fallback providers automatically.
        </p>
        <CodeBlock
          language="typescript"
          title="src/config/chains.ts"
          code={`import { Chain, defineChain } from '@cinacoin/sdk';

export const ethereum = defineChain({
  id: 1,
  name: 'Ethereum',
  network: 'ethereum',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://eth.rpc.cinacoin.com'] },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://etherscan.io' },
  },
});

export const polygon = defineChain({
  id: 137,
  name: 'Polygon',
  network: 'polygon',
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://polygon.rpc.cinacoin.com'] },
  },
  blockExplorers: {
    default: { name: 'Polygonscan', url: 'https://polygonscan.io' },
  },
});

export const bsc = defineChain({
  id: 56,
  name: 'BNB Smart Chain',
  network: 'bsc',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://bsc.rpc.cinacoin.com'] },
  },
  blockExplorers: {
    default: { name: 'BscScan', url: 'https://bscscan.com' },
  },
});

export const supportedChains = [ethereum, polygon, bsc];`}
        />
      </section>

      {/* Section 3 */}
      <section className="mb-12" aria-labelledby="chain-agnostic">
        <h2 id="chain-agnostic" className="text-display-md mb-4">Chain-agnostic interactions.</h2>
        <p className="text-body-md mb-4" style={{ color: 'var(--cc-body)' }}>
          Use the same API regardless of which chain you&apos;re interacting with.
          The SDK automatically routes requests to the correct chain.
        </p>
        <CodeBlock
          language="typescript"
          title="Chain-agnostic operations."
          code={`import { cinacoin } from '@/lib/cinacoin';

// Get balance on any chain — same API
async function getBalance(address: string, chainId: number) {
  const balance = await cinacoin.getBalance({
    address,
    chainId,
  });
  return balance; // Formatted with correct decimals
}

// Read from a contract on any chain
async function readContract(chainId: number, contractAddress: string) {
  const result = await cinacoin.readContract({
    chainId,
    address: contractAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: ['0x742d35Cc6634C0532925a3b844Bc9e7595f...'],
  });
  return result;
}

// Works the same on Ethereum, Polygon, BSC, etc.
const ethBalance = await getBalance(address, 1);
const polyBalance = await getBalance(address, 137);
const bscBalance = await getBalance(address, 56);`}
        />
      </section>

      {/* Section 4 */}
      <section className="mb-12" aria-labelledby="cross-chain-state">
        <h2 id="cross-chain-state" className="text-display-md mb-4">Cross-chain state.</h2>
        <p className="text-body-md mb-4" style={{ color: 'var(--cc-body)' }}>
          Track user state across chains with Cinacoin&apos;s unified state management.
          This is essential for dashboards, portfolio trackers, and multichain DeFi apps.
        </p>
        <CodeBlock
          language="typescript"
          title="Cross-chain state management."
          code={`import { cinacoin } from '@/lib/cinacoin';
import { supportedChains } from '@/config/chains';

// Fetch data from all supported chains in parallel
async function getMultichainPortfolio(address: string) {
  const results = await Promise.all(
    supportedChains.map(async (chain) => {
      const [balance, tokens] = await Promise.all([
        cinacoin.getBalance({ address, chainId: chain.id }),
        cinacoin.getTokenBalances({ address, chainId: chain.id }),
      ]);

      return {
        chain: chain.name,
        chainId: chain.id,
        nativeBalance: balance,
        tokens,
      };
    })
  );

  return results;
}

// Usage in a React component
function Portfolio({ address }: { address: string }) {
  const [portfolio, setPortfolio] = useState([]);

  useEffect(() => {
    getMultichainPortfolio(address).then(setPortfolio);
  }, [address]);

  return (
    <div>
      {portfolio.map(({ chain, nativeBalance, tokens }) => (
        <div key={chain}>
          <h3>{chain}</h3>
          <p>Balance: {nativeBalance.formatted} {nativeBalance.symbol}</p>
          <p>Tokens: {tokens.length}</p>
        </div>
      ))}
    </div>
  );
}`}
        />
      </section>

      {/* Section 5 */}
      <section className="mb-12" aria-labelledby="chain-switching">
        <h2 id="chain-switching" className="text-display-md mb-4">Chain switching.</h2>
        <p className="text-body-md mb-4" style={{ color: 'var(--cc-body)' }}>
          Let users switch between chains seamlessly. The SDK handles prompting the wallet
          to add/switch networks and updates your app state automatically.
        </p>
        <CodeBlock
          language="typescript"
          title="Chain switching."
          code={`import { cinacoin } from '@/lib/cinacoin';
import { polygon } from '@/config/chains';

// Switch to a specific chain
async function switchToPolygon() {
  try {
    await cinacoin.switchChain(polygon.id);
  } catch (error) {
    if (error.code === 4902) {
      // Chain not added to wallet — request to add it
      await cinacoin.addChain(polygon);
    }
  }
}

// Listen for chain changes
cinacoin.on('chainChanged', (chainId) => {
  // Refetch data for the new chain
  refreshData(chainId);
});`}
        />
      </section>

      {/* Navigation */}
      <nav className="flex justify-between items-center pt-8 border-t" style={{ borderColor: 'var(--cc-hairline)' }} aria-label="Tutorial navigation">
        <a
          href="/wallet-integration"
          className="text-body-sm cc-link-hover"
          style={{ color: 'var(--cc-body)' }}
          aria-label="Previous: Wallet integration"
        >
          ← Previous: Wallet integration.
        </a>
        <a
          href="/best-practices"
          className="cc-btn-primary"
          aria-label="Next: Best practices"
        >
          Next: Best practices. →
        </a>
      </nav>
    </div>
  );
}
