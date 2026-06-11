"use client";

/**
 * WaitlistFlow — the 3-step early-access form on /waitlist.
 *
 * Step 1: who you are (first/last name, work email, optional company)
 * Step 2: team size
 * Step 3: role + what you'd make with Grade → submit
 *
 * Posts to /api/waitlist (Supabase-backed when configured; accepts and
 * logs in local-only mode). Renders inside <MarketingLayout>, so all
 * colour/spacing/radius comes from the scoped Grade Marketing theme.
 */

import * as React from "react";
import { CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TEAM_SIZES = ["Just me", "2–10", "11–50", "51+"] as const;
const ROLES = [
  "Designer",
  "Design engineer",
  "Developer",
  "Founder",
  "Other",
] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type StepIndex = 0 | 1 | 2;

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  teamSize: string;
  role: string;
  notes: string;
}

const INITIAL: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  company: "",
  teamSize: "",
  role: "",
  notes: "",
};

export function WaitlistFlow() {
  const [step, setStep] = React.useState<StepIndex>(0);
  const [form, setForm] = React.useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState("");

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const step1Valid =
    form.firstName.trim().length > 0 &&
    form.lastName.trim().length > 0 &&
    EMAIL_RE.test(form.email.trim());

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          company: form.company.trim() || undefined,
          teamSize: form.teamSize || undefined,
          role: form.role || undefined,
          notes: form.notes.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
          You&apos;re on the list
        </h1>
        <p className="text-muted-foreground text-lg">
          Thanks, {form.firstName}. We&apos;ll email you at{" "}
          <span className="text-foreground">{form.email}</span> when your
          early access is ready.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-16 md:py-20">
      {/* Progress — three segments, current one lit. */}
      <div className="flex gap-3 mb-12" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step + 1}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              i <= step ? "bg-foreground" : "bg-border"
            )}
          />
        ))}
      </div>

      {step === 0 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (step1Valid) setStep(1);
          }}
        >
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight mb-4">
            Join the waitlist for
            <br />
            early access
          </h1>
          <p className="text-muted-foreground text-lg mb-10">
            No extra permissions, no spam. Just joining the waitlist.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6 mb-6">
            <div className="space-y-2">
              <Label htmlFor="wl-first">First name</Label>
              <Input
                id="wl-first"
                autoComplete="given-name"
                placeholder="Yayoi"
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wl-last">Last name</Label>
              <Input
                id="wl-last"
                autoComplete="family-name"
                placeholder="Kusama"
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                className="h-12"
              />
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <Label htmlFor="wl-email">Work email</Label>
            <Input
              id="wl-email"
              type="email"
              autoComplete="email"
              placeholder="yayoi@infinityroominc.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2 mb-10">
            <Label htmlFor="wl-company">
              Company{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="wl-company"
              autoComplete="organization"
              placeholder="Infinity Room Inc."
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              className="h-12"
            />
          </div>

          <Button type="submit" size="lg" className="w-full h-12" disabled={!step1Valid}>
            Next: Team size
          </Button>
        </form>
      )}

      {step === 1 && (
        <div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight mb-4">
            How big is
            <br />
            your team?
          </h1>
          <p className="text-muted-foreground text-lg mb-10">
            Helps us shape early access. Solo designers and teams get
            different things first.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10" role="radiogroup" aria-label="Team size">
            {TEAM_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                role="radio"
                aria-checked={form.teamSize === size}
                onClick={() => set("teamSize", size)}
                className={cn(
                  "h-14 rounded-[var(--gds-radius-lg)] border text-base transition-colors",
                  form.teamSize === size
                    ? "border-foreground bg-foreground/5 text-foreground"
                    : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                )}
              >
                {size}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="h-12"
              onClick={() => setStep(0)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              type="button"
              size="lg"
              className="flex-1 h-12"
              disabled={!form.teamSize}
              onClick={() => setStep(2)}
            >
              Next: About you
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (form.role && !submitting) void submit();
          }}
        >
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight mb-4">
            What best
            <br />
            describes you?
          </h1>
          <p className="text-muted-foreground text-lg mb-10">
            Grade is a design system for designers. Tell us where
            you&apos;re coming from.
          </p>

          <div className="flex flex-wrap gap-3 mb-8" role="radiogroup" aria-label="Role">
            {ROLES.map((role) => (
              <button
                key={role}
                type="button"
                role="radio"
                aria-checked={form.role === role}
                onClick={() => set("role", role)}
                className={cn(
                  "h-11 px-5 rounded-full border text-sm transition-colors",
                  form.role === role
                    ? "border-foreground bg-foreground/5 text-foreground"
                    : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                )}
              >
                {role}
              </button>
            ))}
          </div>

          <div className="space-y-2 mb-10">
            <Label htmlFor="wl-notes">
              What would you make with Grade?{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <textarea
              id="wl-notes"
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="A theme for my portfolio, client prototypes, our product's design system…"
              className="w-full rounded-[var(--gds-radius-lg)] border border-border bg-transparent px-4 py-3 text-base placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          {error && <p className="text-sm text-destructive mb-4">{error}</p>}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="h-12"
              onClick={() => setStep(1)}
              disabled={submitting}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              type="submit"
              size="lg"
              className="flex-1 h-12"
              disabled={!form.role || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Joining…
                </>
              ) : (
                "Join the waitlist"
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
