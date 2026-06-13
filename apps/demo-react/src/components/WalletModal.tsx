import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Link2, CircleDot, ShieldCheck, Palette, Ghost, Lock, Sparkles } from 'lucide-react'
import { useWallet, formatAddress } from '../contexts/WalletContext'

interface WalletOption {
  id: string
  name: string
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>
  color: string
  popular: boolean
}

const WALLETS: WalletOption[] = [
 { id: 'metamask', name: 'MetaMask', icon: CircleDot, color: 'var(--cc-demo-wallet-metamask)', popular: true },
 { id: 'walletconnect', name: 'WalletConnect', icon: Link2, color: 'var(--cc-demo-wallet-walletconnect)', popular: true },
 { id: 'coinbase', name: 'Coinbase Wallet', icon: CircleDot, color: 'var(--cc-demo-wallet-coinbase)', popular: true },
 { id: 'rainbow', name: 'Rainbow', icon: Palette, color: 'var(--cc-demo-wallet-rainbow)', popular: true },
 { id: 'phantom', name: 'Phantom', icon: Ghost, color: 'var(--cc-demo-wallet-phantom)', popular: true },
 { id: 'trust', name: 'Trust Wallet', icon: ShieldCheck, color: 'var(--cc-demo-wallet-trust)', popular: true },
 { id: 'ledger', name: 'Ledger', icon: Lock, color: 'var(--cc-demo-wallet-ledger)', popular: false },
 { id: 'zerion', name: 'Zerion', icon: Sparkles, color: 'var(--cc-demo-wallet-zerion)', popular: false },
]

type ModalState = 'closed' | 'open' | 'connecting' | 'success' | 'error' | 'no-wallet'

interface WalletModalProps {
 isOpen: boolean
 onClose: () => void
}

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
 const { connected, address, walletId, connectMetaMask, connectWalletConnect, disconnect, error: ctxError, clearError } = useWallet()
 const modalRef = useRef<HTMLDivElement>(null)

 const [modalState, setModalState] = useState<ModalState>(isOpen ? 'open' : 'closed')
 const [selectedWallet, setSelectedWallet] = useState<WalletOption | null>(null)
 const [activeTab, setActiveTab] = useState<'popular' | 'all'>('popular')

 // Detect installed wallets
 const isMetaMaskInstalled = typeof window !== 'undefined' && !!window.ethereum?.isMetaMask
 const isCoinbaseInstalled = typeof window !== 'undefined' && !!window.ethereum?.isCoinbaseWallet

 // Keyboard handler: Escape to close from any state
 useEffect(() => {
 if (!isOpen) return
 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key === 'Escape') {
 e.preventDefault()
 if (modalState === 'connecting') {
 // Don't disconnect during connection attempt
 return
 }
 setModalState('closed')
 setSelectedWallet(null)
 clearError()
 onClose()
 }
 }
 document.addEventListener('keydown', handleKeyDown)
 return () => document.removeEventListener('keydown', handleKeyDown)
 }, [isOpen, modalState, onClose, clearError])

 // Focus trap: trap focus within modal when open
 useEffect(() => {
 if (!isOpen || !modalRef.current) return
 const modal = modalRef.current
 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key !== 'Tab') return
 const focusable = modal.querySelectorAll<HTMLElement>(
 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
 )
 if (focusable.length === 0) return
 const first = focusable[0]
 const last = focusable[focusable.length - 1]
 if (e.shiftKey && document.activeElement === first) {
 e.preventDefault()
 last.focus()
 } else if (!e.shiftKey && document.activeElement === last) {
 e.preventDefault()
 first.focus()
 }
 }
 modal.addEventListener('keydown', handleKeyDown)
 // Also focus first element on open
 const firstFocusable = modal.querySelector<HTMLElement>(
 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
 )
 firstFocusable?.focus()
 return () => modal.removeEventListener('keydown', handleKeyDown)
 }, [isOpen])

 useEffect(() => {
 if (isOpen) {
 setModalState('open')
 setSelectedWallet(null)
 clearError()
 }
 }, [isOpen, clearError])

 // If already connected from outside the modal, show success
 useEffect(() => {
 if (connected && modalState !== 'success') {
 setModalState('success')
 }
 }, [connected, modalState])

 const handleSelectWallet = useCallback(async (wallet: WalletOption) => {
 setSelectedWallet(wallet)
 clearError()

 if (wallet.id === 'metamask') {
 setModalState('connecting')
 try {
 await connectMetaMask()
 } catch {
 // error handled by context
 }
 } else if (wallet.id === 'walletconnect') {
 setModalState('connecting')
 try {
 await connectWalletConnect()
 } catch {
 // error handled by context
 }
 } else if (wallet.id === 'coinbase' && isCoinbaseInstalled) {
 setModalState('connecting')
 try {
 await connectMetaMask() // Coinbase injects as window.ethereum too
 } catch {
 // error handled by context
 }
 } else {
 // Wallet not installed — show"no wallet" state
 setModalState('no-wallet')
 }
 }, [connectMetaMask, connectWalletConnect, clearError, isCoinbaseInstalled])

 const handleClose = useCallback(() => {
 setModalState('closed')
 setSelectedWallet(null)
 clearError()
 // Don't disconnect on close — user may still be connected
 onClose()
 }, [onClose, clearError])

 const handleBack = useCallback(() => {
 setModalState('open')
 setSelectedWallet(null)
 clearError()
 }, [clearError])

 const handleRetry = useCallback(async () => {
 if (!selectedWallet) return
 clearError()
 setModalState('connecting')
 try {
 if (selectedWallet.id === 'walletconnect') {
 await connectWalletConnect()
 } else {
 await connectMetaMask()
 }
 } catch {
 // error handled by context
 }
 }, [selectedWallet, connectMetaMask, connectWalletConnect, clearError])

 const handleDisconnect = useCallback(() => {
 disconnect()
 setModalState('closed')
 setSelectedWallet(null)
 clearError()
 onClose()
 }, [disconnect, clearError, onClose])

 // Show success if connected
 const displayAddress = address ? formatAddress(address) : ''
 const error = ctxError

 if (modalState === 'closed') return null

 const popularWallets = WALLETS.filter(w => w.popular)
 const allWallets = WALLETS.filter(w => !w.popular)

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Connect wallet dialog">
 {/* Backdrop */}
 <div
 className="absolute inset-0 bg-[var(--color-ink)]/60 backdrop-blur-sm animate-fade-in"
 onClick={modalState === 'open' || modalState === 'no-wallet' ? handleClose : undefined}
 />

 {/* Modal */}
 <div ref={modalRef} className="relative z-10 w-full max-w-md mx-4 animate-bounce-in">
 <div className="cc-card rounded-[var(--cc-radius-lg)] overflow-hidden">
 {/* Header */}
 <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--cc-hairline)]">
 <div className="flex items-center gap-3">
 {(modalState === 'connecting' || modalState === 'success' || modalState === 'error' || modalState === 'no-wallet') && (
 <button
 onClick={modalState === 'success' ? handleClose : handleBack}
 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); modalState === 'success' ? handleClose() : handleBack(); } }}
 className="p-1 rounded-sm hover:bg-[var(--cc-canvas-soft)] transition-colors focus-ring"
 aria-label="Go back"
 >
 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
 </svg>
 </button>
 )}
 <h2 className="cc-display-sm">
 {modalState === 'connecting' ? 'Connecting...' :
 modalState === 'success' ? 'Connected' :
 modalState === 'error' ? 'Connection Failed' :
 modalState === 'no-wallet' ? 'Wallet Not Found' : 'Connect Wallet'}
 </h2>
 </div>
 <button
 onClick={handleClose}
 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClose(); } }}
 className="p-2 rounded-sm hover:bg-[var(--cc-canvas-soft)] transition-colors focus-ring"
 aria-label="Close dialog"
 >
 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
 </svg>
 </button>
 </div>

 {/* Content */}
 <div className="max-h-[60vh] overflow-y-auto">
 {modalState === 'open' && (
 <>
 {/* Tabs */}
 <div className="flex px-6 pt-4 gap-2">
 <button
 onClick={() => setActiveTab('popular')}
 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab('popular'); } }}
 className={`px-4 py-2 rounded-sm text-body-sm font-medium transition-all focus-ring ${
 activeTab === 'popular'
 ? 'bg-[var(--cc-link)]/20 text-[var(--cc-link)]'
 : 'text-[var(--cc-muted)] hover:text-[var(--cc-ink)]'
 }`}
 >
 Popular
 </button>
 <button
 onClick={() => setActiveTab('all')}
 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab('all'); } }}
 className={`px-4 py-2 rounded-sm text-body-sm font-medium transition-all focus-ring ${
 activeTab === 'all'
 ? 'bg-[var(--cc-link)]/20 text-[var(--cc-link)]'
 : 'text-[var(--cc-muted)] hover:text-[var(--cc-ink)]'
 }`}
 >
 All wallets
 </button>
 </div>

 <div className="px-6 pb-6 pt-2">
 {activeTab === 'popular' && (
 <div className="space-y-2">
 {popularWallets.map((wallet, i) => {
 const detected = wallet.id === 'metamask' && isMetaMaskInstalled
 || wallet.id === 'coinbase' && isCoinbaseInstalled
 return (
 <button
 key={wallet.id}
 onClick={() => handleSelectWallet(wallet)}
 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectWallet(wallet); } }}
 className="w-full flex items-center gap-4 px-4 py-3 rounded-sm hover:bg-[var(--cc-canvas-soft)]/50 transition-all group focus-ring"
 style={{ animationDelay: `${i * 0.05}s` }}
 aria-label={`Connect with ${wallet.name}`}
 >
 <div
 className="w-10 h-10 rounded-sm flex items-center justify-center cc-display-sm"
 style={{ backgroundColor: wallet.color + '20' }}
 aria-hidden="true"
 >
 <wallet.icon className="w-5 h-5" style={{ color: wallet.color }} />
 </div>
 <span className="flex-1 text-left font-medium">{wallet.name}</span>
 {detected && (
 <span className="text-caption px-2 py-1 rounded-sm bg-[var(--cc-success)]/20 text-[var(--cc-success)]" role="status">
 Detected
 </span>
 )}
 <svg className="w-5 h-5 text-[var(--cc-muted)] group-hover:text-[var(--cc-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
 </svg>
 </button>
 )
 })}
 </div>
 )}

 {activeTab === 'all' && (
 <div className="space-y-2">
 {allWallets.map((wallet, i) => (
 <button
 key={wallet.id}
 onClick={() => handleSelectWallet(wallet)}
 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectWallet(wallet); } }}
 className="w-full flex items-center gap-4 px-4 py-3 rounded-sm hover:bg-[var(--cc-canvas-soft)]/50 transition-all group focus-ring"
 style={{ animationDelay: `${i * 0.05}s` }}
 aria-label={`Connect with ${wallet.name}`}
 >
 <div
 className="w-10 h-10 rounded-sm flex items-center justify-center cc-display-sm"
 style={{ backgroundColor: wallet.color + '20' }}
 aria-hidden="true"
 >
 <wallet.icon className="w-5 h-5" style={{ color: wallet.color }} />
 </div>
 <span className="flex-1 text-left font-medium">{wallet.name}</span>
 <svg className="w-5 h-5 text-[var(--cc-muted)] group-hover:text-[var(--cc-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
 </svg>
 </button>
 ))}
 </div>
 )}
 </div>
 </>
 )}

 {modalState === 'connecting' && selectedWallet && (
 <div className="flex flex-col items-center justify-center py-12 px-6">
 {/* Spinning loader */}
 <div className="relative mb-6">
 <div className="w-20 h-20 rounded-sm border-2 border-[var(--cc-hairline)]" />
 <div
 className="absolute inset-0 w-20 h-20 rounded-sm border-2 border-transparent border-t-[var(--cc-link)] animate-spin-slow"
 />
 <div
 className="absolute inset-2 w-16 h-16 rounded-sm flex items-center justify-center text-display-md"
 style={{ backgroundColor: selectedWallet.color + '20' }}
 >
 <selectedWallet.icon className="w-8 h-8" style={{ color: selectedWallet.color }} />
 </div>
 </div>
 <p className="text-[var(--cc-muted)] text-body-sm mb-4">
 Opening {selectedWallet.name}...
 </p>
 <p className="text-[var(--cc-muted)] text-caption">
 Confirm connection in your wallet popup
 </p>
 </div>
 )}

 {modalState === 'success' && (
 <div className="flex flex-col items-center justify-center py-12 px-6">
 {/* Checkmark animation */}
 <div className="w-20 h-20 rounded-sm bg-[var(--cc-success)]/20 flex items-center justify-center mb-6 animate-bounce-in">
 <svg className="w-10 h-10 text-[var(--cc-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
 </svg>
 </div>
 <h3 className="cc-display-sm mb-2">Wallet connected.</h3>
 <p className="text-[var(--cc-muted)] text-body-sm mb-2">
 Connected via injected provider
 </p>
 {address && (
 <div className="flex items-center gap-2 px-4 py-2 rounded-sm bg-[var(--cc-canvas-soft)]/50 text-body-sm text-[var(--cc-body)] font-[var(--font-mono)]">
 <span>{displayAddress}</span>
 <button
 onClick={() => navigator.clipboard.writeText(address)}
 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigator.clipboard.writeText(address); } }}
 className="p-1 rounded hover:bg-[var(--cc-canvas-soft)] transition-colors focus-ring"
 aria-label="Copy address to clipboard"
 title="Copy address"
 >
 <svg className="w-4 h-4 text-[var(--cc-muted)] hover:text-[var(--cc-body)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
 </svg>
 </button>
 </div>
 )}
 <button
 onClick={handleDisconnect}
 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleDisconnect(); } }}
 className="mt-4 px-4 py-2 rounded-sm bg-[var(--cc-canvas-soft)]/50 text-[var(--cc-muted)] hover:text-[var(--cc-ink)] hover:bg-[var(--cc-canvas-soft)] transition-colors text-body-sm focus-ring"
 aria-label="Disconnect wallet"
 >
 Disconnect
 </button>
 </div>
 )}

 {modalState === 'error' && selectedWallet && (
 <div className="flex flex-col items-center justify-center py-12 px-6">
 {/* Error icon */}
 <div className="w-20 h-20 rounded-sm bg-[var(--cc-error)]/15 flex items-center justify-center mb-6 animate-bounce-in">
 <svg className="w-10 h-10 text-[var(--cc-error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
 </svg>
 </div>
 <h3 className="cc-display-sm mb-2">Connection failed.</h3>
 <p className="text-[var(--cc-muted)] text-body-sm mb-6 text-center max-w-xs">
 {error || 'Something went wrong while connecting your wallet.'}
 </p>
 <button
 onClick={handleRetry}
 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleRetry(); } }}
 className="cc-btn-primary px-6 py-3 text-body-sm font-medium focus-ring"
 >
 Try Again
 </button>
 </div>
 )}

 {modalState === 'no-wallet' && selectedWallet && (
 <div className="flex flex-col items-center justify-center py-12 px-6">
 {/* Wallet not found icon */}
 <div className="w-20 h-20 rounded-sm bg-[var(--cc-warning)]/15 flex items-center justify-center mb-6 animate-bounce-in">
 <div className="text-display-xl"><selectedWallet.icon className="w-8 h-8" style={{ color: selectedWallet.color }} /></div>
 </div>
 <h3 className="cc-display-sm mb-2">
 {selectedWallet.id === 'walletconnect'
 ? 'WalletConnect — QR Code Not Available'
 : `${selectedWallet.name} Not Installed`}
 </h3>
 <p className="text-[var(--cc-muted)] text-body-sm mb-6 text-center max-w-xs">
 {selectedWallet.id === 'walletconnect'
 ? 'WalletConnect QR scanning requires a real provider setup. For now, try MetaMask or another injected wallet.'
 : `You don't have ${selectedWallet.name} installed. Install it to connect your wallet.`}
 </p>
 <div className="flex flex-col gap-3 w-full max-w-xs">
 {selectedWallet.id === 'metamask' && (
 <a
 href="https://metamask.io/download/"
 target="_blank"
 rel="noopener noreferrer"
 className="cc-btn-primary px-6 py-3 rounded-sm text-body-sm font-medium text-center"
 >
 Install MetaMask →
 </a>
 )}
 {selectedWallet.id === 'coinbase' && (
 <a
 href="https://www.coinbase.com/wallet"
 target="_blank"
 rel="noopener noreferrer"
 className="cc-btn-primary px-6 py-3 rounded-sm text-body-sm font-medium text-center"
 >
 Install Coinbase Wallet →
 </a>
 )}
 {selectedWallet.id === 'rainbow' && (
 <a
 href="https://rainbow.me/"
 target="_blank"
 rel="noopener noreferrer"
 className="cc-btn-primary px-6 py-3 rounded-sm text-body-sm font-medium text-center"
 >
 Install Rainbow →
 </a>
 )}
 {selectedWallet.id === 'phantom' && (
 <a
 href="https://phantom.app/"
 target="_blank"
 rel="noopener noreferrer"
 className="cc-btn-primary px-6 py-3 rounded-sm text-body-sm font-medium text-center"
 >
 Install Phantom →
 </a>
 )}
 {selectedWallet.id === 'trust' && (
 <a
 href="https://trustwallet.com/"
 target="_blank"
 rel="noopener noreferrer"
 className="cc-btn-primary px-6 py-3 rounded-sm text-body-sm font-medium text-center"
 >
 Install Trust Wallet →
 </a>
 )}
 <button
 onClick={handleBack}
 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleBack(); } }}
 className="px-6 py-3 rounded-sm text-body-sm font-medium text-[var(--cc-muted)] hover:text-[var(--cc-ink)] transition-colors focus-ring"
 >
 ← Back to wallets
 </button>
 </div>
 </div>
 )}
 </div>

 {/* Footer */}
 {modalState === 'open' && (
 <div className="px-6 py-3 border-t border-[var(--cc-hairline)] flex items-center justify-between text-caption text-[var(--cc-muted)]">
 <span>New to wallets?</span>
 <a
 href="https://ethereum.org/en/wallets/"
 target="_blank"
 rel="noopener noreferrer"
 className="text-[var(--cc-link)] hover:text-[var(--cc-link)] hover:underline"
 >
 Learn more →
 </a>
 </div>
 )}
 </div>
 </div>
 </div>
 )
}

export default WalletModal
