"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Header from "@/components/Header";
import { ProjectCard } from "@/components/ProjectCard";
const demoProjects = [
    {
        id: "demo-1",
        name: "Demo Wallet App",
        description: "A demo wallet application using Cinacoin SDK",
        owner_address: "0xDemo",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: "demo-2",
        name: "NFT Marketplace",
        description: "Multi-chain NFT marketplace integration",
        owner_address: "0xDemo",
        status: "active",
        chain_ids: ["eth", "sol", "btc"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];
export default function ProjectsPage() {
    return (_jsxs("div", { className: "min-h-screen bg-dark-950", children: [_jsx(Header, {}), _jsxs("main", { className: "mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "mb-6 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-white", children: "Projects" }), _jsx("p", { className: "mt-1 text-sm text-slate-400", children: "Manage your Cinacoin projects" })] }), _jsx("a", { href: "/projects/new", className: "rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500", children: "+ New Project" })] }), _jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: demoProjects.map((project) => (_jsx(ProjectCard, { project: project }, project.id))) }), demoProjects.length === 0 && (_jsxs("div", { className: "rounded-lg border border-dashed border-dark-800 p-12 text-center", children: [_jsx("p", { className: "text-sm text-slate-400", children: "No projects yet." }), _jsx("a", { href: "/projects/new", className: "mt-4 inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500", children: "Create Your First Project" })] }))] })] }));
}
//# sourceMappingURL=page.js.map