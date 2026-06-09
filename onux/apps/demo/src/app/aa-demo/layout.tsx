import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account Abstraction Demo — Cinacoin',
  description: 'ERC-4337 smart accounts, session keys, gas sponsorship, and batch transactions.',
};

export default function AADemoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
