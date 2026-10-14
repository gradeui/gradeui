// @ts-nocheck: promoted Studio JSX, see scripts/promotion-patches.json.
"use client";

// Promoted from Studio screen "New passcode v2"
// (design dmv8iplq561t8, version 1792007019581). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: 78537f803229
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

// New passcode v2 (14 Oct 2026): the business portal's passcode reset,
// last step, as "Glint - Web Portal - Full New" draws it (Login · Choose
// new passcode).
//
// LAYOUT: the title in Raleway Bold 36/40 (it wraps to two lines), the
// Chivo 16/24 lead; 32 under, New passcode and the Web DS OTPInput (4
// slots); Continue, the Web DS Button lg, 32 under; "Back to log in" 12
// under that.
//
// ASSUMPTION, A DEMO: nothing is saved. Four digits continue to the
// Wallets page (the person has just proved who they are); fewer move the
// focus to the next empty slot.
import * as React from "react";
import { Field, FieldLabel } from "@gradeui/ui";
import { LoginTemplateV2 } from "@/components/login-template-v2";
import { WebDsV2 } from "@/components/web-ds-v2";

const WALLETS = "Dashboard — logged-in home v2";
const SIGN_IN = "Log in v2";

export default function NewPasscodePage() {
  const [code, setCode] = React.useState("");
  const goRef = React.useRef(null);
  const complete = code.length === 4;
  return (
    <LoginTemplateV2>
      <h1 className="text-4xl" style={{ lineHeight: "40px" }}>
        Choose a new passcode.
      </h1>
      <p className="mt-2 text-base leading-6 text-muted-foreground">
        You’ll use it to log in here and to unlock the Glint app. Changing it logs you out of the app.
      </p>
      <Field className="mt-8 gap-2">
        <FieldLabel htmlFor="new-passcode-0" className="leading-5">
          New passcode
        </FieldLabel>
        <WebDsV2.OtpField
          id="new-passcode"
          length={4}
          autoFocus
          value={code}
          onChange={setCode}
          onEnter={() => goRef.current?.click()}
        />
      </Field>
      <WebDsV2.Button
        ref={goRef}
        size="lg"
        className="mt-8 w-full"
        data-grade-goto={complete ? WALLETS : undefined}
        onClick={() => (complete ? null : document.getElementById(`new-passcode-${code.length}`)?.focus())}
      >
        Continue
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
