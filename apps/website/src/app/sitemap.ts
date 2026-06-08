import { MetadataRoute } from 'next'

const siteUrl = 'https://cinacoin.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/pricing',
    '/about',
    '/contact',
    '/changelog',
    '/privacy',
    '/terms',
    '/cookies',
  ].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  return routes
}
