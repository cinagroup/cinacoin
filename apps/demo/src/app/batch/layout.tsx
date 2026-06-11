import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EIP-5792 Atomic Batch — CinaCoin',
  description: 'Send multiple transactions atomically via wallet_sendCalls with real gas estimation.',
};

export default function BatchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
