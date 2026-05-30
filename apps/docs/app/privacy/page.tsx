/**
 * Privacy policy — placeholder.
 *
 * Real policy TBD. Same shape as /terms — DS primitives so the
 * theme + tokens come for free, swap the copy when the real policy
 * is ready.
 */

import Link from "next/link";
import { Stack } from "@/components/ui/stack";

export const metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16">
      <Stack gap="lg">
        <Stack gap="xs">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Privacy policy
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: pending.
          </p>
        </Stack>

        <Stack gap="md">
          <p className="text-sm text-muted-foreground">
            Grade is in early access. A full privacy policy will land here
            before general availability. Until then, the short version:
          </p>

          <Stack gap="sm">
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground">What we store.</span> When you
              sign in, we store your email address and the name your auth
              provider returns. When you save work in Studio, we store the
              project content you create. That’s it.
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground">What we don’t do.</span> We
              don’t sell your data. We don’t serve ads. We don’t train models
              on your work.
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground">Self-host.</span> If you’re
              running Grade against your own Supabase project, none of the
              above involves us — your data stays in your infrastructure.
            </p>
          </Stack>

          <p className="text-sm text-muted-foreground">
            Questions or data requests:{" "}
            <a
              href="mailto:ali@gradeui.com"
              className="underline underline-offset-4 hover:text-foreground"
            >
              ali@gradeui.com
            </a>
            .
          </p>
        </Stack>

        <Link
          href="/"
          className="text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground"
        >
          ← Back to Grade
        </Link>
      </Stack>
    </main>
  );
}
