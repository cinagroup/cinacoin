import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    clean: false,
    external: ["react", "react-dom"],
  },
  {
    entry: ["src/tailwind-preset.ts"],
    format: ["esm", "cjs"],
    dts: true,
    clean: false,
    outDir: "dist",
  },
]);
