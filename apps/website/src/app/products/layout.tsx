import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Products',
  description: "Explore CINAcoin's complete suite of Web3 products: Wallet, Exchange, Staking, and Explorer.",
  openGraph: {
    title: 'CINAcoin Products',
    description: "Explore CINAcoin's complete suite of Web3 products.",
    url: 'https://cinacoin.com/products',
  },
  twitter: {
    title: 'CINAcoin Products',
    description: "Explore CINAcoin's complete suite of Web3 products.",
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
