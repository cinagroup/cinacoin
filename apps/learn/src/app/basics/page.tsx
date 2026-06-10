import CodeBlock from "@/components/CodeBlock";
import StepIndicator from "@/components/StepIndicator";
import Link from "next/link";

export const metadata = {
  title: "Web3 Basics — Cinacoin Learn",
  description: "Learn the fundamentals of Web3, blockchain, wallets, and decentralized applications.",
};

export default function BasicsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <StepIndicator currentStep={1} totalSteps={4} />

      <h1 className="text-[32px] font-bold mb-4">Web3 Basics</h1>
      <p className="text-text-secondary mb-8">
        Understand the core concepts of Web3 and how Cinacoin fits into the decentralized ecosystem.
      </p>

      {/* Section 1 */}
      <section className="mb-12">
        <h2 className="text-[24px] font-semibold mb-4">What is Web3?</h2>
        <p className="text-text-secondary mb-4">
          Web3 represents the next evolution of the internet — a decentralized network where users
          control their own data, identity, and assets. Unlike Web2, where centralized companies
          control the infrastructure, Web3 is built on blockchain technology that enables trustless
          peer-to-peer interactions.
        </p>
        <p className="text-text-secondary mb-4">
          Key principles of Web3:
        </p>
        <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
          <li><strong className="text-text-primary">Decentralization</strong> — No single entity controls the network</li>
          <li><strong className="text-text-primary">Ownership</strong> — Users own their data and digital assets</li>
          <li><strong className="text-text-primary">Trustless</strong> — Interactions don't require trusted intermediaries</li>
          <li><strong className="text-text-primary">Permissionless</strong> — Anyone can participate without approval</li>
        </ul>
      </section>

      {/* Section 2 */}
      <section className="mb-12">
        <h2 className="text-[24px] font-semibold mb-4">Blockchain Fundamentals</h2>
        <p className="text-text-secondary mb-4">
          A blockchain is a distributed, immutable ledger that records transactions across a network
          of nodes. Each block contains a set of transactions, and once added to the chain, it cannot
          be altered without consensus from the network.
        </p>
        <CodeBlock
          language="text"
          title="Blockchain Structure"
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
      <section className="mb-12">
        <h2 className="text-[24px] font-semibold mb-4">Wallets & Identity</h2>
        <p className="text-text-secondary mb-4">
          In Web3, your wallet is your identity. It consists of a cryptographic key pair:
          a public key (your address) and a private key (your secret). You use the private key
          to sign transactions, proving ownership without revealing the key itself.
        </p>
        <CodeBlock
          language="typescript"
          title="Wallet Address Generation (Conceptual)"
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
      <section className="mb-12">
        <h2 className="text-[24px] font-semibold mb-4">Smart Contracts</h2>
        <p className="text-text-secondary mb-4">
          Smart contracts are self-executing programs deployed on the blockchain. They run
          exactly as programmed without downtime, censorship, or third-party interference.
          Cinacoin supports smart contracts across multiple chains.
        </p>
        <CodeBlock
          language="solidity"
          title="Simple Smart Contract"
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
      <div className="flex justify-between items-center pt-8 border-t border-border-color">
        <Link
          href="/"
          className="text-text-secondary hover:text-accent-blue transition-colors text-[14px]"
        >
          ← Back to Home
        </Link>
        <Link
          href="/wallet-integration"
          className="px-4 py-2 bg-accent-blue hover:bg-accent-blue/80 text-white rounded-lg text-[14px] font-medium transition-colors"
        >
          Next: Wallet Integration →
        </Link>
      </div>
    </div>
  );
}
