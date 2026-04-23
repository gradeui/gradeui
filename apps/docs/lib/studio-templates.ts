/**
 * Host-side studio templates — the playbook's pure-data templates joined
 * to their Lucide icons.
 *
 * The playbook (`@gradeui/studio/playbook`) ships the id/label/description/
 * prompt (pure data, zero-runtime-dep). The host app joins each entry to a
 * `LucideIcon` via `studio-template-icons.ts` and exposes the combined shape
 * here for UI consumers (`<EmptyState>`, `<TemplateChips>` in
 * `components/studio/studio-chat.tsx`).
 *
 * If you want to add a template: add the data entry to
 * `packages/studio/src/playbook/templates/index.ts`, then add its icon to
 * `studio-template-icons.ts`. Don't fork the list here.
 */
import type { LucideIcon } from "lucide-react";

import {
  STUDIO_TEMPLATES as PLAYBOOK_TEMPLATES,
  type StudioTemplate as PlaybookTemplate,
} from "@gradeui/studio/playbook";

import {
  STUDIO_TEMPLATE_ICONS,
  DEFAULT_TEMPLATE_ICON,
} from "./studio-template-icons";

/**
 * The playbook's `StudioTemplate` augmented with an `icon` field resolved
 * from the host-side icon map. This is what the studio chat UI expects.
 */
export interface StudioTemplate extends PlaybookTemplate {
  icon: LucideIcon;
}

export const STUDIO_TEMPLATES: StudioTemplate[] = PLAYBOOK_TEMPLATES.map(
  (t) => ({
    ...t,
    icon: STUDIO_TEMPLATE_ICONS[t.id] ?? DEFAULT_TEMPLATE_ICON,
  }),
);
