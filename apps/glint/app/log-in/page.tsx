// @ts-nocheck: promoted Studio JSX, see scripts/promotion-patches.json.
"use client";

// Promoted from Studio screen "Log in v2"
// (design dmur2ps41k9hh, version 1792017030244). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: ccb62dbbcb37
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

// Log in v2 (2 Oct 2026): the business portal's sign in, step one: the
// phone number. Send code goes to "Log in code v2".
//
// 14 OCT, MATCHED TO THE GLINT BUILD (web.staging.glintpay.com/log-in; Ali:
// sign in and the error states match it too):
//   - the rotating headline, then "Enter your phone number and we'll text
//     you a code.";
//   - "Phone number" with the Glint build's country picker
//     (CountriesV2: +44 United Kingdom by default, "Search country…",
//     United Kingdom and United States first, then A to Z) and the number,
//     with no placeholder, as the Glint build has none;
//   - its errors in an alert above the field: an empty number says "Enter
//     your phone number.", a short one "Invalid data" (the Glint build's
//     own copy; Ali may want better);
//   - Send code shows a spinner while it "sends", then moves on;
//   - "Having trouble signing in? Contact support"; the footer adds
//     "© 2026 Glint Pay Inc." (LoginTemplateV2).
// ASSUMPTION, THE ADDRESS: the Glint build runs phone, code and passcode at
// one address, /log-in; our prototype keeps a page per step (/log-in,
// /log-in/code, /log-in/passcode), so each step can be opened directly.
//
// A DEMO, NOT AUTH: nothing here signs anyone in. The number is held in
// this screen's state only while it is open, never sent or stored, and
// autofill is off. The only check is the digit count, so the errors show.
import * as React from "react";
import { Field, FieldLabel } from "@gradeui/ui";
import { LoginTemplateV2 } from "@/components/login-template-v2";
import { CountriesV2 } from "@/components/countries-v2";
import { WebDsV2 } from "@/components/web-ds-v2";

const CODE_SCREEN = "Log in code v2";

export default function LogInPage() {
  const [country, setCountry] = React.useState("GB");
  const [number, setNumber] = React.useState("");
  const [error, setError] = React.useState(null);
  const [sending, setSending] = React.useState(false);
  const goRef = React.useRef(null);
  const digits = number.replace(/\D/g, "");

  const send = () => {
    if (sending) return;
    if (!digits) return setError("Enter your phone number.");
    if (digits.length < 7) return setError("Invalid data");
    setError(null);
    setSending(true);
    window.setTimeout(() => goRef.current?.click(), 900);
  };

  return (
    <LoginTemplateV2>
      <LoginTemplateV2.Headline />
      <p className="mt-2 text-base leading-6 text-muted-foreground">
        Enter your phone number and we’ll text you a code.
      </p>

      {error ? (
        <WebDsV2.Alert tone="destructive" title={error} className="mt-6" />
      ) : null}

      <Field className={`${error ? "mt-4" : "mt-8"} gap-2`}>
        <FieldLabel htmlFor="login-phone" className="leading-5">
          Phone number
        </FieldLabel>
        <div className="flex gap-3">
          <CountriesV2.Picker value={country} onChange={setCountry} className="w-32 shrink-0" />
          <WebDsV2.Input
            id="login-phone"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            value={number}
            onChange={(e) => {
              setNumber(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                send();
              }
            }}
            className="flex-1"
          />
        </div>
      </Field>

      <WebDsV2.Button size="lg" className="mt-8 w-full" onClick={send} aria-busy={sending || undefined}>
        {sending ? <LoginTemplateV2.Spinner /> : "Send code"}
      </WebDsV2.Button>
      {/* The goto fires after the spinner: the bridge acts on the click. */}
      <button ref={goRef} type="button" tabIndex={-1} aria-hidden className="hidden" data-grade-goto={CODE_SCREEN} />
      <p className="mt-4 text-center text-sm leading-5 text-muted-foreground">
        Having trouble signing in?{" "}
        <button type="button" className="cursor-pointer font-medium text-primary hover:underline">
          Contact support
        </button>
      </p>
    </LoginTemplateV2>
  );
}
