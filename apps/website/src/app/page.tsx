import HomeClient from './HomeClient';
import { StructuredData } from '@/components/StructuredData';

export default function HomePage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'CINAcoin',
    'url': 'https://cinacoin.com',
    'logo': 'https://cinacoin.com/logo.png',
    'description': 'The Future of Decentralized Finance',
    'sameAs': [
      'https://twitter.com/cinacoin',
      'https://github.com/cinagroup/cinacoin',
    ],
    'contactPoint': {
      '@type': 'ContactPoint',
      'email': 'contact@cinacoin.com',
      'contactType': 'customer service',
    },
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <HomeClient />
    </>
  );
}
