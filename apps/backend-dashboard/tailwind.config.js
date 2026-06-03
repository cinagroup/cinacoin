import { cinacoinPreset } from "../../packages/config/tailwind-preset";
const config = {
    presets: [cinacoinPreset],
    content: [
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                dashboard: {
                    bg: "#0a0c10",
                    surface: "#12141c",
                    surfaceHover: "#1a1d28",
                    border: "#1e2130",
                    borderLight: "#2a2d3e",
                    muted: "#6b7280",
                    mutedLight: "#9ca3af",
                },
            },
        },
    },
    plugins: [],
};
export default config;
//# sourceMappingURL=tailwind.config.js.map