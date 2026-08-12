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
  /* The dev badge sits bottom-LEFT by default, which is exactly where the
     sidebar's own footer is: it covered the business identity and the chat
     box, and any menu opening upward from them (Ali, 12 Aug: "I cant see
     the menus properly"). Dev-only chrome, so this affects nothing that
     ships. */
  devIndicators: { position: "bottom-right" },
};

export default nextConfig;
