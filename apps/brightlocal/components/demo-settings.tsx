"use client";

/**
 * The demo command menu (Cmd/Ctrl+K): persona, look preset, screens and
 * their variants, and the settings page. Built on the DS's own Command
 * inside a Dialog so it looks like product, not prototype chrome.
 */

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@brightlocal/ui-components/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@brightlocal/ui-components/command";
import { Check } from "@brightlocal/icons";
import { useDemo } from "@/lib/demo";
import { PERSONAS } from "@/lib/personas";
import { SCREENS, hrefFor, locationFromPath, relativePath } from "@/lib/screens";
import { LOOK_PRESETS } from "@brightlocal/proposal-shell";

const ENGINE_LABELS = {
  native: "De facto GlobalLayout (DS as shipped)",
  "native-fixed": "De facto plus proposed fixes",
  modified: "Modified GlobalLayout (proposal shell)",
} as const;

const LOOK_LABELS: Record<string, string> = {
  "live-site": "Live Site (DS default)",
  "subtle-depth": "Subtle Depth",
  "heavy-depth": "Heavy Depth",
  authored: "As authored per screen",
};

export function DemoSettingsPanel() {
  const { menuOpen, setMenuOpen, setNotesOpen, settings, persona, setPersona, setLook, setVariant, setEngine } = useDemo();
  const router = useRouter();
  const pathname = usePathname();
  const location = locationFromPath(pathname) ?? persona.dataset;
  const rel = relativePath(pathname);
  const go = (href: string) => {
    setMenuOpen(false);
    router.push(href);
  };
  const looks = [...Object.keys(LOOK_PRESETS), "authored"];
  const primary = SCREENS.filter((s) => !s.variantOf);
  const variants = SCREENS.filter((s) => s.variantOf);

  return (
    <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
      <DialogContent dataHook="demo-menu" className="overflow-hidden p-0 sm:max-w-lg">
        <DialogTitle className="sr-only">Demo settings</DialogTitle>
        <Command className="rounded-lg">
          <CommandInput dataHook="demo-command-input" placeholder="Persona, look, screen..." />
          <CommandList className="max-h-[70vh]">
            <CommandEmpty>Nothing matches.</CommandEmpty>
            <CommandGroup heading="Persona">
              {PERSONAS.map((p) => (
                <CommandItem
                  key={p.id}
                  dataHook={`demo-persona-${p.id}`}
                  value={`persona ${p.label} ${p.description}`}
                  onSelect={() => {
                    setPersona(p.id);
                    setMenuOpen(false);
                  }}
                >
                  <span className="flex min-w-0 flex-col">
                    <span>{p.label}</span>
                    <span className="text-muted-foreground truncate text-xs">{p.description}</span>
                  </span>
                  {settings.personaId === p.id ? <Check className="ml-auto size-4" /> : null}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Layout engine">
              {(["native", "native-fixed", "modified"] as const).map((e) => (
                <CommandItem
                  key={e}
                  dataHook={`demo-engine-${e}`}
                  value={`engine ${ENGINE_LABELS[e]}`}
                  onSelect={() => {
                    setEngine(e);
                    setMenuOpen(false);
                  }}
                >
                  {ENGINE_LABELS[e]}
                  {settings.engine === e ? <Check className="ml-auto size-4" /> : null}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Layout">
              {looks.map((l) => (
                <CommandItem
                  key={l}
                  dataHook={`demo-look-${l}`}
                  value={`look ${LOOK_LABELS[l] ?? l}`}
                  onSelect={() => {
                    setLook(l);
                    setMenuOpen(false);
                  }}
                >
                  {LOOK_LABELS[l] ?? l}
                  {settings.look === l ? <Check className="ml-auto size-4" /> : null}
                </CommandItem>
              ))}
              <CommandItem
                dataHook="demo-look-tweaker"
                value="layout tweaker fine tune"
                onSelect={() => {
                  setMenuOpen(false);
                  window.dispatchEvent(new KeyboardEvent("keydown", { altKey: true, code: "KeyT", key: "t" }));
                }}
              >
                Fine-tune the layout
                <CommandShortcut>Alt+T</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Screens">
              {primary.map((s) => (
                <CommandItem key={s.path} dataHook={`demo-screen-${s.id}`} value={`screen ${s.label}`} onSelect={() => go(hrefFor(s, location))}>
                  {s.label}
                  {(s.scope === "root" ? pathname === `/${s.path}` : rel === s.path) ? <Check className="ml-auto size-4" /> : null}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Layout options">
              {/* Picking an option makes the BASE route render it, so a
                  flow keeps its URLs whichever option is on. */}
              {primary
                .filter((b) => variants.some((v) => v.variantOf === b.path))
                .flatMap((b) => [
                  { base: b.path, slug: b.path, label: `${b.label}: option A (as promoted)`, id: b.id },
                  ...variants
                    .filter((v) => v.variantOf === b.path)
                    .map((v, i) => ({ base: b.path, slug: v.path, label: `${b.label}: option ${"BCDE"[i] ?? i + 2}, ${v.label}`, id: v.id })),
                ])
                .map((o) => (
                  <CommandItem
                    key={o.slug}
                    dataHook={`demo-option-${o.id}`}
                    value={`option ${o.label}`}
                    onSelect={() => {
                      setVariant(o.base, o.slug);
                      go(hrefFor({ path: o.base, scope: "location" }, location));
                    }}
                  >
                    {o.label}
                    {(settings.variants[o.base] ?? o.base) === o.slug ? <Check className="ml-auto size-4" /> : null}
                  </CommandItem>
                ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="More">
              <CommandItem
                dataHook="demo-notes"
                value="page notes readme markdown"
                onSelect={() => {
                  setMenuOpen(false);
                  setNotesOpen(true);
                }}
              >
                Page notes
                <CommandShortcut>Cmd+.</CommandShortcut>
              </CommandItem>
              <CommandItem dataHook="demo-go-settings" value="settings page" onSelect={() => go("/settings")}>
                Settings page
              </CommandItem>
              <CommandItem dataHook="demo-go-docs" value="documentation proposed components changes" onSelect={() => go("/docs")}>
                Proposed components and changes
              </CommandItem>
              <CommandItem dataHook="demo-go-home" value="home landing" onSelect={() => go("/")}>
                Demo home
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
