import type { Metadata } from 'next'
import ContactContent from './ContactContent'

export const metadata: Metadata = {
  title: 'Contact — Cinacoin',
  description: 'Get in touch with the Cinacoin team. Sales, support, partnerships, or just say hello.',
  alternates: {
    canonical: '/contact',
  },
}

export default function ContactPage() {
  return <ContactContent />
}
