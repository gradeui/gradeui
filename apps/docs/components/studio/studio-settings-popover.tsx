"use client";

/**
 * StudioSettingsPopover — gear-icon popover hosting dev-only and
 * session-level toggles that would otherwise crowd the chrome row.
 *
 * v1 hosts:
 *
 *   - Renderer: Fast vs Sandpack. The fast renderer is the default;
 *     Sandpack is the legacy path kept around for comparison while
 *     the renderer rollout finishes. The toggle currently affects
 *     StudioCanvas — see the renderer-rollout step 5 note in
 *     `app/studio/page.tsx`.
 *   - User Tier: Free / Pro / Enterprise. Placeholder for
 *     visibility-gated chrome (per-client export paths, npm install
 *     hint visibility, etc.) — no consumer yet, but the state lives
 *     here so the day the gated UI lands the toggle's already wired.
 *
 * The popover is intentionally small — under 280px wide. Any
 * setting that needs more real estate (a long select list, a colour
 * picker) belongs on its own page or modal, not stuffed in here.
 */

import * as React from "react";
import { Settings as SettingsIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type RendererMode = "fast" | "sandpack";
export type UserTier = "free" | "pro" | "enterprise";

export interface StudioSettingsPopoverProps {
  rendererMode: RendererMode;
  onRendererModeChange: (mode: RendererMode) => void;
  userTier: UserTier;
  onUserTierChange: (tier: UserTier) => void;
  className?: string;
}

export function StudioSettingsPopover({
  rendererMode,
  onRendererModeChange,
  userTier,
  onUserTierChange,
  className,
}: StudioSettingsPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 w-8 p-0", className)}
          aria-label="Studio settings"
          title="Studio settings"
        >
          <SettingsIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-64 p-2"
      >
        <div className="px-2 py-1.5 mb-1">
          <div className="text-xs font-medium text-foreground">
            Studio settings
          </div>
          <div className="text-[11px] text-muted-foreground/80">
            Dev toggles for this session only.
          </div>
        </div>

        <SettingsSection label="Renderer">
          <SettingsSegmented
            value={rendererMode}
            onChange={onRendererModeChange}
            options={[
              {
                value: "fast",
                label: "Fast",
                description:
                  "Same-document compile, no bundler. Default.",
              },
              {
                value: "sandpack",
                label: "Sandpack",
                description:
                  "Iframe + bundler. Legacy renderer.",
              },
            ]}
          />
        </SettingsSection>

        <SettingsSection label="User tier">
          <SettingsSegmented
            value={userTier}
            onChange={onUserTierChange}
            options={[
              {
                value: "free",
                label: "Free",
                description:
                  "Default. Public components, no per-client paths.",
              },
              {
                value: "pro",
                label: "Pro",
                description:
                  "Includes @gradeui/pro components when shipped.",
              },
              {
                value: "enterprise",
                label: "Enterprise",
                description:
                  "Per-client packages + export paths.",
              },
            ]}
          />
        </SettingsSection>
      </PopoverContent>
    </Popover>
  );
}

function SettingsSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-2 py-1.5 space-y-1.5">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function SettingsSegmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; description?: string }[];
}) {
  const activeDescription = options.find((o) => o.value === value)?.description;
  return (
    <div className="space-y-1">
      <div className="flex w-full rounded-md border border-border overflow-hidden bg-background">
        {options.map((o, i) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 px-2 py-1 text-[11px] capitalize transition-colors",
              i > 0 && "border-l border-border",
              value === o.value
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/50",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      {activeDescription && (
        <p className="text-[10px] text-muted-foreground/70 leading-snug">
          {activeDescription}
        </p>
      )}
    </div>
  );
}
