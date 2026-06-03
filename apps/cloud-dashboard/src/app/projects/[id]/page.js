"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import { ApiKeyManager } from "@/components/ApiKeyManager";
import { UsageChart } from "@/components/UsageChart";
const demoProjects = {
    "demo-1": {
        name: "Demo Wallet App",
        description: "A demo wallet application using Cinacoin SDK",
    },
    "demo-2": {
        name: "NFT Marketplace",
        description: "Multi-chain NFT marketplace integration",
    },
};
export default function ProjectDetailPage() {
    const params = useParams();
    const projectId = params.id;
    const project = demoProjects[projectId];
    const [activeTab, setActiveTab] = useState("overview");
    const [usageData, setUsageData] = useState([]);
    useEffect(() => {
        // Generate mock usage data
        const now = Date.now();
        const data = Array.from({ length: 14 }, (_, i) => {
            const requests = Math.floor(Math.random() * 5000);
            return {
                date: new Date(now - (13 - i) * 86400000).toISOString().slice(0, 10),
                requests,
                errors: Math.floor(Math.random() * 50),
            };
        });
        setUsageData(data);
    }, [projectId]);
    if (!project) {
        return (_jsxs("div", { className: "min-h-screen bg-dark-950", children: [_jsx(Header, {}), _jsx("main", { className: "mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8", children: _jsx("p", { className: "text-slate-400", children: "Project not found." }) })] }));
    }
    const totalRequests = usageData.reduce((sum, d) => sum + d.requests, 0);
    const totalErrors = usageData.reduce((sum, d) => sum + d.errors, 0);
    return (_jsxs("div", { className: "min-h-screen bg-dark-950", children: [_jsx(Header, {}), _jsxs("main", { className: "mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "mb-6", children: [_jsx("a", { href: "/projects", className: "text-sm text-slate-400 hover:text-white", children: "\u2190 Back to Projects" }), _jsx("h1", { className: "mt-2 text-2xl font-bold text-white", children: project.name }), _jsx("p", { className: "mt-1 text-sm text-slate-400", children: project.description })] }), _jsx("div", { className: "mb-6 border-b border-dark-800", children: _jsx("nav", { className: "-mb-px flex gap-6", children: ["overview", "keys", "settings"].map((tab) => (_jsx("button", { onClick: () => setActiveTab(tab), className: `border-b-2 px-1 py-4 text-sm font-medium capitalize ${activeTab === tab
                                    ? "border-primary-500 text-primary-400"
                                    : "border-transparent text-slate-400 hover:border-slate-600 hover:text-slate-300"}`, children: tab }, tab))) }) }), activeTab === "overview" && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-3", children: [_jsxs("div", { className: "rounded-lg border border-dark-800 bg-dark-900 p-6", children: [_jsx("p", { className: "text-sm text-slate-400", children: "Total Requests" }), _jsx("p", { className: "mt-1 text-3xl font-bold text-white", children: totalRequests.toLocaleString() })] }), _jsxs("div", { className: "rounded-lg border border-dark-800 bg-dark-900 p-6", children: [_jsx("p", { className: "text-sm text-slate-400", children: "Errors" }), _jsx("p", { className: "mt-1 text-3xl font-bold text-red-400", children: totalErrors.toLocaleString() })] }), _jsxs("div", { className: "rounded-lg border border-dark-800 bg-dark-900 p-6", children: [_jsx("p", { className: "text-sm text-slate-400", children: "Avg Latency" }), _jsx("p", { className: "mt-1 text-3xl font-bold text-emerald-400", children: "45ms" })] })] }), usageData.length > 0 && _jsx(UsageChart, { data: usageData })] })), activeTab === "keys" && (_jsx("div", { className: "rounded-xl border border-dark-800 bg-dark-900 p-6", children: _jsx(ApiKeyManager, { projectId: projectId }) })), activeTab === "settings" && (_jsxs("div", { className: "rounded-xl border border-dark-800 bg-dark-900 p-6", children: [_jsx("h3", { className: "mb-4 text-lg font-medium text-white", children: "Project Settings" }), _jsx("p", { className: "text-sm text-slate-400", children: "Settings management coming soon." })] }))] })] }));
}
//# sourceMappingURL=page.js.map