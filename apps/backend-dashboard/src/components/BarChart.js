import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function BarChart({ data, labels, color = "#3b82f6", height = 120, ariaLabelledBy }) {
    if (!data.length)
        return null;
    const max = Math.max(...data, 1);
    return (_jsxs("div", { className: "bg-dashboard-surface rounded-xl border border-dashboard-border p-4", role: "img", "aria-label": "Bar chart", "aria-labelledby": ariaLabelledBy, children: [_jsx("div", { className: "flex items-end gap-1", style: { height: `${height}px` }, children: data.map((value, i) => {
                    const pct = (value / max) * 100;
                    return (_jsx("div", { className: "flex-1 rounded-t transition-all hover:opacity-80 group relative", style: {
                            height: `${pct}%`,
                            backgroundColor: color,
                            minWidth: "4px",
                        }, role: "img", "aria-label": `${labels[i]}: ${value.toLocaleString()}`, title: `${labels[i]}: ${value.toLocaleString()}`, children: _jsx("div", { className: "absolute -top-8 left-1/2 -translate-x-1/2 bg-dashboard-bg text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10", children: value.toLocaleString() }) }, i));
                }) }), _jsx("div", { className: "flex gap-1 mt-2", children: labels.map((label, i) => (_jsx("div", { className: "flex-1 text-center text-[10px] text-dashboard-muted truncate", children: label }, i))) })] }));
}
//# sourceMappingURL=BarChart.js.map