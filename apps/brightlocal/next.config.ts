import type { NextConfig } from "next";
import { withVercelToolbar } from "@vercel/toolbar/plugins/next";

const nextConfig: NextConfig = {
  // The proposal module is plain JSX (ds/*.jsx), aliased through
  // tsconfig paths. Next honours those for both bundlers.
  devIndicators: { position: "bottom-right" },
  // The notes API reads notes/*.md at request time; make sure the
  // serverless bundle carries them.
  outputFileTracingIncludes: { "/api/notes": ["./notes/**/*"] },
};

// The Vercel toolbar is what carries comments on the production URL.
// The plugin only injects when VERCEL_TOOLBAR is set at build, so local
// dev and any non-Vercel build stay clean.
export default withVercelToolbar()(nextConfig);
