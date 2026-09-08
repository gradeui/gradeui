"use client";

/**
 * The Beacon modal: the one place the FULL treatment lives (the AI
 * summary with all its lines and charts, then the plan). Pages show
 * compact strips and open this (Ali, 9 Sep: "display the headline and
 * the content at a smaller size, and the large AI insights in a modal").
 * A tiny context so any strip on any page can open it to a section.
 */

import * as React from "react";

export type BeaconSection = "summary" | "plan";

interface BeaconModalState {
  open: boolean;
  section: BeaconSection;
  show: (section?: BeaconSection) => void;
  close: () => void;
}

const Ctx = React.createContext<BeaconModalState | null>(null);

export function BeaconModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [section, setSection] = React.useState<BeaconSection>("summary");
  const value = React.useMemo<BeaconModalState>(
    () => ({
      open,
      section,
      show: (s = "summary") => {
        setSection(s);
        setOpen(true);
      },
      close: () => setOpen(false),
    }),
    [open, section],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBeaconModal(): BeaconModalState {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useBeaconModal must be used inside BeaconModalProvider");
  return ctx;
}
