/**
 * Icon map for studio starter templates.
 *
 * Lives here (in the host app) rather than in `@gradeui/studio/playbook` so
 * the playbook package can stay zero-runtime-dep — no `lucide-react`, no
 * React. The playbook owns the data (id, label, description, prompt); the
 * host app owns how that data gets rendered.
 *
 * Keys MUST match `StudioTemplate.id` values in
 * `@gradeui/studio/playbook`. Missing entries fall back to `FileText` so
 * adding a new template in the playbook won't crash the UI — it just won't
 * have a bespoke icon until we add one here.
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
  Waves,
  LayoutPanelLeft,
  LayoutPanelTop,
  PanelsTopLeft,
} from "lucide-react";

export const STUDIO_TEMPLATE_ICONS: Record<string, LucideIcon> = {
  // App layouts
  "app-side-nav": LayoutPanelLeft,
  "app-top-nav": LayoutPanelTop,
  "app-docs": PanelsTopLeft,
  // Component-focused
  dashboard: LayoutDashboard,
  landing: Globe,
  auth: LogIn,
  settings: Settings,
  pricing: Tags,
  "empty-state": Inbox,
  table: Table2,
  shader: Waves,
  blank: FileText,
};

/** Fallback used when a template id has no entry in the map above. */
export const DEFAULT_TEMPLATE_ICON: LucideIcon = FileText;
