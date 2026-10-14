// @ts-nocheck: promoted Studio JSX, see scripts/promotion-patches.json.
"use client";

// Promoted from Studio screen "Forgot passcode v2"
// (design dmv8ipitiwy4d, version 1792007015814). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: c6fb3c35d20c
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

// Forgot passcode v2 (14 Oct 2026): the business portal's passcode reset,
// first step, as "Glint - Web Portal - Full New" draws it (Login · Forgot
// passcode). From the passcode step's Reset passcode.
//
// LAYOUT: the title in Raleway Bold 36/40, the Chivo 16/24 lead; 32 under,
// Email address and the Web DS Input lg; Send code, the Web DS Button lg,
// 32 under; "Back to log in" 12 under that.
//
// ASSUMPTION, A DEMO: nothing is sent. Send code needs something shaped
// like an email address ("Enter an email address, like you@company.com."
// otherwise, the field's border destructive) and goes on to Verify your
// account, the slide that follows.
import * as React from "react";
import { Field, FieldLabel, FieldError } from "@gradeui/ui";
import { LoginTemplateV2 } from "@/components/login-template-v2";
import { WebDsV2 } from "@/components/web-ds-v2";

const VERIFY = "Verify account v2";
const SIGN_IN = "Log in v2";

export default function ForgotPasscodePage() {
  const [email, setEmail] = React.useState("");
  const [invalid, setInvalid] = React.useState(false);
  const sendRef = React.useRef(null);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  return (
    <LoginTemplateV2>
      <h1 className="text-4xl" style={{ lineHeight: "40px" }}>
        Forgot your passcode?
      </h1>
      <p className="mt-2 text-base leading-6 text-muted-foreground">
        Enter the email address you used to create your account.
      </p>
      <Field className="mt-8 gap-2">
        <FieldLabel htmlFor="forgot-email" className="leading-5">
          Email address
        </FieldLabel>
        <WebDsV2.Input
          id="forgot-email"
          type="email"
          autoComplete="off"
          placeholder="you@company.com"
          invalid={invalid}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setInvalid(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              sendRef.current?.click();
            }
          }}
        />
        {invalid ? (
          <FieldError className="text-sm leading-5">Enter an email address, like you@company.com.</FieldError>
        ) : null}
      </Field>
      <WebDsV2.Button
        ref={sendRef}
        size="lg"
        className="mt-8 w-full"
        data-grade-goto={valid ? VERIFY : undefined}
        onClick={() => (valid ? null : setInvalid(true))}
      >
        Send code
      </WebDsV2.Button>
      <button
        type="button"
        data-grade-goto={SIGN_IN}
        className="mx-auto mt-3 cursor-pointer text-sm leading-5 text-muted-foreground hover:underline"
      >
        Back to log in
      </button>
    </LoginTemplateV2>
  );
}
