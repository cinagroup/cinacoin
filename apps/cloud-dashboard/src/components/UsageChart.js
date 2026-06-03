import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function UsageChart({ data }) {
    const maxRequests = Math.max(...data.map((d) => d.requests), 1);
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "flex items-end gap-2", children: data.map((point) => {
                    const height = maxRequests > 0 ? (point.requests / maxRequests) * 100 : 0;
                    return (_jsxs("div", { className: "flex flex-1 flex-col items-center gap-1", children: [_jsx("div", { className: "relative flex w-full flex-col items-center justify-end", style: { height: "160px" }, children: _jsx("div", { className: "w-full rounded-t-sm bg-primary-600 transition-all hover:bg-primary-500", style: { height: `${height}%` }, title: `${point.requests} requests, ${point.errors} errors` }) }), _jsx("span", { className: "text-xs text-slate-500", children: point.date.slice(5) })] }, point.date));
                }) }), _jsx("div", { className: "flex items-center gap-4 text-xs text-slate-400", children: _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("div", { className: "h-3 w-3 rounded-sm bg-primary-600" }), _jsx("span", { children: "Requests" })] }) })] }));
}
//# sourceMappingURL=UsageChart.js.map