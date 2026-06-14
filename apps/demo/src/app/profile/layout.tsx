import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile — Cinacoin',
  description: 'Your identity, wallets, and portfolio.',
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
