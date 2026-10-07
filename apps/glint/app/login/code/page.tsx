"use client";

// Promoted from Studio screen "Log in code v2"
// (design dmur2qa05uort, version 1791396768570). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: 11b82577475f
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

// Log in code v2 (2 Oct 2026): step two of the business portal's sign in,
// the one-time code. Six digits; the sixth continues on its own to the
// Wallets page, as the Web Portal file's Login · Code slides describe.
//
// ASSUMPTION, A DEMO, NOT AUTH: no code is sent and none is checked. Any
// six digits continue, except 000000, which is the demo's wrong code so
// the Code · Error state can be shown (7 Oct). The digits are never stored.
// "Send a new code" is inert. "Back to sign in" returns to the number.
//
// 7 OCT, MATCHED TO "Glint - Web Portal - Full New" (Login · Code ·
// Default, Error): the title is Raleway Bold 36/40 (the CodeForm's own
// title, larger than the phone step's 30/36 headline); the lead is Chivo
// 16/24; the code is the Web DS OTPInput (48 x 56 slots, 8 apart, Raleway
// Bold 24/32); Continue is the Web DS Button at lg; the help line and Back
// to sign in sit 12 apart under it. The error turns every slot's border
// destructive and reads "That code doesn't match. Check it and try again,
// or send a new one."
//
// The mobile number's last four come from Persona (the applicant's
// mobile), so the copy matches the persona rather than a hard-coded
// number.
import * as React from "react";
import { Field, FieldLabel, FieldError } from "@gradeui/ui";
import { LoginTemplateV2 } from "@/components/login-template-v2";
import { Persona } from "@/lib/persona";
import { WebDsV2 } from "@/components/web-ds-v2";

const WALLETS = "Dashboard — logged-in home v2";
const SIGN_IN = "Log in v2";
const LENGTH = 6;
/** The demo's wrong code (see the header). */
const WRONG = "000000";

export default function LogInCodePage() {
  const [digits, setDigits] = React.useState<string[]>(Array(LENGTH).fill(""));
  const [invalid, setInvalid] = React.useState(false);
  const cells = React.useRef<(HTMLInputElement | null)[]>([]);
  const continueRef = React.useRef<HTMLButtonElement>(null);
  const code = digits.join("");
  const complete = code.length === LENGTH;
  const ok = complete && code !== WRONG;
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
    setInvalid(false);
    setDigits((prev) => {
      const next = [...prev];
      incoming.forEach((d: string, k: number) => (next[from + k] = d));
      return next;
    });
    cells.current[Math.min(from + incoming.length, LENGTH - 1)]?.focus();
  };

  const clear = (i: number) => {
    setInvalid(false);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = "";
      return next;
    });
  };

  /* The goto is on the button only while the code is right, so a wrong
     code falls through to here and shows the error. */
  const next = () => {
    if (complete) {
      if (!ok) setInvalid(true);
      return;
    }
    cells.current[digits.findIndex((d) => d === "")]?.focus();
  };

  return (
    <LoginTemplateV2>
      <h1 className="text-4xl" style={{ lineHeight: "40px" }}>
        Check your phone.
      </h1>
      <p className="mt-2 text-base leading-6 text-muted-foreground">
        Enter the code we sent to your mobile ending {ending}.
      </p>

      <Field className="mt-8 gap-2" data-invalid={invalid || undefined}>
        <FieldLabel htmlFor="login-code-0" className="leading-5">
          Sign-in code
        </FieldLabel>
        <WebDsV2.OtpGroup>
          {digits.map((d, i) => (
            <WebDsV2.OtpSlot
              key={i}
              id={`login-code-${i}`}
              ref={(el: HTMLInputElement | null) => {
                cells.current[i] = el;
              }}
              autoComplete={i === 0 ? "one-time-code" : "off"}
              aria-label={`Digit ${i + 1} of ${LENGTH}`}
              autoFocus={i === 0}
              invalid={invalid}
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
            />
          ))}
        </WebDsV2.OtpGroup>
        {invalid ? (
          <FieldError className="text-sm leading-5">
            That code doesn't match. Check it and try again, or send a new one.
          </FieldError>
        ) : null}
      </Field>

      <WebDsV2.Button
        ref={continueRef}
        size="lg"
        className="mt-8 w-full"
        data-grade-goto={ok ? WALLETS : undefined}
        onClick={next}
      >
        Continue
      </WebDsV2.Button>
      <p className="mt-3 text-center text-sm leading-5 text-muted-foreground">
        Didn't get it?{" "}
        <button type="button" className="cursor-pointer font-medium text-primary hover:underline">
          Send a new code
        </button>
      </p>
      <button
        type="button"
        data-grade-goto={SIGN_IN}
        className="mx-auto mt-3 cursor-pointer text-sm font-medium leading-5 text-primary hover:underline"
      >
        Back to sign in
      </button>
    </LoginTemplateV2>
  );
}

