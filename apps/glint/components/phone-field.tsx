"use client";

/**
 * The phone number field with a REAL country picker.
 *
 * WHY IT EXISTS: step 0 only looked like it had one. The Mobile number
 * field was an InputGroupAddon holding a hardcoded US flag emoji next
 * to a decorative ChevronDown, nothing selectable, which is how a UK
 * number the browser autofilled ended up sitting under a US flag. Every
 * phone field in the flow now goes through this component, so the picker
 * and the input cannot drift apart screen by screen.
 *
 * TWO KEYS, NEVER ONE STRING. The country and the national number are
 * stored as SEPARATE flow-store keys. A single "+44 7961 966085" value
 * bakes the dial code into the data: changing the country becomes string
 * surgery on something the user typed, and a recap cannot show the parts
 * separately. So the component takes both keys as props and owns the
 * wiring for both, which is the only way to guarantee the pair stays
 * together at every call site.
 *
 * COMPOSE AT RENDER: composePhone(countryId, national) is the one place
 * the readable form is built, so a recap reads through it instead of
 * concatenating its own.
 *
 * Ported from the Studio shared component "PhoneField"
 * (cmsoweojdntf5x, version 1786467394011). Keep the two in step.
 */

import * as React from "react";
import {
  Field,
  FieldLabel,
  FieldDescription,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@gradeui/ui";
import { useFlowField } from "@/lib/flow-store";

export interface PhoneCountry {
  /** ISO 3166-1 alpha-2, lowercased. The stored value. */
  id: string;
  flag: string;
  /** E.164 calling code, with its plus. */
  dial: string;
  name: string;
  /** A zero-filled SHAPE, not a number: the grouping the country
   *  writes, with no digits anyone could dial. */
  placeholder: string;
  /** National trunk prefix, dropped when a dial code goes in front.
   *  Absent where a country has none, which is the case in the US. */
  trunk?: string;
}

/**
 * THREE COUNTRIES, DELIBERATELY, not the ~200 the ITU lists. This is a
 * US demo: the picker has to open and the flag has to follow the choice,
 * which three rows prove exactly as well as two hundred, and a long list
 * would put a scrolling menu in front of the one thing the field is
 * meant to demonstrate. Each of the three earns its place: the United
 * States is the market being applied for and the default, the United
 * Kingdom is Glint's home market (and the number that exposed the bug),
 * and Switzerland is where the Zurich vault sits.
 *
 * WHEN IT NEEDS TO BE REAL: generate this array from phone metadata
 * (libphonenumber-js carries an iso2, a calling code, a trunk prefix and
 * an example number for every region) and swap the Select for a Combobox
 * so a long list can be typed at. Nothing else has to change: screens
 * only ever store an `id`, and everything on show is derived from the
 * entry.
 *
 * THE KEY IS THE ISO CODE, not the dial code, because a dial code is not
 * an identity: +1 is the United States and Canada both.
 */
export const PHONE_COUNTRIES: PhoneCountry[] = [
  {
    id: "us",
    flag: "\u{1F1FA}\u{1F1F8}",
    dial: "+1",
    name: "United States",
    placeholder: "(555) 000-0000",
  },
  {
    id: "gb",
    flag: "\u{1F1EC}\u{1F1E7}",
    dial: "+44",
    name: "United Kingdom",
    placeholder: "07400 000000",
    trunk: "0",
  },
  {
    id: "ch",
    flag: "\u{1F1E8}\u{1F1ED}",
    dial: "+41",
    name: "Switzerland",
    placeholder: "079 000 00 00",
    trunk: "0",
  },
];

/** The entry for a stored id. Falls back to the first country rather
 *  than undefined, so trimming the list cannot blank a field that has an
 *  older id in storage. */
export function phoneCountry(id: string): PhoneCountry {
  return PHONE_COUNTRIES.find((c) => c.id === id) ?? PHONE_COUNTRIES[0];
}

/**
 * The readable form: "+1 (303) 555-0166". The ONE place the two parts
 * are joined, so a recap never concatenates its own.
 *
 * An empty national number gives an empty string rather than a lone dial
 * code, so a summary row reads as unanswered instead of "+1".
 *
 * THE TRUNK PREFIX COMES OFF HERE. 07400 000000 dialled from outside the
 * UK is +44 7400 000000, never +44 07400 000000, and the same goes for a
 * Swiss 0. Doing it at compose time is the only safe place: the stored
 * national number keeps exactly what the user typed, so switching
 * country re-renders a different readable form without ever editing
 * their input.
 */
export function composePhone(
  countryId: string,
  national: string | undefined,
): string {
  const entry = phoneCountry(countryId);
  let digits = (national ?? "").trim();
  if (!digits) return "";
  if (entry.trunk && digits.startsWith(entry.trunk)) {
    digits = digits.slice(entry.trunk.length).trim();
  }
  return `${entry.dial} ${digits}`;
}

export interface PhoneFieldProps {
  label?: string;
  description?: string;
  /** Flow-store key holding the country id. */
  countryKey: string;
  /** Flow-store key holding the national number, as typed. */
  numberKey: string;
  defaultCountry?: string;
  defaultNumber?: string;
  /** Overrides the selected country's own shape hint. */
  placeholder?: string;
  autoComplete?: string;
  className?: string;
}

export function PhoneField({
  label,
  description,
  countryKey,
  numberKey,
  defaultCountry = "us",
  defaultNumber = "",
  placeholder,
  /* tel-national, not tel, and that is the point: the input holds the
     national part only. Asking the browser for "tel" is what dropped a
     full +44 number into a field sitting next to a US flag. */
  autoComplete = "tel-national",
  className,
}: PhoneFieldProps) {
  const [countryId, setCountryId] = useFlowField(countryKey, defaultCountry);
  const [national, setNational] = useFlowField(numberKey, defaultNumber);
  const selected = phoneCountry(countryId);

  return (
    <Field className={className}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <InputGroup>
        <InputGroupAddon align="inline-start">
          {/* A real Select. The trigger is stripped of its own border,
              background and height so the group reads as ONE field: that
              treatment lives here, once, rather than in every screen
              that needs a phone number. */}
          <Select value={selected.id} onValueChange={setCountryId}>
            <SelectTrigger
              aria-label="Country calling code"
              className="h-7 w-auto gap-1 border-0 bg-transparent px-2 shadow-none dark:bg-transparent"
            >
              {/* Flag and dial code both follow the selection. */}
              <SelectValue>{`${selected.flag} ${selected.dial}`}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PHONE_COUNTRIES.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="mr-2">{c.flag}</span>
                  {c.name}
                  <span className="ml-2 text-muted-foreground">{c.dial}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </InputGroupAddon>
        <InputGroupInput
          inputMode="tel"
          autoComplete={autoComplete}
          placeholder={placeholder ?? selected.placeholder}
          value={national}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setNational(e.target.value)
          }
        />
      </InputGroup>
      {description ? (
        <FieldDescription className="text-xs">{description}</FieldDescription>
      ) : null}
    </Field>
  );
}

/* The statics the Studio module hangs off the component, so a promoted
   screen calling PhoneField.compose(...) resolves against this copy
   too. The named exports above are the idiomatic app-side entry points;
   these exist so the two sources stay call-compatible. */
PhoneField.COUNTRIES = PHONE_COUNTRIES;
PhoneField.country = phoneCountry;
PhoneField.compose = composePhone;
