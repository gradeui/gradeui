import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* The logged-in area moved under /wallets (Ali, 11 Aug). Anything
     already shared pointing at the old paths keeps working. */
  async redirects() {
    return [
      { source: "/dashboard", destination: "/wallets", permanent: false },
      { source: "/gold", destination: "/wallets/gold", permanent: false },
      /* THE STEP RENUMBER (Ali, 12 Aug: "rename the steps so they are the
         same as the actual number shown - we dont show step 0 / 8").
         Artefacts counted 0-7 while the wizard showed 1-8, so every name,
         slug and goto target was one out from the screen it described.

         ONLY THE SLUGS THAT NO LONGER EXIST GET A REDIRECT. I first wrote
         one per old URL and that was wrong in a way worth recording: the
         numbering SHIFTED, so /onboarding/step1 is both an old URL (it was
         Business type) and a NEW one (it is Before you apply). A redirect
         is matched on the request path, whatever that path now means, so
         those rules would have bounced every new step 1-7 forward by one
         and made them unreachable. step0, step3a and step3b are the only
         paths that are now genuinely dead, so they are the only ones that
         can be forwarded. An old link to steps 1-7 lands on the screen
         that now holds that number, which is the honest outcome for a
         renumber: there is no way to serve both meanings from one path. */
      { source: "/onboarding/step0", destination: "/onboarding/step1", permanent: false },
      { source: "/onboarding/step3a", destination: "/onboarding/step4a", permanent: false },
      { source: "/onboarding/step3b", destination: "/onboarding/step4b", permanent: false },
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
