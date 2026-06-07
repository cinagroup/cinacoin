import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { getEthereumProvider } from '../wc'

export interface WalletState {
 connected: boolean
 address: string
 chainId: number
 walletId: string | null
 connecting: boolean
 error: string | null
}

interface WalletContextValue extends WalletState {
 connectMetaMask: () => Promise<void>
 connectWalletConnect: () => Promise<void>
 disconnect: () => void
 clearError: () => void
}

const WalletContext = createContext<WalletContextValue | null>(null)

export function useWallet(): WalletContextValue {
 const ctx = useContext(WalletContext)
 if (!ctx) throw new Error('useWallet must be used within WalletProvider')
 return ctx
}

export function formatAddress(addr: string): string {
 return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

declare global {
 interface Window {
 ethereum?: any
 }
}

// WalletConnect provider singleton
let wcProvider: any = null

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 const [state, setState] = useState<WalletState>({
 connected: false,
 address: '',
 chainId: 0,
 walletId: null,
 connecting: false,
 error: null,
 })

 const wcProviderRef = useRef<any>(null)
 const mmListenersRef = useRef<{ accountsChanged: (a: string[]) => void; chainChanged: (c: string) => void } | null>(null)

 // Remove MetaMask listeners on disconnect
 const removeMMListeners = useCallback(() => {
 if (window.ethereum && mmListenersRef.current) {
 window.ethereum.removeListener('accountsChanged', mmListenersRef.current.accountsChanged)
 window.ethereum.removeListener('chainChanged', mmListenersRef.current.chainChanged)
 mmListenersRef.current = null
 }
 }, [])

 // Check for existing connection on mount
 useEffect(() => {
 const checkExisting = async () => {
 // Check MetaMask
 if (window.ethereum) {
 try {
 const accounts = await window.ethereum.request({ method: 'eth_accounts' })
 if (accounts && accounts.length > 0) {
 const chainId = await window.ethereum.request({ method: 'eth_chainId' })
 setState({
 connected: true,
 address: accounts[0],
 chainId: parseInt(chainId, 16),
 walletId: 'metamask',
 connecting: false,
 error: null,
 })

 const onAccountsChanged = (accounts: string[]) => {
 if (accounts.length === 0) {
 setState(prev => ({ ...prev, connected: false, address: '', walletId: null }))
 } else {
 setState(prev => ({ ...prev, address: accounts[0] }))
 }
 }
 const onChainChanged = (chainId: string) => {
 setState(prev => ({ ...prev, chainId: parseInt(chainId, 16) }))
 }

 window.ethereum.on('accountsChanged', onAccountsChanged)
 window.ethereum.on('chainChanged', onChainChanged)
 mmListenersRef.current = { accountsChanged: onAccountsChanged, chainChanged: onChainChanged }
 return
 }
 } catch {
 // No existing connection
 }
 }

 // Check WalletConnect
 if (wcProvider && wcProvider.session) {
 try {
 const accounts = wcProvider.accounts
 if (accounts && accounts.length > 0) {
 setState({
 connected: true,
 address: accounts[0],
 chainId: wcProvider.chainId || 1,
 walletId: 'walletconnect',
 connecting: false,
 error: null,
 })
 return
 }
 } catch {
 // No existing connection
 }
 }
 }
 checkExisting()
 }, [])

 // Sync chain listeners when walletId changes
 useEffect(() => {
 if (state.walletId !== 'metamask' || !window.ethereum) {
 removeMMListeners()
 return
 }

 const onAccountsChanged = (accounts: string[]) => {
 if (accounts.length === 0) {
 setState(prev => ({ ...prev, connected: false, address: '', walletId: null }))
 } else {
 setState(prev => ({ ...prev, address: accounts[0] }))
 }
 }
 const onChainChanged = (chainId: string) => {
 setState(prev => ({ ...prev, chainId: parseInt(chainId, 16) }))
 }

 window.ethereum.on('accountsChanged', onAccountsChanged)
 window.ethereum.on('chainChanged', onChainChanged)
 mmListenersRef.current = { accountsChanged: onAccountsChanged, chainChanged: onChainChanged }

 return () => {
 if (window.ethereum) {
 window.ethereum.removeListener('accountsChanged', onAccountsChanged)
 window.ethereum.removeListener('chainChanged', onChainChanged)
 }
 }
 }, [state.walletId, removeMMListeners])

 const connectMetaMask = useCallback(async () => {
 if (!window.ethereum) {
 setState(prev => ({
 ...prev,
 error: 'No Ethereum wallet detected. Please install MetaMask.',
 connecting: false,
 walletId: 'metamask',
 }))
 return
 }

 setState(prev => ({ ...prev, connecting: true, error: null, walletId: 'metamask' }))

 try {
 const accounts = await window.ethereum.request({
 method: 'eth_requestAccounts',
 })

 const chainId = await window.ethereum.request({ method: 'eth_chainId' })

 setState({
 connected: true,
 address: accounts[0],
 chainId: parseInt(chainId, 16),
 walletId: 'metamask',
 connecting: false,
 error: null,
 })

 // Listeners are managed by the useEffect above, triggered by walletId change
 } catch (err: unknown) {
 const error = err as { code?: number; message?: string }
 let message = 'Failed to connect wallet'
 if (error.code === 4001) {
 message = 'User rejected the connection request'
 } else if (error.message) {
 message = error.message
 }
 setState(prev => ({
 ...prev,
 error: message,
 connecting: false,
 }))
 }
 }, [])

 const connectWalletConnect = useCallback(async () => {
 setState(prev => ({ ...prev, connecting: true, error: null, walletId: 'walletconnect' }))

  try {
 const projectId = import.meta.env.VITE_WC_PROJECT_ID
 if (!projectId) {
 throw new Error(
 'WalletConnect is not configured: set VITE_WC_PROJECT_ID to a valid project ID. ' +
 'Get one at https://cloud.reown.com (or your self-hosted relay project).'
 )
 }
 if (!wcProvider) {
 const EthereumProvider = await getEthereumProvider()
 wcProvider = await EthereumProvider.init({
 projectId,
 chains: [1],
 showQrModal: true,
 qrModalOptions: {
 themeMode: 'dark',
 },
 methods: ['eth_sendTransaction', 'personal_sign'],
 events: ['chainChanged', 'accountsChanged'],
 metadata: {
 name: 'Cinacoin Demo',
 description: 'Cinacoin Demo Application',
 url: import.meta.env.VITE_APP_URL ?? 'https://react.cinacoin.com',
 icons: ['https://avatars.githubusercontent.com/u/37784886'],
 },
 })
 wcProviderRef.current = wcProvider
 }

 await wcProvider.connect({
 chains: [1],
 })

 const accounts = wcProvider.accounts
 if (accounts && accounts.length > 0) {
 setState({
 connected: true,
 address: accounts[0],
 chainId: wcProvider.chainId || 1,
 walletId: 'walletconnect',
 connecting: false,
 error: null,
 })
 } else {
 setState(prev => ({
 ...prev,
 error: 'No accounts returned from WalletConnect',
 connecting: false,
 }))
 }
 } catch (err: unknown) {
 const error = err as { message?: string }
 let message = 'Failed to connect WalletConnect'
 if (error.message?.includes('rejected') || error.message?.includes('User rejected')) {
 message = 'User rejected the connection request'
 } else if (error.message) {
 message = error.message
 }
 setState(prev => ({
 ...prev,
 error: message,
 connecting: false,
 }))
 }
 }, [])

 const disconnect = useCallback(() => {
 removeMMListeners()

 if (wcProvider) {
 wcProvider.disconnect?.()
 }

 setState({
 connected: false,
 address: '',
 chainId: 0,
 walletId: null,
 connecting: false,
 error: null,
 })
 }, [removeMMListeners])

 const clearError = useCallback(() => {
 setState(prev => ({ ...prev, error: null }))
 }, [])

 return (
 <WalletContext.Provider value={{
 ...state,
 connectMetaMask,
 connectWalletConnect,
 disconnect,
 clearError,
 }}>
 {children}
 </WalletContext.Provider>
 )
}
