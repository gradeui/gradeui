import { useEffect, useState } from "react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  ToggleGroup,
  ToggleGroupItem,
  Swatch,
  SwatchGroup,
  Button,
  Label,
} from "@gradeui/ui";

/* The spike's live theme editor, rebuilt from Grade components: a bottom Sheet
   with the glass surface, Tabs across Theme / Type / Size / Font, real Select +
   ToggleGroup controls. A client:load island (interactive chrome, opt-in JS);
   the rest of the page stays static. Every control re-points a real Grade token
   on <html> and persists to localStorage (the pre-paint head script restores
   them with no flash). */

const SCALES: [string, string][] = [
  ["default", "Default"],
  ["minor-second", "Minor second"],
  ["major-second", "Major second"],
  ["minor-third", "Minor third"],
  ["major-third", "Major third"],
  ["perfect-fourth", "Perfect fourth"],
  ["augmented-fourth", "Augmented fourth"],
  ["perfect-fifth", "Perfect fifth"],
  ["golden-ratio", "Golden ratio"],
];
const DENSITIES: [string, string][] = [
  ["default", "Default"],
  ["compact", "Compact"],
  ["cozy", "Cozy"],
  ["comfortable", "Comfortable"],
  ["spacious", "Spacious"],
  ["expansive", "Expansive"],
];
const FONT_OPTS: [string, string][] = [
  ["default", "Default"],
  ["inter", "Inter"],
  ["manrope", "Manrope"],
  ["space-grotesk", "Space Grotesk"],
  ["fraunces", "Fraunces"],
  ["playfair", "Playfair"],
  ["instrument", "Instrument Serif"],
  ["caveat", "Caveat"],
  ["ibm-plex", "IBM Plex Sans"],
];
const FONT_STACKS: Record<string, string> = {
  inter: '"Inter", system-ui, sans-serif',
  manrope: '"Manrope", system-ui, sans-serif',
  "space-grotesk": '"Space Grotesk", system-ui, sans-serif',
  fraunces: '"Fraunces", Georgia, serif',
  playfair: '"Playfair Display", Georgia, serif',
  instrument: '"Instrument Serif", Georgia, serif',
  caveat: '"Caveat", ui-rounded, cursive',
  "ibm-plex": '"IBM Plex Sans", system-ui, sans-serif',
};
const THEMES: [string, string][] = [
  ["default", "oklch(0.7 0.004 85)"],
  ["energy", "oklch(0.61 0.17 175)"],
  ["violet", "oklch(0.61 0.17 300)"],
  ["amber", "oklch(0.61 0.17 75)"],
  ["rose", "oklch(0.61 0.17 15)"],
];

const lsGet = (k: string, d: string) => {
  try {
    return localStorage.getItem(k) ?? d;
  } catch {
    return d;
  }
};
const lsSet = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {}
};
const setAttr = (name: string, val: string) => {
  const r = document.documentElement;
  if (!val || val === "default") r.removeAttribute(name);
  else r.setAttribute(name, val);
};
const setFont = (vars: string[], key: string) => {
  const r = document.documentElement;
  vars.forEach((v) =>
    key === "default" ? r.style.removeProperty(v) : r.style.setProperty(v, FONT_STACKS[key]),
  );
};

/* accent1–5 = primary hue + N×60° (OKLCH). A default algorithm "for now": read
   the live `--primary` channels ("L C H"), step the hue 60° per accent, and
   "bake" each accent into the expressive ramp the page actually paints with —
   `--gds-expressive-accentN-{100,300,700,900}`. Only the hue rotates; a shared
   L/C ladder (EXP_STOPS) mirrors the built-in ramps' shape (100 lightest → 900
   darkest), so every expressive band + accent card tracks the primary and the
   tier mapping stays balanced. Also writes a single `--accent-N` (primary L/C,
   rotated hue) for the swatch + any consumer that wants one flat accent.
   Returns the five `oklch(...)` swatch strings. */
const ACCENT_HUE_STEP = 60;
const ACCENT_COUNT = 5;
const EXP_STOPS: { step: number; l: number; c: number }[] = [
  { step: 100, l: 0.95, c: 0.045 },
  { step: 300, l: 0.8, c: 0.115 },
  { step: 700, l: 0.45, c: 0.16 },
  { step: 900, l: 0.27, c: 0.09 },
];
const deriveAccents = (): string[] => {
  const r = document.documentElement;
  const cs = getComputedStyle(r);
  const parts = cs.getPropertyValue("--primary").trim().split(/\s+/).map(Number);
  if (parts.length < 3 || parts.some(Number.isNaN)) return [];
  const [l, c, h] = parts;
  return Array.from({ length: ACCENT_COUNT }, (_, i) => {
    const n = i + 1;
    const hue = (((h + n * ACCENT_HUE_STEP) % 360) + 360) % 360;
    r.style.setProperty(`--accent-${n}`, `${l} ${c} ${hue}`);
    EXP_STOPS.forEach(({ step, l: sl, c: sc }) =>
      r.style.setProperty(`--gds-expressive-accent${n}-${step}`, `oklch(${sl} ${sc} ${hue})`),
    );
    return `oklch(${l} ${c} ${hue})`;
  });
};

export default function CustomiseSheet() {
  const [theme, setTheme] = useState("energy");
  const [dark, setDark] = useState(false);
  const [tMob, setTMob] = useState("default");
  const [tDesk, setTDesk] = useState("default");
  const [sMob, setSMob] = useState("default");
  const [sDesk, setSDesk] = useState("default");
  const [fBody, setFBody] = useState("default");
  const [fHead, setFHead] = useState("default");
  const [fAccent, setFAccent] = useState("default");
  const [accents, setAccents] = useState<string[]>([]);

  // Hydrate control values from localStorage (client-only; the page itself was
  // already restored pre-paint by the head script).
  useEffect(() => {
    setTheme(lsGet("grade-theme", "energy"));
    setDark(lsGet("grade-mode", "light") === "dark");
    setTMob(lsGet("grade-ts-mobile", "default"));
    setTDesk(lsGet("grade-ts-desktop", "default"));
    setSMob(lsGet("grade-ss-mobile", "default"));
    setSDesk(lsGet("grade-ss-desktop", "default"));
    setFBody(lsGet("grade-font-body", "default"));
    setFHead(lsGet("grade-font-heading", "default"));
    setFAccent(lsGet("grade-font-accent", "default"));
  }, []);

  useEffect(() => { setAttr("data-grade-theme", theme); lsSet("grade-theme", theme); }, [theme]);
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); lsSet("grade-mode", dark ? "dark" : "light"); }, [dark]);
  // Re-derive the accent whenever the palette or light/dark changes — both
  // re-point `--primary`, and the accent rides 60° off its hue. Runs after the
  // theme + dark effects above so it reads the freshly-applied primary.
  useEffect(() => {
    setAccents(deriveAccents());
    // Tell the WebGL shaders to re-read their colours from the now-updated
    // custom properties, so they re-tint live with the palette + mode.
    window.dispatchEvent(new Event("grade:theme-changed"));
  }, [theme, dark]);
  useEffect(() => { setAttr("data-type-scale-mobile", tMob); lsSet("grade-ts-mobile", tMob); }, [tMob]);
  useEffect(() => { setAttr("data-type-scale-desktop", tDesk); lsSet("grade-ts-desktop", tDesk); }, [tDesk]);
  useEffect(() => { setAttr("data-size-scale-mobile", sMob); lsSet("grade-ss-mobile", sMob); }, [sMob]);
  useEffect(() => { setAttr("data-size-scale-desktop", sDesk); lsSet("grade-ss-desktop", sDesk); }, [sDesk]);
  useEffect(() => { setFont(["--font-sans"], fBody); lsSet("grade-font-body", fBody); }, [fBody]);
  useEffect(() => { setFont(["--font-heading", "--font-display"], fHead); lsSet("grade-font-heading", fHead); }, [fHead]);
  useEffect(() => { setFont(["--font-accent"], fAccent); lsSet("grade-font-accent", fAccent); }, [fAccent]);

  const picker = (
    value: string,
    onChange: (v: string) => void,
    opts: [string, string][],
  ) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {opts.map(([v, l]) => (
          <SelectItem key={v} value={v}>
            {l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const field = (label: string, control: React.ReactNode) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {control}
    </div>
  );

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <Sheet modal={false}>
        <SheetTrigger asChild>
          <Button size="sm">Customise</Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          // frosted is now a real DS preset — switch this to surface="frosted"
          // after a `pnpm -F @gradeui/ui build` (the surface→class map is bundled).
          // Until then, glass-strong + the override below renders the same look.
          surface="glass-strong"
          overlayClassName="bg-transparent pointer-events-none"
          onInteractOutside={(e) => e.preventDefault()}
          // Fence the chrome from the page's own customisation: reset the font
          // roles to a neutral stack + pin the spacing, so picking Caveat /
          // expansive for the page never makes the editor illegible. (No
          // data-type-scale fence: any scale would re-pitch — and shrink — the
          // chrome below the default ladder; the controls' small text is
          // already capped, so the inherited default ladder is the right base.)
          data-size-scale="comfortable"
          style={{
            "--font-sans": '"Inter", system-ui, sans-serif',
            "--font-display": '"Inter", system-ui, sans-serif',
            "--font-heading": '"Inter", system-ui, sans-serif',
            "--font-accent": '"Inter", system-ui, sans-serif',
            // the content inherits font-family directly, so reset it outright
            fontFamily: '"Inter", system-ui, sans-serif',
            border: "none",
            backgroundColor: "oklch(var(--card) / 0.92)",
          } as React.CSSProperties}
          className="mx-auto max-w-3xl rounded-t-2xl"
        >
          <SheetHeader>
            <SheetTitle>Customise</SheetTitle>
          </SheetHeader>

          <Tabs defaultValue="theme" className="mt-4 pb-2">
            <TabsList className="grid w-full max-w-sm grid-cols-4">
              <TabsTrigger value="theme" className="text-sm">Theme</TabsTrigger>
              <TabsTrigger value="type" className="text-sm">Type</TabsTrigger>
              <TabsTrigger value="size" className="text-sm">Size</TabsTrigger>
              <TabsTrigger value="font" className="text-sm">Font</TabsTrigger>
            </TabsList>

            <TabsContent value="theme" className="pt-4 min-h-24">
              <div className="flex flex-wrap items-end gap-x-10 gap-y-6">
                {field(
                  "Palette",
                  <SwatchGroup size="md">
                    {THEMES.map(([id, color]) => (
                      <Swatch
                        key={id}
                        color={color}
                        selected={theme === id}
                        aria-label={id}
                        onSelect={() => setTheme(id)}
                      />
                    ))}
                  </SwatchGroup>,
                )}
                {field(
                  "Mode",
                  <ToggleGroup
                    type="single"
                    value={dark ? "dark" : "light"}
                    onValueChange={(v) => v && setDark(v === "dark")}
                    variant="segmented"
                    size="sm"
                  >
                    <ToggleGroupItem value="light">Light</ToggleGroupItem>
                    <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
                  </ToggleGroup>,
                )}
                {field(
                  "Accents",
                  <SwatchGroup size="md">
                    {accents.map((col, i) => (
                      <Swatch key={i} color={col} aria-label={`accent${i + 1}`} />
                    ))}
                  </SwatchGroup>,
                )}
              </div>
            </TabsContent>

            <TabsContent value="type" className="pt-4 min-h-24">
              <div className="grid grid-cols-2 gap-4">
                {field("Mobile scale", picker(tMob, setTMob, SCALES))}
                {field("Desktop scale", picker(tDesk, setTDesk, SCALES))}
              </div>
            </TabsContent>

            <TabsContent value="size" className="pt-4 min-h-24">
              <div className="grid grid-cols-2 gap-4">
                {field("Mobile density", picker(sMob, setSMob, DENSITIES))}
                {field("Desktop density", picker(sDesk, setSDesk, DENSITIES))}
              </div>
            </TabsContent>

            <TabsContent value="font" className="pt-4 min-h-24">
              <div className="grid grid-cols-3 gap-4">
                {field("Body", picker(fBody, setFBody, FONT_OPTS))}
                {field("Heading", picker(fHead, setFHead, FONT_OPTS))}
                {field("Accent", picker(fAccent, setFAccent, FONT_OPTS))}
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </div>
  );
}
