// @ts-nocheck: promoted Studio JSX, see scripts/promotion-patches.json.
"use client";

// Promoted from Studio screen "Log in passcode v2"
// (design dmv8iphang26p, version 1792007013839). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: f0b19cbe92b6
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

// Log in passcode v2 (14 Oct 2026): step three of the business portal's
// sign in, after the code, as "Glint - Web Portal - Full New" draws it
// (Login · Passcode · Default, Error). Four digits; Login continues to the
// Wallets page.
//
// LAYOUT, as Log in code v2: the title in Raleway Bold 36/40, the Chivo
// 16/24 lead 8 under it; 32 under that the Passcode label and the Web DS
// OTPInput (4 slots); Login, the Web DS Button lg, 32 under; then
// "Forgot passcode? Reset passcode" and "Having trouble signing in?
// Contact support", 12 apart.
//
// ASSUMPTION, A DEMO, NOT AUTH: no passcode is checked. Any four digits
// continue, except 0000, the demo's wrong passcode, which shows the Error
// state ("That passcode is incorrect.", every slot's border destructive).
// Contact support is inert.
import * as React from "react";
import { Field, FieldLabel, FieldError } from "@gradeui/ui";
import { LoginTemplateV2 } from "@/components/login-template-v2";
import { WebDsV2 } from "@/components/web-ds-v2";

const WALLETS = "Dashboard — logged-in home v2";
const FORGOT = "Forgot passcode v2";
const WRONG = "0000";

export default function LogInPasscodePage() {
  const [code, setCode] = React.useState("");
  const [invalid, setInvalid] = React.useState(false);
  const loginRef = React.useRef(null);
  const complete = code.length === 4;
  const ok = complete && code !== WRONG;
  const login = () => {
    if (complete && !ok) setInvalid(true);
    else if (!complete) document.getElementById(`login-passcode-${code.length}`)?.focus();
  };
  return (
    <LoginTemplateV2>
      <h1 className="text-4xl" style={{ lineHeight: "40px" }}>
        Enter your passcode.
      </h1>
      <p className="mt-2 text-base leading-6 text-muted-foreground">
        Enter the passcode you use to unlock the glint app.
      </p>
      <Field className="mt-8 gap-2">
        <FieldLabel htmlFor="login-passcode-0" className="leading-5">
          Passcode
        </FieldLabel>
        <WebDsV2.OtpField
          id="login-passcode"
          length={4}
          autoFocus
          value={code}
          invalid={invalid}
          onChange={(v) => {
            setCode(v);
            setInvalid(false);
          }}
          onEnter={() => loginRef.current?.click()}
        />
        {invalid ? <FieldError className="text-sm leading-5">That passcode is incorrect.</FieldError> : null}
      </Field>
      <WebDsV2.Button
        ref={loginRef}
        size="lg"
        className="mt-8 w-full"
        data-grade-goto={ok ? WALLETS : undefined}
        onClick={login}
      >
        Login
      </WebDsV2.Button>
      <p className="mt-3 text-center text-sm leading-5 text-muted-foreground">
        Forgot passcode?{" "}
        <button type="button" data-grade-goto={FORGOT} className="cursor-pointer font-medium text-primary hover:underline">
          Reset passcode
        </button>
      </p>
      <p className="mt-3 text-center text-sm leading-5 text-muted-foreground">
        Having trouble signing in?{" "}
        <button type="button" className="cursor-pointer font-medium text-primary hover:underline">
          Contact support
        </button>
      </p>
    </LoginTemplateV2>
  );
}
