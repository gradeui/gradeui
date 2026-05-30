/**
 * Sign-in page.
 *
 * Server component shell. Reads provider config from env so only
 * the buttons that work on this deploy ship in the rendered HTML.
 * Local-only mode (no Supabase keys) renders an explainer card
 * instead of a non-functional form.
 *
 * Visual layer uses the @/components/ui primitives so the page
 * picks up gds-* tokens and the active theme. Don't drop raw
 * <button>/<input> here — the DS handles every variant we need.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Stack } from "@/components/ui/stack";
import { enabledAuthProviders, isAuthConfigured } from "@/lib/supabase/env";
import { getServerUser } from "@/lib/supabase/server";
import { SignInForm } from "./sign-in-form";

export const metadata = {
  title: "Sign in",
};

interface SignInPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { next, error } = await searchParams;

  // Already signed in? Skip the form, send them on.
  const user = await getServerUser();
  if (user) {
    redirect(next && next.startsWith("/") ? next : "/studio");
  }

  const configured = isAuthConfigured();
  const providers = enabledAuthProviders();
  const safeNext = next && next.startsWith("/") ? next : "/studio";

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
      <Stack gap="lg" className="w-full max-w-[380px]">
        <Stack gap="xs" align="center" className="text-center">
          <Link
            href="/"
            className="text-2xl font-semibold tracking-tight text-foreground"
          >
            Grade
          </Link>
          <p className="text-sm text-muted-foreground">
            {configured ? "Sign in to open Studio" : "Auth isn’t configured on this deploy"}
          </p>
        </Stack>

        {configured ? (
          <Card>
            <CardContent className="p-6">
              <SignInForm
                providers={providers}
                next={safeNext}
                initialError={error ?? null}
              />
            </CardContent>
          </Card>
        ) : (
          <LocalOnlyCard />
        )}

        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to the{" "}
          <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
            terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
            privacy policy
          </Link>
          .
        </p>
      </Stack>
    </main>
  );
}

function LocalOnlyCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Local-only mode</CardTitle>
        <CardDescription>
          This Grade install doesn’t have Supabase configured, so there’s
          no account to sign in to. Studio is open and your work is saved
          to this browser’s localStorage.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Stack gap="sm">
          <p className="text-sm text-muted-foreground">
            See{" "}
            <Link
              href="https://github.com/alastairdriver/gradeui/blob/main/SETUP-AUTH.md"
              className="underline underline-offset-4 hover:text-foreground"
            >
              SETUP-AUTH.md
            </Link>{" "}
            to enable cloud sign-in.
          </p>
          <Button asChild className="w-full" size="lg">
            <Link href="/studio">Open Studio</Link>
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
