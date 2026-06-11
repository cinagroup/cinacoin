import TutorialCard from "@/components/TutorialCard";

const tutorials = [
  {
    title: "Web3 Basics",
    description:
      "Understand the fundamentals of blockchain, wallets, and decentralized applications. Start your Web3 journey here.",
    difficulty: "Beginner" as const,
    duration: "15 min read",
    href: "/basics",
  },
  {
    title: "Wallet Integration",
    description:
      "Learn how to connect wallets, sign transactions, and interact with smart contracts using Cinacoin SDK.",
    difficulty: "Intermediate" as const,
    duration: "25 min read",
    href: "/wallet-integration",
  },
  {
    title: "Multichain Development",
    description:
      "Build applications that work across multiple blockchains with Cinacoin's unified multichain API.",
    difficulty: "Advanced" as const,
    duration: "30 min read",
    href: "/multichain",
  },
  {
    title: "Best Practices",
    description:
      "Production-ready patterns for security, performance, error handling, and user experience in Web3 apps.",
    difficulty: "Advanced" as const,
    duration: "20 min read",
    href: "/best-practices",
  },
];

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-12">
        <h1 className="text-display-xl font-semibold mb-4">
          Welcome to{" "}
          <span className="text-accent-blue">Cinacoin Learn</span>
        </h1>
        <p className="text-body-lg text-text-secondary max-w-2xl">
          Master Web3 development with hands-on tutorials, code examples, and
          step-by-step guides. Build decentralized applications with confidence.
        </p>
      </div>

      <section className="mb-12">
        <h2 className="text-display-md font-semibold mb-6">Tutorials</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tutorials.map((tutorial) => (
            <TutorialCard key={tutorial.href} {...tutorial} />
          ))}
        </div>
      </section>

      <section className="bg-bg-card border border-border-color rounded-xl p-8">
        <h2 className="text-display-sm font-semibold mb-4">🚀 Getting Started</h2>
        <p className="text-text-secondary mb-4">
          New to Web3? Start with the basics and work your way up. Each tutorial
          builds on the previous one, so follow the recommended order for the
          best learning experience.
        </p>
        <div className="flex gap-4">
          <a
            href="/basics"
            className="px-4 py-2 bg-accent-blue hover:bg-accent-blue/80 text-[var(--color-on-primary)] rounded-lg text-body-sm font-medium transition-colors"
          >
            Start Learning →
          </a>
          <a
            href="https://cinacoin.com/docs"
            className="px-4 py-2 border border-border-color hover:border-accent-blue/50 text-text-secondary hover:text-text-primary rounded-lg text-body-sm font-medium transition-colors"
          >
            View Docs
          </a>
        </div>
      </section>
    </div>
  );
}
