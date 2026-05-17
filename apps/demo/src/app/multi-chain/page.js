import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import DemoLayout from '@/components/DemoLayout';
const CHAINS = [
    {
        id: 'evm',
        name: 'EVM Chains',
        icon: '⬡',
        color: 'from-blue-500 to-cyan-500',
        adapter: 'EvmAdapter',
        wallets: ['MetaMask', 'WalletConnect', 'Coinbase Wallet', 'Rabby'],
    },
    {
        id: 'solana',
        name: 'Solana',
        icon: '◎',
        color: 'from-purple-500 to-green-500',
        adapter: 'SolanaChainAdapter',
        wallets: ['Phantom', 'Solflare', 'Backpack'],
    },
    {
        id: 'bitcoin',
        name: 'Bitcoin',
        icon: '₿',
        color: 'from-orange-500 to-yellow-500',
        adapter: 'BitcoinChainAdapter',
        wallets: ['Xverse', 'Leather', 'Unisat'],
    },
];
export default function MultiChainPage() {
    return (_jsx(DemoLayout, { children: _jsxs("div", { className: "max-w-3xl mx-auto space-y-8", children: [_jsxs("div", { className: "text-center space-y-2", children: [_jsx("h1", { className: "text-3xl font-bold", children: "Multi-Chain Demo" }), _jsx("p", { className: "text-gray-400", children: "CinaConnect supports EVM, Solana, and Bitcoin \u2014 all through a unified API." })] }), _jsx("div", { className: "space-y-4", children: CHAINS.map((chain) => (_jsxs("div", { className: "bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-colors", children: [_jsx("div", { className: `h-1 bg-gradient-to-r ${chain.color}` }), _jsxs("div", { className: "p-6 space-y-4", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("span", { className: "text-4xl", children: chain.icon }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold", children: chain.name }), _jsx("code", { className: "text-sm text-blue-400", children: chain.adapter })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-gray-400 mb-2", children: "Supported Wallets" }), _jsx("div", { className: "flex flex-wrap gap-2", children: chain.wallets.map((wallet) => (_jsx("span", { className: "px-3 py-1.5 bg-gray-700/50 rounded-lg text-sm text-gray-300", children: wallet }, wallet))) })] }), _jsx("div", { className: "pt-2 border-t border-gray-700/50", children: _jsxs("div", { className: "grid grid-cols-2 gap-3 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "Balance" }), _jsx("p", { className: "font-semibold", children: "0.00" })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "Status" }), _jsx("p", { className: "font-semibold text-yellow-400", children: "Disconnected" })] })] }) }), _jsxs("button", { className: `w-full py-3 bg-gradient-to-r ${chain.color} rounded-xl font-semibold hover:opacity-90 transition-opacity`, children: ["Connect ", chain.name] })] })] }, chain.id))) }), _jsxs("div", { className: "bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700 p-6", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Cross-Chain Flow" }), _jsxs("div", { className: "flex items-center justify-center gap-4 text-sm", children: [_jsxs("div", { className: "bg-gray-700 rounded-lg px-4 py-3", children: [_jsx("span", { className: "text-gray-400", children: "From" }), _jsx("p", { className: "font-semibold", children: "Ethereum" })] }), _jsx("span", { className: "text-2xl text-gray-500", children: "\u2192" }), _jsxs("div", { className: "bg-gray-700 rounded-lg px-4 py-3", children: [_jsx("span", { className: "text-gray-400", children: "Bridge" }), _jsx("p", { className: "font-semibold", children: "CinaConnect Relay" })] }), _jsx("span", { className: "text-2xl text-gray-500", children: "\u2192" }), _jsxs("div", { className: "bg-gray-700 rounded-lg px-4 py-3", children: [_jsx("span", { className: "text-gray-400", children: "To" }), _jsx("p", { className: "font-semibold", children: "Solana" })] })] })] })] }) }));
}
//# sourceMappingURL=page.js.map