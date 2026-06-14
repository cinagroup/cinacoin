import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fiat On-Ramp — Cinacoin',
  description: 'Buy crypto with fiat — compare MoonPay, Ramp & Transak rates.',
};

export default function OnrampLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
