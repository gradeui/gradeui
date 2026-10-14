// @ts-nocheck: promoted Studio JSX, see scripts/promotion-patches.json.
"use client";

// Promoted from Studio screen "Verify account v2"
// (design dmv8ipk6sspxj, version 1792007017588). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: cfe3fe0819da
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

// Verify account v2 (14 Oct 2026): the business portal's passcode reset,
// second step, as "Glint - Web Portal - Full New" draws it (Login · Verify
// account · Default, Error, Locked).
//
// LAYOUT: the title in Raleway Bold 36/40, the Chivo 16/24 lead; 32 under,
// three fields 16 apart (Date of birth, Postcode, Last 4 digits of your
// Glint card: the label 4 above a Web DS Input lg); Continue, the Web DS
// Button lg, 32 under; "Back to log in" 12 under that. Error and Locked
// put the destructive Web DS Alert 32 above the fields.
//
// ASSUMPTIONS, A DEMO:
//   - nothing is checked against anything real. The demo's wrong answer
//     is a card ending 1111, as Figma's Error slides fill it: each try
//     counts down "You have N attempts remaining." from 6, and at none
//     the Locked message shows and Continue stays put;
//   - any other full set continues to Choose a new passcode;
//   - the formats are Figma's (DD/MM/YYYY, a UK postcode) although the
//     portal is US: flagged to Ali.
import * as React from "react";
import { Field, FieldLabel } from "@gradeui/ui";
import { LoginTemplateV2 } from "@/components/login-template-v2";
import { WebDsV2 } from "@/components/web-ds-v2";

const NEW_PASSCODE = "New passcode v2";
const SIGN_IN = "Log in v2";
const WRONG_CARD = "1111";
const ATTEMPTS = 6;

function Labelled({ id, label, children }) {
  return (
    <Field className="gap-1">
      <FieldLabel htmlFor={id} className="leading-5">
        {label}
      </FieldLabel>
      {children}
    </Field>
  );
}

export default function VerifyAccountPage() {
  const [dob, setDob] = React.useState("");
  const [postcode, setPostcode] = React.useState("");
  const [card, setCard] = React.useState("");
  const [left, setLeft] = React.useState(null);
  const [tried, setTried] = React.useState(false);
  const filled = dob.trim().length >= 8 && postcode.trim().length >= 3 && /^\d{4}$/.test(card);
  const wrong = card === WRONG_CARD;
  const locked = left === 0;
  const ok = filled && !wrong && !locked;
  const go = () => {
    setTried(true);
    if (filled && wrong && !locked) setLeft((n) => (n == null ? ATTEMPTS : Math.max(0, n - 1)));
  };
  return (
    <LoginTemplateV2>
      <h1 className="text-4xl" style={{ lineHeight: "40px" }}>
        Verify your account.
      </h1>
      <p className="mt-2 text-base leading-6 text-muted-foreground">
        Answer these security questions so we can verify it’s you.
      </p>
      {left != null ? (
        <WebDsV2.Alert tone="destructive" className="mt-8">
          {locked
            ? "Your details don’t match our records. If you’ve used all your attempts, contact support to unlock your account."
            : `The details you’ve entered don’t match our records. You have ${left} attempts remaining.`}
        </WebDsV2.Alert>
      ) : null}
      <div className="mt-8 flex flex-col gap-4">
        <Labelled id="verify-dob" label="Date of birth">
          <WebDsV2.Input
            id="verify-dob"
            inputMode="numeric"
            autoComplete="off"
            placeholder="DD/MM/YYYY"
            invalid={tried && dob.trim().length < 8}
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </Labelled>
        <Labelled id="verify-postcode" label="Postcode">
          <WebDsV2.Input
            id="verify-postcode"
            autoComplete="off"
            invalid={tried && postcode.trim().length < 3}
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
          />
        </Labelled>
        <Labelled id="verify-card" label="Last 4 digits of your Glint card">
          <WebDsV2.Input
            id="verify-card"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            invalid={tried && !/^\d{4}$/.test(card)}
            value={card}
            onChange={(e) => setCard(e.target.value.replace(/\D/g, "").slice(0, 4))}
          />
        </Labelled>
      </div>
      <WebDsV2.Button size="lg" className="mt-8 w-full" data-grade-goto={ok ? NEW_PASSCODE : undefined} onClick={go}>
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
