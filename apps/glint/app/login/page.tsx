"use client";

// Promoted from Studio screen "Log in v2"
// (design dmur2ps41k9hh, version 1791397135331). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: 94254fb81a9f
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
// 7 OCT, MATCHED TO "Glint - Web Portal - Full New" (Login · Phone ·
// Default, Filled, Error): the lead is Chivo 16/24; the country select
// and the number are the Web DS Select and Input at lg (48 tall, 10
// corners, input-background), 128 and the rest, 12 apart; Send code is
// the Web DS Button at lg (40, 8 corners, Chivo Medium 14/20 on
// button-primary). Heading, fields and actions are 32 apart, the help line
// 16 under the button.
//
// ASSUMPTION, THE COUNTRY: Figma's Default slide shows "🇬🇧 +44" with a
// "(555) 000-0000" placeholder, but its Filled and Error slides show
// "🇺🇸 +1" and a US number, and the web portal is for US business
// accounts only (Ali, 1 Oct). So United States stays the default here, and
// the placeholder is PhoneField's US one. If the Default slide's +44 is
// meant, set the initial countryId to "uk".
//
// The label stays in foreground when the field is invalid (Figma's Error
// slides), so the Field carries no data-invalid: only the control's border
// and the message turn destructive.
//
// Copy is the Web Portal file's, verbatim. The countries are PhoneField's
// three (United States first), so the two phone fields in the demo offer
// the same list.
import * as React from "react";
import {
  Field,
  FieldLabel,
  FieldError,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@gradeui/ui";
import { LoginTemplateV2 } from "@/components/login-template-v2";
import { PhoneField } from "@/components/phone-field";
import { WebDsV2 } from "@/components/web-ds-v2";

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
      <p className="mt-2 text-base leading-6 text-muted-foreground">
        Enter your phone number and we’ll text you a code.
      </p>

      <Field className="mt-8 gap-2">
        <FieldLabel htmlFor="login-phone" className="leading-5">
          Phone number
        </FieldLabel>
        <div className="flex gap-3">
          <Select value={countryId} onValueChange={setCountryId}>
            <SelectTrigger aria-label="Country calling code" className={`${WebDsV2.SELECT_TRIGGER} w-32 shrink-0`}>
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
          <WebDsV2.Input
            id="login-phone"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder={country.placeholder}
            invalid={invalid}
            value={number}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setNumber(e.target.value);
              setInvalid(false);
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                e.preventDefault();
                sendRef.current?.click();
              }
            }}
            className="flex-1"
          />
        </div>
        {invalid ? <FieldError className="text-sm leading-5">Check the number and try again.</FieldError> : null}
      </Field>

      <WebDsV2.Button
        ref={sendRef}
        size="lg"
        className="mt-8 w-full"
        data-grade-goto={valid ? CODE_SCREEN : undefined}
        onClick={send}
      >
        Send code
      </WebDsV2.Button>
      <p className="mt-4 text-center text-sm leading-5 text-muted-foreground">
        Having trouble signing in?{" "}
        <button type="button" className="cursor-pointer font-medium text-primary hover:underline">
          Contact support
        </button>
      </p>
    </LoginTemplateV2>
  );
}

