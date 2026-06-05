import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Component Gallery — Cinacoin',
  description: 'Browse all Cinacoin components with live theme previews.',
};

export default function ComponentsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
