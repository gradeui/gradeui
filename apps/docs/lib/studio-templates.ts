/**
 * Starter templates for the /studio chat.
 *
 * Each template is a labelled prompt that seeds the input when the user is
 * starting a new design. Intentionally prose-only (no JSX scaffold) for now —
 * the model generates the component from scratch. If/when we add hand-written
 * JSX starters, this module is the natural place to hang them off.
 *
 * Keep the list short. A picker is only useful if the user can eye-scan it;
 * eight is already near the ceiling for a sidebar-width column. If we need
 * more, group them by category and show a collapsible drawer instead.
 */
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Globe,
  LogIn,
  Settings,
  Tags,
  Inbox,
  Table2,
  FileText,
} from "lucide-react";

export interface StudioTemplate {
  /** Stable id — used for keys and analytics, not shown to the user. */
  id: string;
  /** Short label for the chip (≤ ~16 chars looks best in a sidebar). */
  label: string;
  /** One-line explanation shown as a tooltip / secondary line. */
  description: string;
  /** Lucide icon rendered next to the label. */
  icon: LucideIcon;
  /**
   * The prompt that gets dropped into the chat input. We lean on the system
   * prompt to enforce the code-block / component-list rules, so each entry
   * here is just the design intent — the model handles the rest.
   */
  prompt: string;
}

export const STUDIO_TEMPLATES: StudioTemplate[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Stat cards + a compact header.",
    icon: LayoutDashboard,
    prompt:
      "A SaaS dashboard overview: a header with a greeting and a primary action, four stat cards (Revenue, Active Users, Conversion Rate, Churn) with trend indicators, and a short recent-activity list. Keep it a single screen.",
  },
  {
    id: "landing",
    label: "Landing",
    description: "Hero section with a CTA.",
    icon: Globe,
    prompt:
      "A clean product landing hero: bold headline, supporting subheadline, primary and secondary CTA buttons, and a small trust-signal row underneath (logos or a rating badge).",
  },
  {
    id: "auth",
    label: "Sign in",
    description: "Email + password with a remember option.",
    icon: LogIn,
    prompt:
      "A centred sign-in card with email and password fields, a 'remember me' checkbox, a primary submit button, and a tertiary link to reset the password. Add a 'Sign in with Google' secondary button above the divider.",
  },
  {
    id: "settings",
    label: "Settings",
    description: "Profile + notification preferences.",
    icon: Settings,
    prompt:
      "A settings panel for a user profile. Two grouped sections: Profile (name, email, bio with a Save button) and Notifications (three toggles for product updates, weekly digest, security alerts).",
  },
  {
    id: "pricing",
    label: "Pricing",
    description: "Three tiers side by side.",
    icon: Tags,
    prompt:
      "A pricing section with three tiers (Starter, Pro, Enterprise). Each card shows price, a short description, a feature bullet list of four items, and a CTA. Highlight the middle tier as 'Most popular'.",
  },
  {
    id: "empty-state",
    label: "Empty state",
    description: "Helpful nudge when there's no data.",
    icon: Inbox,
    prompt:
      "An empty-state card for an inbox with no messages. Include an illustrative icon, a friendly headline, a one-line explanation, and a primary 'Compose message' button.",
  },
  {
    id: "table",
    label: "Data table",
    description: "List view with filters and a header.",
    icon: Table2,
    prompt:
      "A compact data table for a customer list: a header row with title, search input, and primary 'Add customer' button, then a five-column table (Name, Email, Plan, Status, Joined) with six example rows. Status should use Badge variants.",
  },
  {
    id: "blank",
    label: "Blank",
    description: "Just the prompt box — describe it yourself.",
    icon: FileText,
    prompt: "",
  },
];
