import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Component Gallery — CinaCoin',
  description: 'Browse all CinaCoin components with live theme previews.',
};

export default function ComponentsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
