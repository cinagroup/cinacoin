import React from 'react';
import Head from '@docusaurus/Head';

/**
 * Root component that wraps the entire app.
 * Used to inject global structured data (JSON-LD) for SEO.
 */
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Head>
        {/* Organization Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'CinaCoin',
            url: 'https://cinacoin.com',
            logo: 'https://cinacoin.com/img/logo.svg',
            description: 'Onchain UX toolkit - Self-hosted wallet connection toolkit',
            sameAs: [
              'https://github.com/cinagroup/cinacoin',
              'https://twitter.com/cinacoin',
            ],
          })}
        </script>

        {/* SoftwareApplication Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'CinaCoin',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Web',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
            description:
              'Self-hosted wallet connection toolkit for Web3 applications. Supports EIP-6963, ERC-4337 smart accounts, multi-chain, and zero license fees.',
            featureList: [
              'Wallet Connection (EIP-6963)',
              'Smart Accounts (ERC-4337)',
              'Multi-Framework UI (React, Vue, Svelte, Angular)',
              'Multi-Chain Support (EVM, Bitcoin, Cosmos, Solana)',
              'Self-Hosted Infrastructure',
              'Zero License Fees',
            ],
          })}
        </script>

        {/* WebSite Schema with SearchAction */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'CinaCoin Documentation',
            url: 'https://cinacoin.com/docs/',
            description:
              'Complete documentation for CinaCoin Onchain UX Toolkit. API reference, guides, and SDK documentation.',
            publisher: {
              '@type': 'Organization',
              name: 'CinaCoin',
              logo: {
                '@type': 'ImageObject',
                url: 'https://cinacoin.com/img/logo.svg',
              },
            },
          })}
        </script>
      </Head>
      {children}
    </>
  );
}
