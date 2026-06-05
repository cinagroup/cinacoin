import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Activity History — Cinacoin',
  description: 'Track all your wallet interactions and transactions.',
};

export default function ActivityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
