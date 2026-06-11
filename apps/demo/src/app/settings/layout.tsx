import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings — CinaCoin',
  description: 'Customize your CinaCoin demo experience.',
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
