import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function ProgressRing({ value, size = 80, strokeWidth = 6, color = "#3b82f6", label }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;
    return (_jsxs("div", { className: "flex flex-col items-center gap-1", children: [_jsxs("div", { className: "relative", children: [_jsxs("svg", { width: size, height: size, className: "transform -rotate-90", children: [_jsx("circle", { cx: size / 2, cy: size / 2, r: radius, fill: "none", stroke: "#2a2d3e", strokeWidth: strokeWidth }), _jsx("circle", { cx: size / 2, cy: size / 2, r: radius, fill: "none", stroke: color, strokeWidth: strokeWidth, strokeDasharray: circumference, strokeDashoffset: offset, strokeLinecap: "round", className: "transition-all duration-500" })] }), _jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: _jsxs("span", { className: "text-lg font-bold text-white", children: [value, "%"] }) })] }), label && _jsx("span", { className: "text-xs text-dashboard-muted mt-1", children: label })] }));
}
//# sourceMappingURL=ProgressRing.js.map