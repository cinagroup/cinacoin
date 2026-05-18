import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Preload WalletConnect SDK — this static import ensures the SDK ships in the bundle
import { EthereumProvider } from '@walletconnect/ethereum-provider'

// Force the bundler to keep the module by exposing it at module scope
if (typeof window !== 'undefined') {
  ;(window as any).__WC = EthereumProvider
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
