import type { Config } from "tailwindcss";
import { cinacoinPreset } from "../../packages/config/tailwind-preset";

const config: Config = {
  presets: [cinacoinPreset],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
