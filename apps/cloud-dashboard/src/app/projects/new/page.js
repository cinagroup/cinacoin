import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Header from "@/components/Header";
import { ProjectForm } from "@/components/ProjectForm";
export default function NewProjectPage() {
    return (_jsxs("div", { className: "min-h-screen bg-dark-950", children: [_jsx(Header, {}), _jsxs("main", { className: "mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h1", { className: "text-2xl font-bold text-white", children: "Create Project" }), _jsx("p", { className: "mt-1 text-sm text-slate-400", children: "Set up a new project to get started with Cinacoin." })] }), _jsx("div", { className: "rounded-xl border border-dark-800 bg-dark-900 p-6", children: _jsx(ProjectForm, {}) })] })] }));
}
//# sourceMappingURL=page.js.map