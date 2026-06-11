import React from 'react'
import { SiteFooter as SharedFooter } from '@cinacoin/ui'

export const SiteFooter: React.FC = () => (
  <SharedFooter
    tagline="Interactive CinaCoin SDK demo."
    columns={[
      {
        heading: 'Demo',
        links: [
          { label: 'Swap', href: '/swap' },
          { label: 'Multi-Chain', href: '/multichain' },
          { label: 'Auth', href: '/auth' },
        ],
      },
      {
        heading: 'Developers',
        links: [
          { label: 'Docs', href: 'https://docs.cinacoin.com' },
          { label: 'GitHub', href: 'https://github.com/cinagroup' },
        ],
      },
      {
        heading: 'Company',
        links: [{ label: 'Back to CinaCoin', href: 'https://cinacoin.com' }],
      },
    ]}
  />
)

export default SiteFooter
