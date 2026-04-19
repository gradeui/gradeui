import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @gradeui/ui is a workspace package — Next needs to transpile its source.
  transpilePackages: ["@gradeui/ui"],
};

export default nextConfig;
