import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tokens — CinaCoin',
  description: 'Search tokens, view details, and swap in one place.',
};

export default function TokensLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
