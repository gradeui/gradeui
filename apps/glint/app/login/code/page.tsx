"use client";

// Promoted from Studio screen "Log in code v2"
// (design dmur2qa05uort, version 1790952286682). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: e05e2515d3b3
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

// Log in code v2 (2 Oct 2026): the business portal's sign in, step two of
// two: the one-time code. Web DS LoginTemplate with the CodeForm in it, as
// the Web Portal file's Login slides set it. Continue goes to Wallets.
//
// ASSUMPTION, A DEMO, NOT AUTH: ANY six digits work. No code was sent, so
// none is checked, and nothing typed here is sent or stored. That is also
// why the CodeForm's error state ("That code doesn't match") never shows.
// The mobile it names is the demo persona's (Persona applicant, ending
// 0166, as in the slides), never the number typed on the step before,
// which is not kept anywhere.
//
// Six DS Inputs, one digit each: typing moves to the next cell (a digit
// typed over a filled cell replaces it), Backspace on an empty cell moves
// back, and pasting or autofilling a code fills the row. The sixth digit
// continues on its own, as the production form does; Continue is there
// too, and with cells still empty it puts the cursor in the first empty
// one. "Send a new code" is inert. "Back to sign in" returns to "Log in v2".
import * as React from "react";
import { Field, FieldLabel, Input, Button } from "@gradeui/ui";
import { LoginTemplateV2 } from "@/components/login-template-v2";
import { Persona } from "@/lib/persona";

const WALLETS = "Dashboard — logged-in home v2";
const SIGN_IN = "Log in v2";
const LENGTH = 6;

export default function LogInCodePage() {
  const [digits, setDigits] = React.useState<string[]>(Array(LENGTH).fill(""));
  const cells = React.useRef<(HTMLInputElement | null)[]>([]);
  const continueRef = React.useRef<HTMLButtonElement>(null);
  const complete = digits.every((d) => d !== "");
  const ending = String(Persona.DEFAULT.applicant?.mobile ?? "")
    .replace(/\D/g, "")
    .slice(-4);

  /* The sixth digit continues on its own, after a beat so it is seen. */
  React.useEffect(() => {
    if (!complete) return;
    const t = window.setTimeout(() => continueRef.current?.click(), 250);
    return () => window.clearTimeout(t);
  }, [complete]);

  const fill = (from: number, text: string) => {
    const incoming = text.replace(/\D/g, "").slice(0, LENGTH - from).split("");
    if (!incoming.length) return;
    setDigits((prev) => {
      const next = [...prev];
      incoming.forEach((d: string, k: number) => (next[from + k] = d));
      return next;
    });
    cells.current[Math.min(from + incoming.length, LENGTH - 1)]?.focus();
  };

  const clear = (i: number) =>
    setDigits((prev) => {
      const next = [...prev];
      next[i] = "";
      return next;
    });

  const next = () => {
    if (complete) return;
    cells.current[digits.findIndex((d) => d === "")]?.focus();
  };

  return (
    <LoginTemplateV2>
      <h1 className="text-3xl" style={{ lineHeight: "36px" }}>
        Check your phone.
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter the code we sent to your mobile ending {ending}.
      </p>

      <Field className="mt-8">
        <FieldLabel htmlFor="login-code-0">Sign-in code</FieldLabel>
        <div className="flex gap-2">
          {digits.map((d, i) => (
            <Input
              key={i}
              id={`login-code-${i}`}
              ref={(el: HTMLInputElement | null) => {
                cells.current[i] = el;
              }}
              size="lg"
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              aria-label={`Digit ${i + 1} of ${LENGTH}`}
              autoFocus={i === 0}
              value={d}
              onChange={(e) => {
                let v = e.target.value.replace(/\D/g, "");
                if (!v) return clear(i);
                /* A digit typed into a filled cell: keep the new one. */
                if (d && v.length === 2) v = v[0] === d ? v[1] : v[0];
                fill(i, v);
              }}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !digits[i] && i > 0) {
                  e.preventDefault();
                  clear(i - 1);
                  cells.current[i - 1]?.focus();
                } else if (e.key === "ArrowLeft" && i > 0) {
                  cells.current[i - 1]?.focus();
                } else if (e.key === "ArrowRight" && i < LENGTH - 1) {
                  cells.current[i + 1]?.focus();
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  continueRef.current?.click();
                }
              }}
              onPaste={(e) => {
                e.preventDefault();
                fill(i, e.clipboardData.getData("text"));
              }}
              onFocus={(e) => e.target.select()}
              className="w-12 px-0 text-center text-lg"
            />
          ))}
        </div>
      </Field>

      <Button
        ref={continueRef}
        size="lg"
        className="mt-8 w-full"
        data-grade-goto={complete ? WALLETS : undefined}
        onClick={next}
      >
        Continue
      </Button>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Didn’t get it?{" "}
        <button type="button" className="cursor-pointer font-medium text-primary hover:underline">
          Send a new code
        </button>
      </p>
      <button
        type="button"
        data-grade-goto={SIGN_IN}
        className="mx-auto mt-3 cursor-pointer text-sm font-medium text-primary hover:underline"
      >
        Back to sign in
      </button>
    </LoginTemplateV2>
  );
}

