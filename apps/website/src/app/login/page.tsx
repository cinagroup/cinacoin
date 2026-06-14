import type { Metadata } from 'next'
import LoginContent from './LoginContent'

export const metadata: Metadata = {
  title: 'Log In',
  description: 'Sign in to your Cinacoin account',
}

export default function LoginPage() {
  return <LoginContent />
}
