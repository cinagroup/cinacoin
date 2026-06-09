import type { Metadata } from 'next'
import ComponentsShowcase from './ComponentsShowcase'

export const metadata: Metadata = {
  title: 'Component Library',
  description: 'Cinacoin shared UI component library showcase',
  robots: { index: false, follow: false },
}

export default function ComponentsPage() {
  return <ComponentsShowcase />
}
