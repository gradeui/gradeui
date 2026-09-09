import type { NextConfig } from "next";
import { withVercelToolbar } from "@vercel/toolbar/plugins/next";

const nextConfig: NextConfig = {
  // The flat routes of the first day (/reviews/...) moved under
  // /locations/<location>/... (8 Sep). Anything already shared lands in
  // the default location.
  async redirects() {
    return [
      { source: "/location", destination: "/locations/minus-one-studios", permanent: false },
      { source: "/reviews", destination: "/locations/minus-one-studios/reviews", permanent: false },
      { source: "/reviews/:path*", destination: "/locations/minus-one-studios/reviews/:path*", permanent: false },
    ];
  },
  // The proposal module is plain JSX (ds/*.jsx), aliased through
  // tsconfig paths. Next honours those for both bundlers.
  // Off entirely: the badge lands in the corner of every recorded frame
  // (Ali, 12 Sep: "I dont want to see the nextjs logos").
  devIndicators: false,
  // The notes API reads notes/*.md at request time; make sure the
  // serverless bundle carries them.
  outputFileTracingIncludes: { "/api/notes": ["./notes/**/*"], "/docs/beacon-notes": ["./notes/**/*"] },
};

// The Vercel toolbar is what carries comments on the production URL.
// The plugin only injects when VERCEL_TOOLBAR is set at build, so local
// dev and any non-Vercel build stay clean.
export default withVercelToolbar()(nextConfig);
