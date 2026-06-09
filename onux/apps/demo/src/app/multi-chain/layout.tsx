import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Multi-Chain — Cinacoin',
  description: 'Multi-chain connectivity across 16 networks.',
};

export default function MultiChainLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
