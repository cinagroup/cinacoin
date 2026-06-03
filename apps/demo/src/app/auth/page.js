'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from 'react';
import { useWallet, shortenAddress } from '@/lib/useWallet';
import DemoLayout from '@/components/DemoLayout';
import { useToast } from '@/lib/toast';
import { parseMessage } from '@cinacoin/siwe';
import { createSiweMessage, signSiweMessage, verifySiweSignature, } from '@/lib/siwe';
import { registerPasskey, authenticatePasskey, isWebAuthnSupported, hasPlatformAuthenticator, getStoredCredentials, removePasskey, } from '@/lib/passkey';
import { getAuthSession, formatSessionRemaining, signOut, } from '@/lib/authSession';
export default function AuthPage() {
    const { account, status, error: walletError, connectors, connect, disconnect } = useWallet();
    const { success, error: toastError, info } = useToast();
    // ── SIWE state ──
    const [authStep, setAuthStep] = useState('idle');
    const [siweMessage, setSiweMessage] = useState('');
    const [signature, setSignature] = useState('');
    const [error, setError] = useState(null);
    const [verificationResult, setVerificationResult] = useState(null);
    const [isSigningLoading, setIsSigningLoading] = useState(false);
    const [isVerifyingLoading, setIsVerifyingLoading] = useState(false);
    // ── Passkey state ──
    const [passkeyStep, setPasskeyStep] = useState('idle');
    const [passkeyUsername, setPasskeyUsername] = useState('');
    const [passkeyError, setPasskeyError] = useState(null);
    const [passkeyResult, setPasskeyResult] = useState(null);
    const [webAuthnSupported, setWebAuthnSupported] = useState(false);
    const [platformAuthAvailable, setPlatformAuthAvailable] = useState(false);
    // ── Session state ──
    const [session, setSession] = useState(null);
    const [showSessionInfo, setShowSessionInfo] = useState(false);
    const isConnected = status === 'connected';
    // ── Restore session on mount ──
    useEffect(() => {
        setWebAuthnSupported(isWebAuthnSupported());
        hasPlatformAuthenticator().then((available) => {
            setPlatformAuthAvailable(available);
        });
        const existing = getAuthSession();
        if (existing.authenticated) {
            setSession(existing);
            if (existing.passkey.authenticated) {
                setPasskeyStep('success');
                setPasskeyResult({
                    credentialId: existing.passkey.credentialId || '',
                    username: existing.passkey.username || '',
                });
            }
            if (existing.siwe.verified) {
                setAuthStep('verified');
                setSiweMessage(existing.siwe.message || '');
                setSignature(existing.siwe.signature || '');
                setVerificationResult({ valid: true, recoveredAddress: existing.address || '' });
            }
        }
    }, []);
    // ── SIWE handlers ──
    const handleConnect = useCallback(async () => {
        setError(null);
        setAuthStep('idle');
        setSiweMessage('');
        setSignature('');
        setVerificationResult(null);
        setShowSessionInfo(false);
        try {
            await connect('io.metamask');
            setAuthStep('connected');
            success('Wallet Connected', 'Ready to sign SIWE message');
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : 'Connection failed';
            setError(msg);
            setAuthStep('error');
            toastError('Connection Failed', msg);
        }
    }, [connect, success, toastError]);
    const handleSign = useCallback(async () => {
        if (!account.address || !account.chainId) {
            setError('Wallet not connected');
            setAuthStep('error');
            return;
        }
        setError(null);
        setIsSigningLoading(true);
        setAuthStep('signing');
        setSignature('');
        setVerificationResult(null);
        try {
            const { message, data } = createSiweMessage(account.address, account.chainId);
            setSiweMessage(message);
            const sig = await signSiweMessage(message, account.address);
            setSignature(sig);
            setAuthStep('signed');
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : 'Signing failed';
            if (msg.includes('User denied') || msg.includes('rejected') || msg.includes('User rejected')) {
                setError('Signing rejected by user');
                toastError('Signing Rejected', 'User denied the signature request');
            }
            else {
                setError(msg);
                toastError('Signing Failed', msg);
            }
            setAuthStep('error');
        }
        finally {
            setIsSigningLoading(false);
        }
    }, [account.address, account.chainId, toastError]);
    const handleVerify = useCallback(async () => {
        if (!siweMessage || !signature || !account.address) {
            setError('Missing message or signature');
            setAuthStep('error');
            return;
        }
        setError(null);
        setIsVerifyingLoading(true);
        setAuthStep('verifying');
        try {
            const result = await verifySiweSignature(account.address, siweMessage, signature);
            setVerificationResult({ valid: result.valid, recoveredAddress: result.recoveredAddress });
            if (result.valid) {
                setAuthStep('verified');
                // Restore session display
                const updated = getAuthSession();
                setSession(updated);
                success('Authentication Successful', 'Wallet ownership verified via SIWE');
            }
            else {
                setError(`Signature verification failed — ${result.error || 'address mismatch'}`);
                setAuthStep('error');
                toastError('Verification Failed', result.error || 'Signature does not match expected address');
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Verification failed');
            setAuthStep('error');
        }
        finally {
            setIsVerifyingLoading(false);
        }
    }, [siweMessage, signature, account.address, success, toastError]);
    // ── Passkey handlers ──
    const handleRegisterPasskey = useCallback(async () => {
        if (!passkeyUsername.trim()) {
            setPasskeyError('Please enter a username');
            return;
        }
        setPasskeyError(null);
        setPasskeyStep('registering');
        try {
            const result = await registerPasskey(passkeyUsername.trim());
            if (result.success && result.credential) {
                setPasskeyStep('success');
                setPasskeyResult({
                    credentialId: result.credential.id,
                    username: result.credential.username,
                });
                const updated = getAuthSession();
                setSession(updated);
                success('Passkey Registered', `Welcome, ${result.credential.username}!`);
            }
            else {
                setPasskeyError(result.error || 'Registration failed');
                setPasskeyStep('error');
                toastError('Registration Failed', result.error || 'Unknown error');
            }
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : 'Registration failed';
            setPasskeyError(msg);
            setPasskeyStep('error');
            toastError('Registration Failed', msg);
        }
    }, [passkeyUsername, success, toastError]);
    const handleLoginPasskey = useCallback(async () => {
        setPasskeyError(null);
        setPasskeyStep('authenticating');
        try {
            const result = await authenticatePasskey();
            if (result.success) {
                setPasskeyStep('success');
                setPasskeyResult({
                    credentialId: result.credentialId || '',
                    username: result.username || '',
                });
                const updated = getAuthSession();
                setSession(updated);
                success('Passkey Authenticated', `Welcome back, ${result.username}!`);
            }
            else {
                setPasskeyError(result.error || 'Authentication failed');
                setPasskeyStep('error');
                toastError('Authentication Failed', result.error || 'Unknown error');
            }
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : 'Authentication failed';
            setPasskeyError(msg);
            setPasskeyStep('error');
            toastError('Authentication Failed', msg);
        }
    }, [success, toastError]);
    // ── Shared handlers ──
    const handleReset = useCallback(() => {
        setAuthStep('idle');
        setSiweMessage('');
        setSignature('');
        setError(null);
        setVerificationResult(null);
        setShowSessionInfo(false);
        setPasskeyStep('idle');
        setPasskeyError(null);
        setPasskeyResult(null);
        setPasskeyUsername('');
    }, []);
    const handleDisconnect = useCallback(async () => {
        await disconnect();
        handleReset();
    }, [disconnect, handleReset]);
    const handleSignOut = useCallback(() => {
        signOut();
        handleReset();
        success('Signed Out', 'Session cleared');
    }, [handleReset, success]);
    /* ── step progress helpers ── */
    const stepLabels = ['Connect', 'Sign', 'Verify', 'Done'];
    const stepMap = {
        idle: 0, connected: 0, signing: 1, signed: 1, verifying: 2, verified: 3, error: -1,
    };
    const currentStep = stepMap[authStep];
    const storedCredentials = getStoredCredentials();
    const hasExistingPasskeys = storedCredentials.length > 0;
    return (_jsx(DemoLayout, { children: _jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("section", { className: "py-16 sm:py-20 text-center", children: [_jsxs("div", { className: "inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6", children: [_jsx("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" }) }), "Real SIWE \u2014 EIP-4361 + Passkeys"] }), _jsx("h1", { className: "text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight", children: _jsx("span", { className: "bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 bg-clip-text text-transparent", children: "Sign-In With Ethereum" }) }), _jsxs("p", { className: "mt-5 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed", children: ["Authenticate with your wallet or biometrics. No passwords, no accounts.", _jsx("br", {}), _jsx("span", { className: "text-gray-500", children: "Powered by @cinacoin/siwe + WebAuthn Passkeys." })] })] }), session?.authenticated && (_jsxs("div", { className: "mb-8 p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center", children: _jsx("svg", { className: "w-5 h-5 text-green-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" }) }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-green-400", children: session.address
                                                ? `Authenticated: ${shortenAddress(session.address)}`
                                                : `Authenticated: ${session.passkey.username}` }), _jsxs("p", { className: "text-xs text-gray-400", children: [session.siwe.verified ? 'SIWE verified' : 'Passkey authenticated', ' · ', formatSessionRemaining()] })] })] }), _jsx("button", { onClick: handleSignOut, className: "px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 text-xs font-medium transition-colors", children: "Sign Out" })] })), (error || passkeyError) && (_jsxs("div", { className: "mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3", children: [_jsx("svg", { className: "w-5 h-5 text-red-400 flex-shrink-0 mt-0.5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-red-400 font-medium", children: error || passkeyError }), walletError && _jsxs("p", { className: "text-xs text-red-400/70 mt-1", children: ["Wallet error: ", walletError] })] })] })), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16", children: [_jsxs("div", { className: "rounded-2xl bg-gray-900/80 border border-gray-800 p-6", children: [_jsxs("h2", { className: "text-lg font-bold mb-4 flex items-center gap-2", children: [_jsx("span", { className: "text-blue-400", children: "\uD83D\uDD17" }), " Wallet Auth (SIWE)"] }), _jsx("section", { className: "mb-6", children: _jsx("div", { className: "flex items-center justify-center gap-0", children: stepLabels.map((label, i) => {
                                            const isDone = authStep === 'verified' ? i < 3 : authStep === 'connected' && i === 0;
                                            const isCurrent = currentStep === i && authStep !== 'error';
                                            return (_jsxs("div", { className: "flex items-center", children: [_jsxs("div", { className: `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${isDone || (authStep === 'verified' && i === 3)
                                                            ? 'bg-green-500/15 text-green-400 border border-green-500/25'
                                                            : isCurrent
                                                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 ring-2 ring-blue-500/20'
                                                                : 'bg-gray-800/40 text-gray-500 border border-gray-800'}`, children: [isDone || (authStep === 'verified' && i === 3) ? (_jsx("svg", { className: "w-3 h-3", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" }) })) : (_jsx("span", { className: "w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold", style: { borderColor: isCurrent ? 'rgb(96 165 250)' : 'rgb(107 114 128)', color: isCurrent ? 'rgb(96 165 250)' : 'rgb(107 114 128)' }, children: i + 1 })), label] }), i < 3 && (_jsx("div", { className: `w-4 h-0.5 mx-1 ${isDone || (authStep === 'verified' && i === 3)
                                                            ? 'bg-green-500/40'
                                                            : 'bg-gray-800'}` }))] }, label));
                                        }) }) }), _jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isConnected
                                                        ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                                                        : 'bg-gray-700/50 text-gray-500 border border-gray-600/40'}`, children: [_jsx("span", { className: `size-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}` }), isConnected ? 'Connected' : 'Disconnected'] }), isConnected && account.address && (_jsx("span", { className: "text-xs font-mono text-gray-400", children: shortenAddress(account.address) }))] }), isConnected && (_jsx("button", { onClick: handleDisconnect, className: "text-xs text-gray-500 hover:text-white px-2 py-1 rounded border border-gray-700 hover:border-gray-500 transition-colors", children: "Disconnect" }))] }), isConnected && account.chainName && (_jsxs("div", { className: "mb-4 text-xs text-gray-500", children: [_jsx("span", { className: "text-gray-400 font-medium", children: account.chainName }), _jsx("span", { className: "mx-1", children: "\u00B7" }), _jsxs("span", { children: ["ID: ", account.chainId] })] })), authStep === 'idle' && !isConnected && (_jsx("div", { className: "space-y-3", children: _jsx("button", { onClick: handleConnect, className: "w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg shadow-blue-500/20 text-sm", children: "\uD83D\uDD17 Connect Wallet & Sign" }) })), authStep === 'connected' && isConnected && account.address && !siweMessage && (_jsx("button", { onClick: handleSign, disabled: isSigningLoading, className: "w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all disabled:opacity-50 text-sm", children: isSigningLoading ? 'Waiting for wallet...' : '✍️ Sign SIWE Message' })), authStep === 'signing' && (_jsxs("div", { className: "space-y-3", children: [_jsx("p", { className: "text-sm text-gray-400", children: "Please approve the signature in your wallet." }), _jsx("div", { className: "flex items-center justify-center py-4", children: _jsxs("svg", { className: "animate-spin w-6 h-6 text-blue-400", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })] }) })] })), authStep === 'signed' && siweMessage && signature && (_jsxs("div", { className: "space-y-3", children: [_jsx("p", { className: "text-sm text-green-400 font-semibold", children: "\u2713 Message Signed" }), _jsxs("div", { className: "rounded-lg bg-gray-950 border border-gray-800 p-3", children: [_jsx("p", { className: "text-[10px] text-gray-500 mb-1", children: "SIWE Message:" }), _jsx("pre", { className: "font-mono text-[10px] text-gray-300 overflow-x-auto whitespace-pre leading-relaxed select-all max-h-40 overflow-y-auto", children: siweMessage })] }), _jsx("button", { onClick: handleVerify, className: "w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all text-sm", children: "\uD83D\uDD10 Verify Signature" })] })), authStep === 'verifying' && (_jsxs("div", { className: "space-y-3", children: [_jsx("p", { className: "text-sm text-gray-400", children: "Checking signature validity..." }), _jsx("div", { className: "flex items-center justify-center py-4", children: _jsxs("svg", { className: "animate-spin w-6 h-6 text-purple-400", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })] }) })] })), authStep === 'verified' && siweMessage && (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "p-3 rounded-lg bg-green-500/10 border border-green-500/20", children: [_jsx("p", { className: "text-sm font-semibold text-green-400", children: "\u2713 Authentication Successful" }), _jsx("p", { className: "text-xs text-gray-400 mt-1", children: "Wallet ownership verified via SIWE" })] }), (() => {
                                            try {
                                                const parsed = parseMessage(siweMessage);
                                                return (_jsxs("div", { className: "rounded-lg bg-gray-950 border border-gray-800 p-3 space-y-1 text-[10px] font-mono text-gray-400", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Domain:" }), _jsx("span", { className: "text-gray-300", children: parsed.domain })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Nonce:" }), _jsx("span", { className: "text-gray-300", children: parsed.nonce })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Chain ID:" }), _jsx("span", { className: "text-gray-300", children: parsed.chainId })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Issued At:" }), _jsx("span", { className: "text-gray-300", children: parsed.issuedAt })] })] }));
                                            }
                                            catch {
                                                return null;
                                            }
                                        })(), _jsx("button", { onClick: handleReset, className: "w-full py-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 text-xs font-medium transition-all border border-gray-700", children: "Start Over" })] })), isConnected && account.address && !siweMessage && authStep !== 'connected' && authStep !== 'signing' && authStep !== 'signed' && authStep !== 'verifying' && authStep !== 'verified' && authStep !== 'error' && (_jsx("button", { onClick: handleSign, className: "w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all text-sm", children: "\u270D\uFE0F Sign SIWE Message" })), authStep === 'error' && error && (_jsx("button", { onClick: handleReset, className: "w-full py-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 text-xs font-medium transition-all border border-gray-700", children: "Try Again" })), _jsx("button", { onClick: () => setShowSessionInfo(!showSessionInfo), className: "mt-4 w-full text-xs text-gray-500 hover:text-gray-300 transition-colors", children: showSessionInfo ? '▾ Hide SIWE Details' : '▸ Show SIWE Details' }), showSessionInfo && siweMessage && (_jsx("div", { className: "mt-3 rounded-lg bg-gray-950 border border-gray-800 p-3", children: _jsx("pre", { className: "font-mono text-[10px] text-gray-300 overflow-x-auto whitespace-pre leading-relaxed select-all max-h-60 overflow-y-auto", children: siweMessage }) }))] }), _jsxs("div", { className: "rounded-2xl bg-gray-900/80 border border-gray-800 p-6", children: [_jsxs("h2", { className: "text-lg font-bold mb-4 flex items-center gap-2", children: [_jsx("span", { className: "text-purple-400", children: "\uD83D\uDD11" }), " Passkey Auth"] }), !webAuthnSupported && (_jsx("div", { className: "mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20", children: _jsx("p", { className: "text-xs text-yellow-400", children: "\u26A0 WebAuthn is not supported in this browser. Try Chrome, Safari, or Firefox with a security key." }) })), passkeyStep === 'idle' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-gray-300 mb-2", children: "Register New Passkey" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", placeholder: "Enter username...", value: passkeyUsername, onChange: (e) => setPasskeyUsername(e.target.value), className: "flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-colors", disabled: !webAuthnSupported }), _jsx("button", { onClick: handleRegisterPasskey, disabled: !webAuthnSupported || !passkeyUsername.trim(), className: "px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap", children: "Register" })] }), platformAuthAvailable && (_jsx("p", { className: "text-[10px] text-gray-500 mt-1", children: "\u2713 Platform authenticator available (Face ID / Touch ID / Windows Hello)" }))] }), hasExistingPasskeys && (_jsxs("div", { className: "pt-3 border-t border-gray-800", children: [_jsx("p", { className: "text-sm font-semibold text-gray-300 mb-2", children: "Login with Passkey" }), _jsxs("p", { className: "text-xs text-gray-500 mb-3", children: [storedCredentials.length, " passkey(s) registered on this device"] }), _jsx("button", { onClick: handleLoginPasskey, className: "w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all text-sm", children: "\uD83D\uDD11 Login with Passkey" }), _jsx("div", { className: "mt-2 space-y-1", children: storedCredentials.map((cred) => (_jsxs("div", { className: "flex items-center justify-between text-xs text-gray-400 px-2 py-1 rounded bg-gray-800/40", children: [_jsx("span", { className: "font-mono", children: cred.username }), _jsx("button", { onClick: () => {
                                                                    removePasskey(cred.id);
                                                                    setPasskeyError(`Removed passkey for "${cred.username}"`);
                                                                }, className: "text-red-400 hover:text-red-300 transition-colors", "aria-label": `Remove passkey for ${cred.username}`, children: "Remove" })] }, cred.id))) })] })), !hasExistingPasskeys && !webAuthnSupported && (_jsx("div", { className: "text-center py-4", children: _jsx("p", { className: "text-xs text-gray-500", children: "No passkeys registered and WebAuthn is not supported." }) }))] })), passkeyStep === 'registering' && (_jsxs("div", { className: "space-y-3", children: [_jsxs("p", { className: "text-sm text-gray-400", children: ["Creating passkey for \"", passkeyUsername, "\"..."] }), _jsx("div", { className: "flex items-center justify-center py-6", children: _jsxs("svg", { className: "animate-spin w-8 h-8 text-purple-400", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })] }) }), _jsx("p", { className: "text-xs text-gray-500 text-center", children: "Please approve in your device's security dialog" })] })), passkeyStep === 'authenticating' && (_jsxs("div", { className: "space-y-3", children: [_jsx("p", { className: "text-sm text-gray-400", children: "Authenticating with passkey..." }), _jsx("div", { className: "flex items-center justify-center py-6", children: _jsxs("svg", { className: "animate-spin w-8 h-8 text-purple-400", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })] }) }), _jsx("p", { className: "text-xs text-gray-500 text-center", children: "Please verify with your biometric/PIN" })] })), passkeyStep === 'success' && passkeyResult && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "p-3 rounded-lg bg-green-500/10 border border-green-500/20", children: [_jsx("p", { className: "text-sm font-semibold text-green-400", children: "\u2713 Authentication Successful" }), _jsx("p", { className: "text-xs text-gray-400 mt-1", children: "Authenticated via passkey" })] }), _jsx("div", { className: "rounded-lg bg-gray-950 border border-gray-800 p-4 space-y-3", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-sm font-bold shadow-lg", children: passkeyResult.username[0]?.toUpperCase() }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-green-400", children: passkeyResult.username }), _jsxs("p", { className: "text-[10px] text-gray-500 font-mono break-all", children: ["ID: ", passkeyResult.credentialId.slice(0, 24), "..."] })] })] }) }), _jsx("button", { onClick: handleReset, className: "w-full py-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 text-xs font-medium transition-all border border-gray-700", children: "Start Over" })] })), passkeyStep === 'error' && passkeyError && (_jsx("button", { onClick: () => {
                                        setPasskeyStep('idle');
                                        setPasskeyError(null);
                                    }, className: "w-full py-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 text-xs font-medium transition-all border border-gray-700", children: "Try Again" }))] })] }), session?.authenticated && (_jsxs("div", { className: "rounded-2xl bg-gray-900/80 border border-gray-800 p-6 sm:p-8 mb-16", children: [_jsxs("h3", { className: "text-xl font-bold mb-4 flex items-center gap-2", children: [_jsx("span", { className: "text-green-400", children: "\uD83D\uDEE1\uFE0F" }), " Session Information"] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [session.address && (_jsxs("div", { className: "p-4 rounded-xl bg-gray-950/60 border border-gray-800", children: [_jsx("p", { className: "text-xs text-gray-500 mb-1", children: "Wallet Address" }), _jsx("p", { className: "font-mono text-sm text-gray-300 break-all", children: session.address }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: _jsx("span", { className: "inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 text-[10px]", children: "SIWE" }) })] })), session.passkey.username && (_jsxs("div", { className: "p-4 rounded-xl bg-gray-950/60 border border-gray-800", children: [_jsx("p", { className: "text-xs text-gray-500 mb-1", children: "Passkey User" }), _jsx("p", { className: "text-sm text-gray-300 font-semibold", children: session.passkey.username }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: _jsx("span", { className: "inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 text-[10px]", children: "Passkey" }) })] })), session.createdAt && (_jsxs("div", { className: "p-4 rounded-xl bg-gray-950/60 border border-gray-800", children: [_jsx("p", { className: "text-xs text-gray-500 mb-1", children: "Session Started" }), _jsx("p", { className: "text-sm text-gray-300", children: new Date(session.createdAt).toLocaleString() })] })), session.expiresAt && (_jsxs("div", { className: "p-4 rounded-xl bg-gray-950/60 border border-gray-800", children: [_jsx("p", { className: "text-xs text-gray-500 mb-1", children: "Session Expires" }), _jsx("p", { className: "text-sm text-gray-300", children: new Date(session.expiresAt).toLocaleString() }), _jsx("p", { className: "text-xs text-green-400 mt-1", children: formatSessionRemaining() })] }))] }), _jsxs("div", { className: "mt-4 flex gap-3", children: [_jsx("button", { onClick: () => setShowSessionInfo(!showSessionInfo), className: "px-4 py-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 text-sm font-medium transition-all border border-gray-700", children: showSessionInfo ? 'Hide Details' : 'Show Raw Session' }), _jsx("button", { onClick: handleSignOut, className: "px-4 py-2 rounded-lg bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 text-sm font-medium transition-colors", children: "Sign Out" })] }), showSessionInfo && (_jsx("div", { className: "mt-4 rounded-lg bg-gray-950 border border-gray-800 p-4", children: _jsx("pre", { className: "font-mono text-[10px] text-gray-400 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto", children: JSON.stringify(session, null, 2) }) }))] })), _jsx("section", { className: "mb-16", children: _jsxs("div", { className: "rounded-2xl bg-gray-900/80 border border-gray-800 p-6 sm:p-8", children: [_jsxs("h3", { className: "text-xl font-bold mb-4 flex items-center gap-2", children: [_jsx("span", { className: "text-green-400", children: "\uD83D\uDCCB" }), " How It Works"] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("h4", { className: "text-base font-semibold text-blue-400 mb-3", children: "\uD83D\uDD17 SIWE (Sign-In With Ethereum)" }), _jsxs("div", { className: "space-y-3 text-sm text-gray-400", children: [_jsxs("p", { children: [_jsx("strong", { className: "text-gray-300", children: "1. Connect" }), " \u2014 Connect your wallet via ", _jsx("code", { className: "text-blue-400 bg-gray-800 px-1.5 py-0.5 rounded text-xs", children: "eth_requestAccounts" }), "."] }), _jsxs("p", { children: [_jsx("strong", { className: "text-gray-300", children: "2. Sign" }), " \u2014 Sign a SIWE message (EIP-4361) via ", _jsx("code", { className: "text-blue-400 bg-gray-800 px-1.5 py-0.5 rounded text-xs", children: "personal_sign" }), "."] }), _jsxs("p", { children: [_jsx("strong", { className: "text-gray-300", children: "3. Verify" }), " \u2014 Verify the signature matches the address in the message."] })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-base font-semibold text-purple-400 mb-3", children: "\uD83D\uDD11 Passkey (WebAuthn)" }), _jsxs("div", { className: "space-y-3 text-sm text-gray-400", children: [_jsxs("p", { children: [_jsx("strong", { className: "text-gray-300", children: "1. Register" }), " \u2014 Create a passkey via ", _jsx("code", { className: "text-purple-400 bg-gray-800 px-1.5 py-0.5 rounded text-xs", children: "navigator.credentials.create()" }), "."] }), _jsxs("p", { children: [_jsx("strong", { className: "text-gray-300", children: "2. Login" }), " \u2014 Authenticate via ", _jsx("code", { className: "text-purple-400 bg-gray-800 px-1.5 py-0.5 rounded text-xs", children: "navigator.credentials.get()" }), "."] }), _jsxs("p", { children: [_jsx("strong", { className: "text-gray-300", children: "3. Verify" }), " \u2014 Session persisted in localStorage with 24h expiry."] })] })] })] }), _jsx("div", { className: "mt-6 rounded-xl bg-gray-950 border border-gray-800 p-4 font-mono text-xs text-gray-300 overflow-x-auto", children: _jsx("pre", { children: `// SIWE — Sign-In With Ethereum
const { message } = createSiweMessage(address, chainId);
const signature = await signSiweMessage(message, address);
const result = await verifySiweSignature(address, message, signature);

// Passkey — WebAuthn
const result = await registerPasskey('username');
const auth = await authenticatePasskey();` }) })] }) }), _jsxs("section", { className: "py-12 border-t border-gray-800/50 mb-16", children: [_jsx("p", { className: "text-center text-sm text-gray-500 mb-8 uppercase tracking-wider font-medium", children: "Supported Chains" }), _jsx("div", { className: "flex flex-wrap justify-center gap-4 sm:gap-6", children: [
                                { name: 'Ethereum', symbol: 'Ξ', color: 'from-blue-400 to-indigo-500' },
                                { name: 'Polygon', symbol: '⬡', color: 'from-purple-400 to-violet-600' },
                                { name: 'Arbitrum', symbol: 'λ', color: 'from-sky-400 to-blue-600' },
                                { name: 'Base', symbol: '⊙', color: 'from-blue-500 to-cyan-400' },
                            ].map((chain) => (_jsxs("div", { className: "group flex flex-col items-center gap-2 px-5 py-4 rounded-2xl bg-gray-800/30 border border-gray-800 hover:border-gray-600 transition-all cursor-default", children: [_jsx("div", { className: `w-10 h-10 rounded-xl bg-gradient-to-br ${chain.color} flex items-center justify-center text-lg font-bold shadow-lg group-hover:scale-110 transition-transform`, children: chain.symbol }), _jsx("span", { className: "text-xs text-gray-400 group-hover:text-gray-200 transition-colors", children: chain.name })] }, chain.name))) })] })] }) }));
}
//# sourceMappingURL=page.js.map