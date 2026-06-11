import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign-In With Ethereum — CinaCoin',
  description: 'Authenticate with your wallet or biometrics. No passwords, no accounts.',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
