"use client";

import Link from "next/link";
import { useDemo } from "@/lib/demo";
import { PERSONAS } from "@/lib/personas";
import { LOOK_PRESETS } from "@brightlocal/proposal-shell";
import { Button } from "@brightlocal/ui-components/button";
import { RadioGroup, RadioGroupItem } from "@brightlocal/ui-components/radio-group";
import { Label } from "@brightlocal/ui-components/label";

const LOOK_LABELS: Record<string, string> = {
  "live-site": "Live Site (DS default)",
  "subtle-depth": "Subtle Depth",
  "heavy-depth": "Heavy Depth",
  authored: "As authored per screen",
};

/** The long-form version of the Cmd+K menu, for when a reviewer wants to
 *  read the options rather than search them. */
export default function SettingsPage() {
  const { settings, setPersona, setLook, setEngine } = useDemo();
  const looks = [...Object.keys(LOOK_PRESETS), "authored"];
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm">
          <Link href="/" className="hover:underline">Demo home</Link>
        </p>
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>Demo settings</h1>
        <p className="text-muted-foreground">
          These settings stick in this browser. Cmd K opens the same options anywhere, and Alt T on
          any screen opens the layout tweaker for finer control.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Persona</h2>
        <RadioGroup dataHook="settings-persona" value={settings.personaId} onValueChange={setPersona}>
          {PERSONAS.map((p) => (
            <div key={p.id} className="flex items-start gap-3">
              <RadioGroupItem value={p.id} id={`persona-${p.id}`} className="mt-1" />
              <Label htmlFor={`persona-${p.id}`} className="flex flex-col gap-0.5">
                <span>{p.label}</span>
                <span className="text-muted-foreground text-sm font-normal">{p.description}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Layout engine</h2>
        <p className="text-muted-foreground text-sm">
          De facto is the design system's GlobalLayout, sidebar and page header exactly as shipped
          in 2.27.0, nothing overridden. De facto plus proposed fixes is the same layout with the
          token changes on the proposed-changes page applied (white bordered cards, the content
          width cap, the sidebar width). Modified is the proposal shell built on top of the DS:
          padding cancelled, sidebar tones, the sticky band and the tweaker. Every screen renders
          from the same source in all three.
        </p>
        <RadioGroup dataHook="settings-engine" value={settings.engine} onValueChange={(v) => setEngine(v as "modified" | "native" | "native-fixed")}>
          <div className="flex items-center gap-3">
            <RadioGroupItem value="native" id="engine-native" />
            <Label htmlFor="engine-native">De facto GlobalLayout</Label>
          </div>
          <div className="flex items-center gap-3">
            <RadioGroupItem value="native-fixed" id="engine-native-fixed" />
            <Label htmlFor="engine-native-fixed">De facto plus proposed fixes</Label>
          </div>
          <div className="flex items-center gap-3">
            <RadioGroupItem value="modified" id="engine-modified" />
            <Label htmlFor="engine-modified">Modified GlobalLayout</Label>
          </div>
        </RadioGroup>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Layout</h2>
        <RadioGroup dataHook="settings-look" value={settings.look} onValueChange={setLook}>
          {looks.map((l) => (
            <div key={l} className="flex items-center gap-3">
              <RadioGroupItem value={l} id={`look-${l}`} />
              <Label htmlFor={`look-${l}`}>{LOOK_LABELS[l] ?? l}</Label>
            </div>
          ))}
        </RadioGroup>
      </section>

      <div>
        <Button dataHook="settings-go-reviews" variant="primary" asChild>
          <Link href="/reviews">Open the Reviews hub</Link>
        </Button>
      </div>
    </main>
  );
}
