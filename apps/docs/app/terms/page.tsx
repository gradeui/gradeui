/**
 * Terms of Service — placeholder.
 *
 * Real terms TBD. This page exists so the footer + sign-in link
 * resolve instead of 404ing under next-intl rewriting. Drop the
 * actual copy in here when it's ready; layout already reads from
 * the active theme via DS primitives, so no styling work needed
 * at swap time.
 */

import Link from "next/link";
import { Stack } from "@/components/ui/stack";

export const metadata = {
  title: "Terms",
};

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16">
      <Stack gap="lg">
        <Stack gap="xs">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Terms of service
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: pending.
          </p>
        </Stack>

        <Stack gap="md">
          <p className="text-sm text-muted-foreground">
            Grade is in early access. Full terms of service will land here
            before general availability. In the meantime, by using gradeui.com
            you agree to use it in good faith and not for anything illegal,
            abusive, or designed to break our systems.
          </p>
          <p className="text-sm text-muted-foreground">
            Self-host installs of the open-source library are governed by
            the MIT license shipped in the repository.
          </p>
          <p className="text-sm text-muted-foreground">
            Questions:{" "}
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
