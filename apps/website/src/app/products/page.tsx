import ProductsClient from './ProductsClient';
import { StructuredData } from '@/components/StructuredData';

export default function ProductsPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': 'CinaCoin Products',
    'description': 'Complete Web3 infrastructure suite',
    'brand': {
      '@type': 'Brand',
      'name': 'CinaCoin',
    },
    'offers': {
      '@type': 'AggregateOffer',
      'lowPrice': '0',
      'highPrice': '999',
      'priceCurrency': 'USD',
      'offerCount': '4',
    },
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <ProductsClient />
    </>
  );
}
