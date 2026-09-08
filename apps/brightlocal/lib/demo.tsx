"use client";

/**
 * DemoProvider: the one provider every layout sits inside. It owns the
 * demo settings (persona, look preset) and pushes them into the proposal
 * module's own seams, so promoted screens need no edits:
 *
 *   persona.dataset  -> selectSessionDataset() (the shell reads it on mount)
 *   persona.look     -> window.__gdsShellLook   (seeds the shell's tweaks)
 *   tweak scope      -> window.__gdsTweakScope  ("app": tweaks follow you)
 *
 * Settings persist in localStorage under grade-bl-demo, and ?persona=<id>
 * on any URL selects one for a link. Cmd/Ctrl+K opens the command menu
 * (components/demo-settings.tsx); Alt+T is the shell's own layout tweaker.
 */

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PERSONAS, DEFAULT_PERSONA_ID, personaById, type Persona } from "@/lib/personas";
import { selectSessionDataset, LOOK_PRESETS } from "@brightlocal/proposal-shell";

// v2 (8 Sep): the default look moved to "authored"; a new key so browsers that
// stored the old seeded default pick the new one up.
const STORAGE_KEY = "grade-bl-demo-v2";

export interface DemoSettings {
  personaId: string;
  /** Look preset name, or "authored" to leave each screen as written. */
  look: string;
  /** Chosen layout option per base route (see components/option-switch). */
  variants: Record<string, string>;
  /** "native": the DS GlobalLayout, sidebar and page header exactly as
   *  shipped, nothing overridden. "native-fixed": the same with the
   *  proposed token fixes from app/custom.css. "modified": the proposal
   *  shell. */
  engine: "modified" | "native" | "native-fixed";
}

interface DemoContextValue {
  settings: DemoSettings;
  persona: Persona;
  setPersona: (id: string) => void;
  setLook: (look: string) => void;
  setVariant: (base: string, slug: string) => void;
  setEngine: (engine: DemoSettings["engine"]) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  notesOpen: boolean;
  setNotesOpen: (open: boolean) => void;
  /** Bumps whenever a setting changes; layouts key their subtree on it
   *  so every shell remounts and re-reads the seams. */
  epoch: number;
}

const DemoContext = React.createContext<DemoContextValue | null>(null);

declare global {
  interface Window {
    __gdsShellLook?: string | null;
    __gdsTweakScope?: string | null;
    __gdsLayoutEngine?: string | null;
  }
}

function readStored(): DemoSettings | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DemoSettings) : null;
  } catch {
    return null;
  }
}

function applySeams(settings: DemoSettings) {
  const persona = personaById(settings.personaId);
  window.__gdsTweakScope = "app";
  window.__gdsLayoutEngine = settings.engine;
  window.__gdsShellLook = settings.look === "authored" ? null : settings.look;
  selectSessionDataset(persona.dataset);
  // A previously tweaked look would otherwise beat the persona's: the
  // shell reads its session stash before the host seed.
  if (settings.look !== "authored") {
    try {
      window.sessionStorage.removeItem("bl-proposal-session-tweaks:app");
    } catch {}
  }
}

function DemoProviderInner({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const urlPersona = params.get("persona");
  const [settings, setSettings] = React.useState<DemoSettings>({
    personaId: DEFAULT_PERSONA_ID,
    look: "authored",
    variants: {},
    engine: "modified",
  });
  const [epoch, setEpoch] = React.useState(0);
  const [ready, setReady] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [notesOpen, setNotesOpen] = React.useState(false);

  // First mount: stored settings, then the URL persona on top.
  React.useEffect(() => {
    const stored = readStored();
    const next: DemoSettings = {
      personaId: DEFAULT_PERSONA_ID,
      look: "authored",
      variants: {},
      engine: "modified",
      ...(stored ?? {}),
    };
    if (urlPersona && PERSONAS.some((p) => p.id === urlPersona)) next.personaId = urlPersona;
    // ?engine=native|modified and ?look=<preset|authored> on any link
    // (Ali, 9 Sep: "I might also want it as a get param"). They set the
    // stored setting, so the choice sticks after the param is gone.
    const urlEngine = params.get("engine");
    if (urlEngine === "native" || urlEngine === "native-fixed" || urlEngine === "modified") next.engine = urlEngine;
    const urlLook = params.get("look");
    if (urlLook && (urlLook === "authored" || (LOOK_PRESETS as Record<string, unknown>)[urlLook])) next.look = urlLook;
    if (next.look !== "authored" && !(LOOK_PRESETS as Record<string, unknown>)[next.look]) next.look = "authored";
    applySeams(next);
    setSettings(next);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = React.useCallback((patch: Partial<DemoSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      applySeams(next);
      return next;
    });
    setEpoch((n) => n + 1);
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setMenuOpen((o) => !o);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ".") {
        e.preventDefault();
        setNotesOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = React.useMemo<DemoContextValue>(
    () => ({
      settings,
      persona: personaById(settings.personaId),
      setPersona: (id) => {
        update({ personaId: id });
        // The URL carries the location; a persona is a location, so the
        // page follows it (same relative path, the persona's location).
        const m = pathname.match(/^\/locations\/[^/]+(.*)$/);
        if (m) router.replace(`/locations/${personaById(id).dataset}${m[1]}`);
      },
      setLook: (look) => update({ look }),
      setEngine: (engine) => update({ engine }),
      setVariant: (base, slug) =>
        setSettings((prev) => {
          const next = { ...prev, variants: { ...prev.variants, [base]: slug } };
          try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          } catch {}
          return next;
        }),
      menuOpen,
      setMenuOpen,
      notesOpen,
      setNotesOpen,
      epoch,
    }),
    [settings, update, menuOpen, notesOpen, epoch, pathname, router],
  );

  // Shells read the seams at mount, so nothing renders until they are set.
  if (!ready) return null;
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense fallback={null}>
      <DemoProviderInner>{children}</DemoProviderInner>
    </React.Suspense>
  );
}

export function useDemo(): DemoContextValue {
  const ctx = React.useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside DemoProvider");
  return ctx;
}

/** The current persona. Screens branch on accountType / engagement. */
export function usePersona(): Persona {
  return useDemo().persona;
}
