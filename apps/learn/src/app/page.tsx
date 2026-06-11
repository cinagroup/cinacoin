import TutorialCard from "@/components/TutorialCard";
import { Rocket } from "lucide-react";

const tutorials = [
  {
    title: "Web3 basics.",
    description:
      "Understand the fundamentals of blockchain, wallets, and decentralized applications. Start your Web3 journey here.",
    difficulty: "Beginner" as const,
    duration: "15 min read",
    href: "/basics",
  },
  {
    title: "Wallet integration.",
    description:
      "Learn how to connect wallets, sign transactions, and interact with smart contracts using the CinaCoin SDK.",
    difficulty: "Intermediate" as const,
    duration: "25 min read",
    href: "/wallet-integration",
  },
  {
    title: "Multichain development.",
    description:
      "Build applications that work across multiple blockchains with CinaCoin's unified multichain API.",
    difficulty: "Advanced" as const,
    duration: "30 min read",
    href: "/multichain",
  },
  {
    title: "Best practices.",
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
        <p className="cc-mono text-caption mb-2" style={{ color: 'var(--cc-mute)' }}>Learning hub</p>
        <h1 className="text-display-xl mb-4">
          Welcome to{" "}
          <span style={{ color: 'var(--cc-link)' }}>CinaCoin Learn</span>.
        </h1>
        <p className="text-body-lg max-w-2xl" style={{ color: 'var(--cc-body)' }}>
          Master Web3 development with hands-on tutorials, code examples, and
          step-by-step guides. Build decentralized applications with confidence.
        </p>
      </div>

      <section className="mb-12" aria-labelledby="tutorials-heading">
        <p className="cc-mono text-caption mb-2" style={{ color: 'var(--cc-mute)' }}>Tutorials</p>
        <h2 id="tutorials-heading" className="text-display-md mb-6">Tutorials.</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tutorials.map((tutorial) => (
            <TutorialCard key={tutorial.href} {...tutorial} />
          ))}
        </div>
      </section>

      <section className="cc-card" aria-labelledby="quick-start-heading">
        <p className="cc-mono text-caption mb-2" style={{ color: 'var(--cc-mute)' }}>Quick start</p>
        <h2 id="quick-start-heading" className="text-display-sm mb-4">
          <Rocket className="w-5 h-5 inline-block mr-1" aria-hidden="true" /> Getting started.
        </h2>
        <p className="mb-4" style={{ color: 'var(--cc-body)' }}>
          New to Web3? Start with the basics and work your way up. Each tutorial
          builds on the previous one, so follow the recommended order for the
          best learning experience.
        </p>
        <div className="flex gap-4">
          <a
            href="/basics"
            className="cc-btn-primary"
          >
            Start learning →
          </a>
          <a
            href="https://cinacoin.com/docs"
            className="cc-btn-secondary"
          >
            View docs
          </a>
        </div>
      </section>
    </div>
  );
}
