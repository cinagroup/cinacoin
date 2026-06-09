import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings — Cinacoin',
  description: 'Customize your Cinacoin demo experience.',
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
