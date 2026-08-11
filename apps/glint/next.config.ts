import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* The logged-in area moved under /wallets (Ali, 11 Aug). Anything
     already shared pointing at the old paths keeps working. */
  async redirects() {
    return [
      { source: "/dashboard", destination: "/wallets", permanent: false },
      { source: "/gold", destination: "/wallets/gold", permanent: false },
    ];
  },
  // @gradeui/ui is consumed as a workspace package; transpiling keeps
  // parity with consume-app and survives a future source-condition switch.
  transpilePackages: ["@gradeui/ui"],
};

export default nextConfig;
