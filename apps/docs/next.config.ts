import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // @gradeui/studio ships as TypeScript source (zero build step, so iterating
  // on the playbook doesn't require a rebuild). Next needs to know to run it
  // through its own compiler rather than expecting pre-built JS.
  transpilePackages: ["@gradeui/studio"],
};

export default withNextIntl(nextConfig);
