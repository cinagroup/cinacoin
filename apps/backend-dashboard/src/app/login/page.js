"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { isWalletAvailable } from "@/lib/auth";
export default function LoginPage() {
    const { doLogin, isLoggedIn, isLoading, error } = useAuth();
    const router = useRouter();
    const [walletMissing, setWalletMissing] = useState(false);
    const [step, setStep] = useState("idle");
    // If already logged in, redirect to dashboard
    if (isLoggedIn) {
        router.push("/");
        return null;
    }
    const handleLogin = async () => {
        if (!isWalletAvailable()) {
            setWalletMissing(true);
            return;
        }
        setWalletMissing(false);
        setStep("connecting");
        try {
            await doLogin();
            // AuthProvider sets address on success; redirect handled by isLoggedIn check
        }
        catch {
            setStep("idle");
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-b from-[#0f1117] to-[#1a1d2e] flex items-center justify-center px-4", children: _jsxs("div", { className: "w-full max-w-md", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500/20 border border-brand-500/30 mb-4", children: _jsx("img", { src: "/logo.png", alt: "cinacoin", className: "w-10 h-10 rounded-xl" }) }), _jsx("h1", { className: "text-3xl font-bold text-white", children: "cinacoin" }), _jsx("p", { className: "text-gray-400 mt-2", children: "Backend Dashboard" })] }), _jsxs("div", { className: "bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl p-8 shadow-2xl", children: [_jsx("h2", { className: "text-xl font-semibold text-white mb-2", children: "Sign in with Wallet" }), _jsx("p", { className: "text-sm text-gray-400 mb-6", children: "Connect your Ethereum wallet to access the cinacoin Backend Dashboard. A signature will be requested \u2014 no gas fees required." }), error && (_jsx("div", { className: "mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm", children: error })), walletMissing && (_jsxs("div", { className: "mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm", children: ["\u26A0\uFE0F No Ethereum wallet detected. Please install", " ", _jsx("a", { href: "https://metamask.io", target: "_blank", rel: "noopener noreferrer", className: "underline hover:text-amber-300", children: "MetaMask" }), " ", "or another Web3 wallet."] })), step === "connecting" && !error && (_jsx("div", { className: "mb-4 p-3 rounded-lg bg-brand-500/10 border border-brand-500/30", children: _jsx("p", { className: "text-xs text-brand-300 font-medium", children: "\u23F3 Connecting wallet..." }) })), isLoading && step !== "connecting" && !error && (_jsxs("div", { className: "mb-4 p-3 rounded-lg bg-brand-500/10 border border-brand-500/30", children: [_jsx("p", { className: "text-xs text-brand-300 font-medium", children: "\u23F3 Check your wallet to sign the message..." }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Approve the signature request in your wallet popup." })] })), _jsx("button", { onClick: handleLogin, "aria-label": isLoading || step === "connecting" ? "Wallet connection in progress" : "Connect Ethereum wallet and sign in", disabled: isLoading, className: `
              w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200
              ${isLoading || step === "connecting"
                                ? "bg-brand-500/50 text-white/60 cursor-not-allowed"
                                : "bg-brand-500 hover:bg-brand-400 text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-400/30 active:scale-[0.98]"}
            `, children: isLoading || step === "connecting" ? (_jsxs("span", { className: "flex items-center justify-center gap-2", children: [_jsxs("svg", { className: "animate-spin h-4 w-4", viewBox: "0 0 24 24", fill: "none", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })] }), step === "connecting" ? "Connecting..." : "Signing..."] })) : ("🦊 Connect Wallet & Login") }), _jsxs("div", { className: "mt-6 space-y-2 text-xs text-gray-500", children: [_jsx("p", { children: "\uD83D\uDD12 You will be asked to sign a message to prove wallet ownership." }), _jsx("p", { children: "\u26FD No gas fees \u2014 this is an off-chain signature." }), _jsx("p", { children: "\u23F1\uFE0F Session expires after 24 hours." })] })] }), _jsx("div", { className: "text-center mt-6", children: _jsx(Link, { href: "/", className: "text-sm text-gray-500 hover:text-gray-300 transition-colors", children: "\u2190 Back to Dashboard" }) })] }) }));
}
//# sourceMappingURL=page.js.map