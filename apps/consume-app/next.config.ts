import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @grade/ui is a workspace package — Next needs to transpile its source.
  transpilePackages: ["@grade/ui"],
};

export default nextConfig;
