import CodeBlock from "@/components/CodeBlock";
import StepIndicator from "@/components/StepIndicator";
import Link from "next/link";

export const metadata = {
  title: "Multichain Development — Cinacoin Learn",
  description: "Build applications that work across multiple blockchains with Cinacoin's unified API.",
};

export default function MultichainPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <StepIndicator currentStep={3} totalSteps={4} />

      <h1 className="text-display-lg font-bold mb-4">Multichain Development</h1>
      <p className="text-text-secondary mb-8">
        Build applications that seamlessly work across multiple blockchains using Cinacoin's
        unified multichain infrastructure.
      </p>

      {/* Section 1 */}
      <section className="mb-12">
        <h2 className="text-display-md font-semibold mb-4">Why Multichain?</h2>
        <p className="text-text-secondary mb-4">
          The blockchain ecosystem is multi-chain by nature. Users hold assets on Ethereum,
          Polygon, BSC, Arbitrum, and dozens of other chains. Your application should meet
          users where they are — not force them onto a single network.
        </p>
        <p className="text-text-secondary mb-4">
          Cinacoin provides a unified API that abstracts away chain-specific differences,
          letting you write code once and deploy everywhere.
        </p>
      </section>

      {/* Section 2 */}
      <section className="mb-12">
        <h2 className="text-display-md font-semibold mb-4">Configure Supported Chains</h2>
        <p className="text-text-secondary mb-4">
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
    default: { name: 'Polygonscan', url: 'https://polygonscan.com' },
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
      <section className="mb-12">
        <h2 className="text-display-md font-semibold mb-4">Chain-Agnostic Interactions</h2>
        <p className="text-text-secondary mb-4">
          Use the same API regardless of which chain you're interacting with.
          The SDK automatically routes requests to the correct chain.
        </p>
        <CodeBlock
          language="typescript"
          title="Chain-agnostic operations"
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
      <section className="mb-12">
        <h2 className="text-display-md font-semibold mb-4">Cross-Chain State</h2>
        <p className="text-text-secondary mb-4">
          Track user state across chains with Cinacoin's unified state management.
          This is essential for dashboards, portfolio trackers, and multichain DeFi apps.
        </p>
        <CodeBlock
          language="typescript"
          title="Cross-chain state management"
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
      <section className="mb-12">
        <h2 className="text-display-md font-semibold mb-4">Chain Switching</h2>
        <p className="text-text-secondary mb-4">
          Let users switch between chains seamlessly. The SDK handles prompting the wallet
          to add/switch networks and updates your app state automatically.
        </p>
        <CodeBlock
          language="typescript"
          title="Chain switching"
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
});`
        />
      </section>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-8 border-t border-border-color">
        <Link
          href="/wallet-integration"
          className="text-text-secondary hover:text-accent-blue transition-colors text-body-sm"
        >
          ← Previous: Wallet Integration
        </Link>
        <Link
          href="/best-practices"
          className="px-4 py-2 bg-accent-blue hover:bg-accent-blue/80 text-[var(--color-on-primary)] rounded-lg text-body-sm font-medium transition-colors"
        >
          Next: Best Practices →
        </Link>
      </div>
    </div>
  );
}
