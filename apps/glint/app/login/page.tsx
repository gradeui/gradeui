"use client";

// Promoted from Studio screen "Log in v2"
// (design dmur2ps41k9hh, version 1790952229118). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: eca92e5722b9
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

// Log in v2 (2 Oct 2026): the business portal's sign in, step one of two:
// the phone number. Glint's production log in is a phone number, then a
// one-time code (web.prod.glintpay.com/log-in), and this follows the Web
// Portal file's Login slides: Web DS LoginTemplate with the SignInForm in
// it. Send code goes to "Log in code v2".
//
// ASSUMPTION, A DEMO, NOT AUTH: nothing here signs anyone in. The number
// is held in this screen's state only while it is open. It is never sent,
// never stored (no FlowStore key, no storage of any kind), and autofill is
// off so the browser does not offer a real number. The only check is that
// it has at least seven digits, so the error state can be shown.
//
// Copy is the Web Portal file's, verbatim (Login slides, 1 Oct). The
// countries are PhoneField's three (United States first), so the two
// phone fields in the demo offer the same list.
import * as React from "react";
import {
  Field,
  FieldLabel,
  FieldError,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Button,
} from "@gradeui/ui";
import { LoginTemplateV2 } from "@/components/login-template-v2";
import { PhoneField } from "@/components/phone-field";

const CODE_SCREEN = "Log in code v2";

export default function LogInPage() {
  const [countryId, setCountryId] = React.useState("us");
  const [number, setNumber] = React.useState("");
  const [invalid, setInvalid] = React.useState(false);
  const sendRef = React.useRef<HTMLButtonElement>(null);
  const country = PhoneField.country(countryId);
  const valid = number.replace(/\D/g, "").length >= 7;

  /* The goto is only on the button while the number is valid, so a valid
     press navigates and an invalid one falls through to onClick and shows
     the error. Enter in the field presses the button the same way. */
  const send = () => {
    if (!valid) setInvalid(true);
  };

  return (
    <LoginTemplateV2>
      <LoginTemplateV2.Headline />
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your phone number and we’ll text you a code.
      </p>

      <Field className="mt-8" data-invalid={invalid || undefined}>
        <FieldLabel htmlFor="login-phone">Phone number</FieldLabel>
        <div className="flex gap-2">
          <Select value={countryId} onValueChange={setCountryId}>
            <SelectTrigger aria-label="Country calling code" className="h-11 w-28 shrink-0">
              <SelectValue>{`${country.flag} ${country.dial}`}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PhoneField.COUNTRIES.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="mr-2">{c.flag}</span>
                  {c.name}
                  <span className="ml-2 text-muted-foreground">{c.dial}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            id="login-phone"
            size="lg"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder={country.placeholder}
            aria-invalid={invalid || undefined}
            value={number}
            onChange={(e) => {
              setNumber(e.target.value);
              setInvalid(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                sendRef.current?.click();
              }
            }}
            className="min-w-0 flex-1"
          />
        </div>
        {invalid ? <FieldError>Check the number and try again.</FieldError> : null}
      </Field>

      <Button
        ref={sendRef}
        size="lg"
        className="mt-8 w-full"
        data-grade-goto={valid ? CODE_SCREEN : undefined}
        onClick={send}
      >
        Send code
      </Button>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Having trouble signing in?{" "}
        <button type="button" className="cursor-pointer font-medium text-primary hover:underline">
          Contact support
        </button>
      </p>
    </LoginTemplateV2>
  );
}
