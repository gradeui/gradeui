import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @gradeui/ui is consumed as a workspace package; transpiling keeps
  // parity with consume-app and survives a future source-condition switch.
  transpilePackages: ["@gradeui/ui"],
};

export default nextConfig;
