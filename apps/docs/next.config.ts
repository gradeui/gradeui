import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // @gradeui/studio + @gradeui/walker ship as TypeScript source (zero build
  // step, so iterating on the playbook / walker doesn't require a rebuild).
  // Next needs to know to run them through its own compiler rather than
  // expecting pre-built JS.
  transpilePackages: ["@gradeui/studio", "@gradeui/walker"],
  // Dev-only Next badge / build-activity indicator. Bottom-left (the
  // default) sits right on top of Studio's chat composer + canvas
  // toolbar, and it photobombs screen recordings. Bottom-right is the
  // least contested corner of the Studio layout.
  devIndicators: {
    position: "bottom-right",
  },
};

export default withNextIntl(nextConfig);
