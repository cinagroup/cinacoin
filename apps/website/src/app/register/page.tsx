import type { Metadata } from 'next'
import RegisterContent from './RegisterContent'

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your Cinacoin account',
}

export default function RegisterPage() {
  return <RegisterContent />
}
