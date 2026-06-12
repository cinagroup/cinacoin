import CodeBlock from "@/components/CodeBlock";
import StepIndicator from "@/components/StepIndicator";


export const metadata = {
  title: "Web3 basics. — CinaCoin Learn",
  description: "Learn the fundamentals of Web3, blockchain, wallets, and decentralized applications.",
};

export default function BasicsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <StepIndicator currentStep={1} totalSteps={4} />

      <h1 className="text-display-lg mb-4">Web3 basics</h1>
      <p className="text-body-lg mb-8" style={{ color: 'var(--cc-body)' }}>
        Understand the core concepts of Web3 and how CinaCoin fits into the decentralized ecosystem.
      </p>

      {/* Section 1 */}
      <section className="mb-12" aria-labelledby="what-is-web3">
        <h2 id="what-is-web3" className="text-display-md mb-4">What is Web3?</h2>
        <p className="text-body-md mb-4" style={{ color: 'var(--cc-body)' }}>
          Web3 represents the next evolution of the internet — a decentralized network where users
          control their own data, identity, and assets. Unlike Web2, where centralized companies
          control the infrastructure, Web3 is built on blockchain technology that enables trustless
          peer-to-peer interactions.
        </p>
        <p className="text-body-md mb-4" style={{ color: 'var(--cc-body)' }}>
          Key principles of Web3:
        </p>
        <ul className="list-disc list-inside space-y-2 mb-4" style={{ color: 'var(--cc-body)' }}>
          <li><strong className="font-semibold">Decentralization</strong> — No single entity controls the network.</li>
          <li><strong className="font-semibold">Ownership</strong> — Users own their data and digital assets.</li>
          <li><strong className="font-semibold">Trustless</strong> — Interactions don&apos;t require trusted intermediaries.</li>
          <li><strong className="font-semibold">Permissionless</strong> — Anyone can participate without approval.</li>
        </ul>
      </section>

      {/* Section 2 */}
      <section className="mb-12" aria-labelledby="blockchain-fundamentals">
        <h2 id="blockchain-fundamentals" className="text-display-md mb-4">Blockchain fundamentals</h2>
        <p className="text-body-md mb-4" style={{ color: 'var(--cc-body)' }}>
          A blockchain is a distributed, immutable ledger that records transactions across a network
          of nodes. Each block contains a set of transactions, and once added to the chain, it cannot
          be altered without consensus from the network.
        </p>
        <CodeBlock
          language="text"
          title="Blockchain structure."
          code={`Block #1 (Genesis)
├── Timestamp: 2024-01-01T00:00:00Z
├── Transactions: [...]
├── Previous Hash: 0x0000...0000
└── Hash: 0xabc1...def2

Block #2
├── Timestamp: 2024-01-01T00:10:00Z
├── Transactions: [...]
├── Previous Hash: 0xabc1...def2
└── Hash: 0x1234...5678`}
        />
      </section>

      {/* Section 3 */}
      <section className="mb-12" aria-labelledby="wallets-identity">
        <h2 id="wallets-identity" className="text-display-md mb-4">Wallets and identity</h2>
        <p className="text-body-md mb-4" style={{ color: 'var(--cc-body)' }}>
          In Web3, your wallet is your identity. It consists of a cryptographic key pair:
          a public key (your address) and a private key (your secret). You use the private key
          to sign transactions, proving ownership without revealing the key itself.
        </p>
        <CodeBlock
          language="typescript"
          title="Wallet address generation (conceptual)."
          code={`// Your private key generates your public key
const privateKey = "0x..."; // Keep this secret!
const publicKey = derivePublicKey(privateKey);

// Your address is derived from the public key
const address = deriveAddress(publicKey);
// → "0x742d35Cc6634C0532925a3b844Bc9e7595f..."

// You sign messages to prove ownership
const signature = sign(message, privateKey);
const isValid = verify(message, signature, address);
// → true`}
        />
      </section>

      {/* Section 4 */}
      <section className="mb-12" aria-labelledby="smart-contracts">
        <h2 id="smart-contracts" className="text-display-md mb-4">Smart contracts</h2>
        <p className="text-body-md mb-4" style={{ color: 'var(--cc-body)' }}>
          Smart contracts are self-executing programs deployed on the blockchain. They run
          exactly as programmed without downtime, censorship, or third-party interference.
          CinaCoin supports smart contracts across multiple chains.
        </p>
        <CodeBlock
          language="solidity"
          title="Simple smart contract."
          code={`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleStorage {
    uint256 private value;

    function set(uint256 _value) public {
        value = _value;
    }

    function get() public view returns (uint256) {
        return value;
    }
}`}
        />
      </section>

      {/* Navigation */}
      <nav className="flex justify-between items-center pt-8 border-t" style={{ borderColor: 'var(--cc-hairline)' }} aria-label="Tutorial navigation">
        <a
          href="/"
          className="text-body-sm cc-link-hover"
          style={{ color: 'var(--cc-body)' }}
        >
          ← Back to home.
        </a>
        <a
          href="/wallet-integration"
          className="cc-btn-primary"
        >
          Next: Wallet integration. →
        </a>
      </nav>
    </div>
  );
}
