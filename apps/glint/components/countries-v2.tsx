// @ts-nocheck: a MECHANICAL twin (7 Oct 2026). The body is the Studio
// JSX byte for byte; only the imports and the export line are rewritten
// (scripts/mechanical-twin.py), so the pair cannot drift by
// hand-porting.
"use client";

// CountriesV2 (14 Oct 2026): the phone country picker of the Glint build's
// sign in (web.staging.glintpay.com/log-in), for our prototype's Log in v2.
//
// TWIN: the Studio shared component "CountriesV2" (cmv8onykah231m). Editing one does
// not touch the other. Keep the pair in sync.
//
// AS THE GLINT BUILD HAS IT (its "Log in · Country menu" capture): the
// trigger shows the flag and the dial code with a chevron (+44, United
// Kingdom, by default); the menu opens under it with "Search country…" at
// the top, then United Kingdom and United States, then every other country
// A to Z, each row the flag, the name and the code on the right, a tick on
// the chosen one. Typing filters by name or code.
//
// The names come from the browser (Intl.DisplayNames) and the flags from
// the ISO code, so the list below is only codes and dial codes.
// ASSUMPTION: the Glint build's full list is not visible in its capture, so
// this is the ISO list of countries and territories with a dial code.
//
//   <CountriesV2.Picker value="GB" onChange={setCountry} />
//   CountriesV2.dial("GB")  "+44"
import * as React from "react";
import { ChevronDown, Search, Check } from "lucide-react";

const DIAL = {
  AF: "93", AX: "358", AL: "355", DZ: "213", AS: "1", AD: "376", AO: "244", AI: "1", AG: "1", AR: "54",
  AM: "374", AW: "297", AU: "61", AT: "43", AZ: "994", BS: "1", BH: "973", BD: "880", BB: "1", BY: "375",
  BE: "32", BZ: "501", BJ: "229", BM: "1", BT: "975", BO: "591", BA: "387", BW: "267", BR: "55", IO: "246",
  VG: "1", BN: "673", BG: "359", BF: "226", BI: "257", KH: "855", CM: "237", CA: "1", CV: "238", KY: "1",
  CF: "236", TD: "235", CL: "56", CN: "86", CX: "61", CC: "61", CO: "57", KM: "269", CG: "242", CD: "243",
  CK: "682", CR: "506", CI: "225", HR: "385", CU: "53", CW: "599", CY: "357", CZ: "420", DK: "45", DJ: "253",
  DM: "1", DO: "1", EC: "593", EG: "20", SV: "503", GQ: "240", ER: "291", EE: "372", SZ: "268", ET: "251",
  FK: "500", FO: "298", FJ: "679", FI: "358", FR: "33", GF: "594", PF: "689", GA: "241", GM: "220", GE: "995",
  DE: "49", GH: "233", GI: "350", GR: "30", GL: "299", GD: "1", GP: "590", GU: "1", GT: "502", GG: "44",
  GN: "224", GW: "245", GY: "592", HT: "509", HN: "504", HK: "852", HU: "36", IS: "354", IN: "91", ID: "62",
  IR: "98", IQ: "964", IE: "353", IM: "44", IL: "972", IT: "39", JM: "1", JP: "81", JE: "44", JO: "962",
  KZ: "7", KE: "254", KI: "686", XK: "383", KW: "965", KG: "996", LA: "856", LV: "371", LB: "961", LS: "266",
  LR: "231", LY: "218", LI: "423", LT: "370", LU: "352", MO: "853", MG: "261", MW: "265", MY: "60", MV: "960",
  ML: "223", MT: "356", MH: "692", MQ: "596", MR: "222", MU: "230", YT: "262", MX: "52", FM: "691", MD: "373",
  MC: "377", MN: "976", ME: "382", MS: "1", MA: "212", MZ: "258", MM: "95", NA: "264", NR: "674", NP: "977",
  NL: "31", NC: "687", NZ: "64", NI: "505", NE: "227", NG: "234", NU: "683", NF: "672", KP: "850", MK: "389",
  MP: "1", NO: "47", OM: "968", PK: "92", PW: "680", PS: "970", PA: "507", PG: "675", PY: "595", PE: "51",
  PH: "63", PL: "48", PT: "351", PR: "1", QA: "974", RE: "262", RO: "40", RU: "7", RW: "250", BL: "590",
  SH: "290", KN: "1", LC: "1", MF: "590", PM: "508", VC: "1", WS: "685", SM: "378", ST: "239", SA: "966",
  SN: "221", RS: "381", SC: "248", SL: "232", SG: "65", SX: "1", SK: "421", SI: "386", SB: "677", SO: "252",
  ZA: "27", KR: "82", SS: "211", ES: "34", LK: "94", SD: "249", SR: "597", SJ: "47", SE: "46", CH: "41",
  SY: "963", TW: "886", TJ: "992", TZ: "255", TH: "66", TL: "670", TG: "228", TK: "690", TO: "676", TT: "1",
  TN: "216", TR: "90", TM: "993", TC: "1", TV: "688", UG: "256", UA: "380", AE: "971", GB: "44", US: "1",
  UY: "598", UZ: "998", VU: "678", VA: "39", VE: "58", VN: "84", VI: "1", WF: "681", EH: "212", YE: "967",
  ZM: "260", ZW: "263",
};

const FIRST = ["GB", "US"];

/** "🇬🇧" from "GB". */
function flag(code) {
  return String.fromCodePoint(...code.split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

let namer = null;
function name(code) {
  try {
    namer = namer ?? new Intl.DisplayNames(["en"], { type: "region" });
    return namer.of(code) ?? code;
  } catch {
    return code;
  }
}

/** United Kingdom, United States, then A to Z by name. */
function list() {
  const rest = Object.keys(DIAL)
    .filter((c) => !FIRST.includes(c))
    .map((c) => ({ code: c, name: name(c) }))
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
  return [...FIRST.map((c) => ({ code: c, name: name(c) })), ...rest].map((c) => ({
    ...c,
    dial: `+${DIAL[c.code]}`,
    flag: flag(c.code),
  }));
}

const FOCUS =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--wds-ring)]";

/** The trigger and its searchable menu. */
function Picker({ value = "GB", onChange, className }) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const rootRef = React.useRef(null);
  const all = React.useMemo(list, []);
  const term = q.trim().toLowerCase();
  const shown = term
    ? all.filter((c) => c.name.toLowerCase().includes(term) || c.dial.includes(term.replace(/^\+?/, "+")))
    : all;
  React.useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  React.useEffect(() => {
    if (open) setQ("");
  }, [open]);
  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        aria-label="Country calling code"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-12 w-full cursor-pointer items-center justify-between gap-2 rounded-[10px] border border-[color:var(--wds-input)] bg-[var(--wds-input-background)] px-4 text-base leading-6 text-[color:var(--wds-foreground)] ${FOCUS}`}
      >
        <span className="flex items-center gap-2">
          <span aria-hidden>{flag(value)}</span>
          {`+${DIAL[value]}`}
        </span>
        <ChevronDown aria-hidden className="size-4 text-[color:var(--wds-muted-foreground)]" />
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label="Choose a country"
          className="absolute left-0 top-[calc(100%+4px)] z-50 flex w-[340px] max-w-[calc(100vw-48px)] flex-col rounded-[10px] border border-[color:var(--wds-border)] bg-[var(--wds-popover)] p-1 shadow-[0_10px_15px_-3px_var(--wds-shadow),0_4px_6px_-4px_var(--wds-shadow)]"
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        >
          <label className="flex h-9 items-center gap-2 rounded-[8px] bg-[var(--wds-muted)] px-2">
            <Search aria-hidden className="size-4 shrink-0 text-[color:var(--wds-muted-foreground)]" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search country…"
              aria-label="Search country"
              className="h-full min-w-0 flex-1 bg-transparent text-sm leading-5 text-[color:var(--wds-foreground)] outline-none placeholder:text-[color:var(--wds-muted-foreground)]"
            />
          </label>
          <div role="listbox" aria-label="Countries" className="mt-1 max-h-[280px] overflow-y-auto">
            {shown.map((c) => (
              <button
                key={c.code}
                type="button"
                role="option"
                aria-selected={c.code === value}
                onClick={() => {
                  onChange?.(c.code);
                  setOpen(false);
                }}
                className={`flex h-8 w-full cursor-pointer items-center gap-2 rounded-[6px] px-2 text-left text-sm leading-5 text-[color:var(--wds-foreground)] hover:bg-[var(--wds-accent)] ${c.code === value ? "bg-[var(--wds-accent)]" : ""} ${FOCUS}`}
              >
                <span aria-hidden>{c.flag}</span>
                <span className="min-w-0 flex-1 truncate">{c.name}</span>
                <span className="text-[color:var(--wds-muted-foreground)]">{c.dial}</span>
                {c.code === value ? <Check aria-hidden className="size-4" /> : <span className="size-4" />}
              </button>
            ))}
            {shown.length ? null : (
              <p className="px-2 py-3 text-sm leading-5 text-[color:var(--wds-muted-foreground)]">No country found</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** A namespace with the picker and the helpers. */
function CountriesV2() {
  return null;
}
CountriesV2.Picker = Picker;
CountriesV2.dial = (code) => `+${DIAL[code] ?? ""}`;
CountriesV2.flag = flag;
CountriesV2.name = name;

/* Exported untyped: the body is plain JSX (see the header). */
const __CountriesV2: any = CountriesV2;
export { __CountriesV2 as CountriesV2 };
