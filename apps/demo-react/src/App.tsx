import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { WalletProvider } from './contexts/WalletContext'

const HomePage = lazy(() => import('./pages/HomePage'))
const SwapPage = lazy(() => import('./pages/SwapPage'))
const MultiChainPage = lazy(() => import('./pages/MultiChainPage'))
const AuthPage = lazy(() => import('./pages/AuthPage'))

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-[var(--cc-hairline)] border-t-[var(--cc-link)] rounded-full animate-spin" />
  </div>
)

function App() {
 return (
 <WalletProvider>
 <Suspense fallback={<RouteFallback />}>
 <Routes>
 <Route path="/" element={<HomePage />} />
 <Route path="/swap" element={<SwapPage />} />
 <Route path="/multichain" element={<MultiChainPage />} />
 <Route path="/auth" element={<AuthPage />} />
 </Routes>
 </Suspense>
 </WalletProvider>
 )
}

export default App
