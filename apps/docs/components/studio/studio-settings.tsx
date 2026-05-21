"use client";

/**
 * StudioSettings — the global, session-level settings Sheet for Studio.
 *
 * Opens from the gear button in the topbar (or, eventually, the
 * left app rail). Absorbs every chrome control that used to live
 * inline in the topbar — model + provider picker, theme + mode
 * toggles, dev toggles — plus a new section for AI Chat behaviour
 * (the per-turn usage / refs / actions strips, and the assistant-
 * bubble style). Versions move into the footer.
 *
 * The contextual selection inspector (`SelectionInspector`, formerly
 * `StudioSettingsPanel`) is a different surface — it shows props of
 * the element currently selected in the preview. Studio renders that
 * inline above the chat composer when something is selected. The
 * two never overlap in scope.
 *
 * Controlled component: parent owns `open` + every value/setter,
 * which means the Sheet has no internal state and the same toggle
 * values flow through Studio's component tree (StudioChat → AIChat).
 */

import { Settings as SettingsIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProviderPicker } from "@/components/ai-elements/provider-picker";
import { GradeThemeSwitcher } from "@/components/grade-theme-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import type { ChatSettings } from "@/components/ai-elements/provider-picker";

// ---------------------------------------------------------------------
// Public API

/**
 * Session-only dev toggles. Defined here (previously in
 * `studio-settings-popover.tsx`, now deleted) so this file is the
 * single home for everything the settings sheet controls.
 */
export type RendererMode = "fast" | "sandpack";
export type UserTier = "free" | "pro" | "enterprise";


export interface StudioSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // Model & provider — same shape as the existing ProviderPicker
  // expects, so the topbar move-over is a literal forward.
  settings: ChatSettings;
  onSettingsChange: (update: Partial<ChatSettings>) => void;

  // Developer — session-only dev toggles. Previously inside the
  // gear popover; the popover goes away with this sheet.
  rendererMode: RendererMode;
  onRendererModeChange: (mode: RendererMode) => void;
  userTier: UserTier;
  onUserTierChange: (tier: UserTier) => void;

  // AI Chat — new section. These toggles flow down to <AIChat>
  // via <StudioChat>. Defaults are owned by the parent so a refresh
  // re-applies the last chosen state (when persistence lands).
  showUsage: boolean;
  onShowUsageChange: (next: boolean) => void;
  showRefs: boolean;
  onShowRefsChange: (next: boolean) => void;
  showActions: boolean;
  onShowActionsChange: (next: boolean) => void;
  showThinking: boolean;
  onShowThinkingChange: (next: boolean) => void;
  showSteps: boolean;
  onShowStepsChange: (next: boolean) => void;
  showDuration: boolean;
  onShowDurationChange: (next: boolean) => void;
  /** When OFF (the default), the chat holds the response until the
   *  preview is ready and reveals it in one snap. When ON, response
   *  text streams in token-by-token as it arrives. */
  streamResponseText: boolean;
  onStreamResponseTextChange: (next: boolean) => void;
  assistantBubble: boolean;
  onAssistantBubbleChange: (next: boolean) => void;

  // Versions — render at the bottom of the sheet. Passed in rather
  // than imported here so this file stays decoupled from the
  // versions module's path.
  gradeUiVersion?: string;
  studioVersion?: string;
}

/**
 * A small icon button that triggers the settings sheet. Exposed so
 * the topbar (or any other host) doesn't have to know that the
 * sheet exists internally — just render `<StudioSettingsTrigger />`
 * with an `onClick` that flips the parent's `open` state.
 */
export function StudioSettingsTrigger({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={className}
      aria-label="Studio settings"
      title="Studio settings"
    >
      <SettingsIcon className="h-4 w-4" />
    </Button>
  );
}

// ---------------------------------------------------------------------
// StudioSettings

export function StudioSettings({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
  rendererMode,
  onRendererModeChange,
  userTier,
  onUserTierChange,
  showUsage,
  onShowUsageChange,
  showRefs,
  onShowRefsChange,
  showActions,
  onShowActionsChange,
  showThinking,
  onShowThinkingChange,
  showSteps,
  onShowStepsChange,
  showDuration,
  onShowDurationChange,
  streamResponseText,
  onStreamResponseTextChange,
  assistantBubble,
  onAssistantBubbleChange,
  gradeUiVersion,
  studioVersion,
}: StudioSettingsProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col gap-0 p-0"
      >
        <SheetHeader className="px-6 py-4 border-b border-border">
          <SheetTitle>Studio settings</SheetTitle>
          <SheetDescription>
            Session-level controls. Changes apply immediately.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-8">
          <Section
            title="Model & provider"
            description="Choose which model handles chat turns and (optionally) drop in your own API key."
          >
            <ProviderPicker
              settings={settings}
              onChange={onSettingsChange}
            />
          </Section>

          <Section
            title="Theme"
            description="Switch between Grade themes and flip light / dark mode."
          >
            <div className="flex flex-wrap items-center gap-2">
              <GradeThemeSwitcher />
              <ThemeToggle />
            </div>
          </Section>

          <Section
            title="AI chat"
            description="What the chat panel shows alongside each turn. Off-by-default values keep the canned look; turn them on while you're iterating to see what the model spent and what reference material it pulled in."
          >
            <ToggleField
              id="settings-show-usage"
              label="Show token usage per turn"
              hint="Renders a 'X in · Y out (total)' strip beneath each assistant message."
              checked={showUsage}
              onCheckedChange={onShowUsageChange}
            />
            <ToggleField
              id="settings-show-refs"
              label="Show component refs per turn"
              hint="Lists the component .md files the assistant pulled into context for the turn."
              checked={showRefs}
              onCheckedChange={onShowRefsChange}
            />
            <ToggleField
              id="settings-show-actions"
              label="Show per-turn actions"
              hint="Chips like 'Rendered in preview →' inside assistant messages."
              checked={showActions}
              onCheckedChange={onShowActionsChange}
            />
            <ToggleField
              id="settings-show-thinking"
              label="Show thinking"
              hint="When the model emits reasoning (Claude with extended thinking, o-series, DeepSeek R1, etc.), render a collapsible 'Thoughts' panel above the assistant prose. Off-emission models simply won't show a panel."
              checked={showThinking}
              onCheckedChange={onShowThinkingChange}
            />
            <ToggleField
              id="settings-show-steps"
              label="Show step timeline"
              hint="Render the assistant's pipeline as a collapsible step list — current step shown inline, click to expand the full timeline. Only appears when the server emits step events for the turn."
              checked={showSteps}
              onCheckedChange={onShowStepsChange}
            />
            <ToggleField
              id="settings-show-duration"
              label="Show turn duration"
              hint="Render the per-turn wall-clock time (e.g. '2.3s') below each assistant message. The topbar already shows a live counter while generating."
              checked={showDuration}
              onCheckedChange={onShowDurationChange}
            />
            <ToggleField
              id="settings-stream-response-text"
              label="Stream response text"
              hint="When off (the default), the chat holds the response until the preview is ready and reveals it in one snap — feels more coherent. Turn on to see tokens stream in as they arrive."
              checked={streamResponseText}
              onCheckedChange={onStreamResponseTextChange}
            />
            <ToggleField
              id="settings-assistant-bubble"
              label="Bubble assistant messages"
              hint="When off, assistant text sits on the chat surface with no background or padding — Claude.ai-style."
              checked={assistantBubble}
              onCheckedChange={onAssistantBubbleChange}
            />
          </Section>

          <Section
            title="Developer"
            description="Session-only toggles. Useful while we're rolling out replacements; not persisted."
          >
            <SelectField
              id="settings-renderer"
              label="Renderer"
              hint="Fast = same-document compile. Sandpack = legacy iframe + bundler."
              value={rendererMode}
              onValueChange={(v) =>
                onRendererModeChange(v as RendererMode)
              }
              options={[
                { value: "fast", label: "Fast (default)" },
                { value: "sandpack", label: "Sandpack (legacy)" },
              ]}
            />
            <SelectField
              id="settings-tier"
              label="User tier"
              hint="Gates the visibility of pro / per-client components. No consumer yet — the toggle's wired so gating can land without UI churn."
              value={userTier}
              onValueChange={(v) => onUserTierChange(v as UserTier)}
              options={[
                { value: "free", label: "Free" },
                { value: "pro", label: "Pro" },
                { value: "enterprise", label: "Enterprise" },
              ]}
            />
          </Section>
        </div>

        {(gradeUiVersion || studioVersion) && (
          <SheetFooter className="px-6 py-3 border-t border-border">
            <p className="text-[11px] text-muted-foreground font-mono leading-tight flex flex-wrap items-center gap-x-2 gap-y-1">
              {gradeUiVersion && <span>@gradeui/ui v{gradeUiVersion}</span>}
              {gradeUiVersion && studioVersion && (
                <span className="opacity-50" aria-hidden>
                  ·
                </span>
              )}
              {studioVersion && (
                <span>@gradeui/studio v{studioVersion}</span>
              )}
            </p>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------
// Section helpers — small, internal, DS-primitive-only. Kept private
// to this file so the public Sheet shape stays tight.

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground leading-snug mt-1">
            {description}
          </p>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function ToggleField({
  id,
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="mt-0.5 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
          {label}
        </Label>
        {hint && (
          <p className="text-xs text-muted-foreground leading-snug mt-0.5">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

function SelectField({
  id,
  label,
  hint,
  value,
  onValueChange,
  options,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onValueChange: (next: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint && (
        <p className="text-xs text-muted-foreground leading-snug">{hint}</p>
      )}
    </div>
  );
}
