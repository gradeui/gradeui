import type { Config } from "tailwindcss";
import gradePreset from "@gradeui/ui/tailwind-preset";

const config: Config = {
  presets: [gradePreset],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    // Include @gradeui/ui's compiled output so Tailwind generates classes used
    // inside the library.
    "../../packages/ui/components/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/lib/**/*.{js,ts}",
  ],
};

export default config;
