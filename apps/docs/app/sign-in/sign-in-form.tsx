"use client";

/**
 * Sign-in form — client component.
 *
 * Three states:
 *  - idle        → render configured provider buttons + email input
 *  - submitting  → provider call in flight; controls disabled
 *  - sent        → magic-link email dispatched; show inbox confirmation
 *  - error       → surface what Supabase / our callback returned
 *
 * Everything visual goes through @/components/ui primitives so the
 * form picks up active theme tokens without per-call style overrides.
 */

import * as React from "react";
import { useSupabaseAuth } from "@/components/supabase-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stack } from "@/components/ui/stack";
import { Callout, CalloutDescription } from "@/components/ui/callout";
import { Separator } from "@/components/ui/separator";
import type { AuthProvider } from "@/lib/supabase/env";

interface SignInFormProps {
  providers: AuthProvider[];
  next: string;
  initialError: string | null;
}

type FormStatus =
  | { kind: "idle" }
  | { kind: "submitting"; via: AuthProvider }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string };

export function SignInForm({ providers, next, initialError }: SignInFormProps) {
  const { supabase } = useSupabaseAuth();
  const [status, setStatus] = React.useState<FormStatus>(
    initialError ? { kind: "error", message: initialError } : { kind: "idle" },
  );
  const [email, setEmail] = React.useState("");

  const callbackUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      : `/auth/callback?next=${encodeURIComponent(next)}`;

  async function signInWithGoogle() {
    if (!supabase) return;
    setStatus({ kind: "submitting", via: "google" });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl },
    });
    if (error) setStatus({ kind: "error", message: error.message });
  }

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    const trimmed = email.trim();
    if (!trimmed) return;
    setStatus({ kind: "submitting", via: "email" });
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: callbackUrl },
    });
    if (error) {
      setStatus({ kind: "error", message: error.message });
      return;
    }
    setStatus({ kind: "sent", email: trimmed });
  }

  if (status.kind === "sent") {
    return (
      <Stack gap="md">
        <Stack gap="xs">
          <p className="text-sm font-medium text-foreground">Check your inbox</p>
          <p className="text-sm text-muted-foreground">
            We sent a magic link to{" "}
            <span className="font-medium text-foreground">{status.email}</span>.
            Click it to finish signing in.
          </p>
        </Stack>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setStatus({ kind: "idle" })}
        >
          Use a different email
        </Button>
      </Stack>
    );
  }

  const submitting = status.kind === "submitting";
  const errorMessage = status.kind === "error" ? status.message : null;

  return (
    <Stack gap="md">
      {providers.includes("google") && (
        <Button
          type="button"
          onClick={signInWithGoogle}
          disabled={submitting}
          variant="outline"
          size="lg"
          className="w-full"
        >
          <GoogleMark />
          {status.kind === "submitting" && status.via === "google"
            ? "Redirecting…"
            : "Continue with Google"}
        </Button>
      )}

      {providers.includes("google") && providers.includes("email") && (
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>
      )}

      {providers.includes("email") && (
        <form onSubmit={signInWithEmail}>
          <Stack gap="sm">
            <Stack gap="xs">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </Stack>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting || !email.trim()}
            >
              {status.kind === "submitting" && status.via === "email"
                ? "Sending…"
                : "Email me a magic link"}
            </Button>
          </Stack>
        </form>
      )}

      {errorMessage && (
        <Callout variant="destructive">
          <CalloutDescription>{humaniseAuthError(errorMessage)}</CalloutDescription>
        </Callout>
      )}
    </Stack>
  );
}

function humaniseAuthError(raw: string): string {
  switch (raw) {
    case "missing_code":
      return "The sign-in link didn’t carry a code. Try again.";
    case "access_denied":
      return "You declined the sign-in. Try again when you’re ready.";
    default:
      return raw;
  }
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.583-5.036-3.71H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.708A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.708V4.96H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.04l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96l3.007 2.332C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
