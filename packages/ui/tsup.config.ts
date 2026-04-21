import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "lib/index.ts",
    "tailwind-preset": "tailwind-preset.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom", "tailwindcss", "@rive-app/react-canvas"],
  treeshake: true,
  minify: true,
});
