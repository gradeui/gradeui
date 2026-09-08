import type { NextConfig } from "next";
import { withVercelToolbar } from "@vercel/toolbar/plugins/next";

const nextConfig: NextConfig = {
  // The proposal module is plain JSX (ds/*.jsx), aliased through
  // tsconfig paths. Next honours those for both bundlers.
  devIndicators: { position: "bottom-right" },
};

// The Vercel toolbar is what carries comments on the production URL.
// The plugin only injects when VERCEL_TOOLBAR is set at build, so local
// dev and any non-Vercel build stay clean.
export default withVercelToolbar()(nextConfig);
