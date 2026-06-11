import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Swap — CinaCoin',
  description: 'Swap tokens with real DEX aggregator rates across 16 chains.',
};

export default function SwapLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
