/**
 * Starter templates for the Studio launchpad.
 *
 * Each template is a labelled prompt that seeds the chat input when the
 * user is starting a new design. Intentionally prose-only (no JSX scaffold)
 * for now — the model generates the component from scratch. If/when we add
 * hand-written JSX starters, they go alongside the prompt as a second
 * optional field and the launchpad picks one or the other.
 *
 * Keep the list short. A picker is only useful if the user can eye-scan it.
 * Split into two groups: app-layout starters (AppShell-based, for testing
 * scaffold shapes) and component-focused starters (single-screen
 * compositions). If we push past ~12 total, break the picker into a
 * collapsible drawer grouped by category.
 *
 * Icons are NOT declared here — the playbook has a zero-runtime-dep rule,
 * and Lucide is UI. The host app joins templates to icons by `id` via its
 * own small map (see apps/docs/lib/studio-template-icons.ts).
 */

export interface StudioTemplate {
  /** Stable id — used for keys, analytics, and icon lookup in the host. */
  id: string;
  /** Short label for the chip (≤ ~16 chars looks best in a sidebar). */
  label: string;
  /** One-line explanation shown as a tooltip / secondary line. */
  description: string;
  /**
   * The prompt that gets dropped into the chat input. We lean on the
   * system prompt to enforce the code-block / component-list rules, so
   * each entry here is just the design intent — the model handles the
   * rest.
   */
  prompt: string;
}

export const STUDIO_TEMPLATES: readonly StudioTemplate[] = [
  // --- App layouts (AppShell-based) ---
  // These exercise the AppShell/AppShellNav/AppShellMain trio so the
  // generated design has a recognisable, editable scaffold at the root
  // instead of freestyle grids. Side-nav prompts MUST reach for the
  // Sidebar compound (landed May 2026) inside AppShellNav — not a raw
  // Stack of Buttons — so the resulting design is editable through the
  // settings panel and stays consistent across screens. TopMenu isn't
  // Studio-allowlisted yet.
  {
    id: "app-side-nav",
    label: "App (side nav)",
    description: "Dashboard shell with a vertical nav column.",
    prompt:
      "A dashboard-style app shell using <AppShell nav=\"side\"> as the root. Inside <AppShellNav placement=\"side\">, use a Sidebar (compound): <SidebarHeader> shows the product name; <SidebarContent> holds a single <SidebarSection> with five <SidebarItem> rows (Home, Projects, Team, Billing, Settings), each with a leading lucide icon and `active` on the first one; <SidebarFooter> contains a <SidebarItem asButton icon={<LogOut />}>Sign out</SidebarItem>. <AppShellMain> holds a Stack (gap=\"lg\", padded with p-6) containing a Row with a page title and a primary 'New project' Button, then a four-up grid of stat Cards (Users, Revenue, Conversion, Churn — each with a small trend number), and a recent-activity list below. Keep it a single screen.",
  },
  {
    id: "app-top-nav",
    label: "App (top nav)",
    description: "Marketing / settings shell with a top bar.",
    prompt:
      "A page using <AppShell nav=\"top\"> as the root. <AppShellNav placement=\"top\"> contains a Row (justify=\"between\", align=\"center\", padded px-6 py-3) with a product name on the left and a Row of three Ghost Buttons (Docs, Pricing, Changelog) plus a primary 'Sign in' Button on the right. <AppShellMain maxWidth=\"container\"> holds a Stack (gap=\"xl\", py-10): a hero Row with a headline and one-line subhead on the left and an illustrative Card on the right, then a three-column feature grid (three Cards, each with a title, one-sentence blurb, and an arrow Button). Constrain to a single screen of content.",
  },
  {
    id: "app-docs",
    label: "App (docs)",
    description: "Docs site shell — side nav + long-form main.",
    prompt:
      "A documentation site layout using <AppShell nav=\"side\">. Inside <AppShellNav placement=\"side\">, use a Sidebar (compound): <SidebarHeader> with the product name; <SidebarContent> with three <SidebarSection> groups — 'Getting Started' (Introduction, Installation, Quick Start), 'Guides' (Theming, Layouts, Forms), 'Reference' (Components, Tokens) — each rendered as a labelled section containing <SidebarItem asButton>...</SidebarItem> rows. <AppShellMain maxWidth=\"container\"> contains a Stack (gap=\"lg\", py-10): a breadcrumb Row, an h1 page title with a one-line description, a longer body paragraph, a code-style Card showing a usage snippet, and a 'Next / Previous' Row of outline Buttons at the bottom.",
  },
  // --- Component-focused starters ---
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Stat cards + a compact header.",
    prompt:
      "A SaaS dashboard overview: a header with a greeting and a primary action, four stat cards (Revenue, Active Users, Conversion Rate, Churn) with trend indicators, and a short recent-activity list. Keep it a single screen.",
  },
  {
    id: "landing",
    label: "Landing",
    description: "Hero section with a CTA.",
    prompt:
      "A clean product landing hero: bold headline, supporting subheadline, primary and secondary CTA buttons, and a small trust-signal row underneath (logos or a rating badge).",
  },
  {
    id: "auth",
    label: "Sign in",
    description: "Email + password with a remember option.",
    prompt:
      "A centred sign-in card with email and password fields, a 'remember me' checkbox, a primary submit button, and a tertiary link to reset the password. Add a 'Sign in with Google' secondary button above the divider.",
  },
  {
    id: "settings",
    label: "Settings",
    description: "Profile + notification preferences.",
    prompt:
      "A settings panel for a user profile. Two grouped sections: Profile (name, email, bio with a Save button) and Notifications (three toggles for product updates, weekly digest, security alerts).",
  },
  {
    id: "pricing",
    label: "Pricing",
    description: "Three tiers side by side.",
    prompt:
      "A pricing section with three tiers (Starter, Pro, Enterprise). Each card shows price, a short description, a feature bullet list of four items, and a CTA. Highlight the middle tier as 'Most popular'.",
  },
  {
    id: "empty-state",
    label: "Empty state",
    description: "Helpful nudge when there's no data.",
    prompt:
      "An empty-state card for an inbox with no messages. Include an illustrative icon, a friendly headline, a one-line explanation, and a primary 'Compose message' button.",
  },
  {
    id: "table",
    label: "Data table",
    description: "List view with filters and a header.",
    prompt:
      "A compact data table for a customer list: a header row with title, search input, and primary 'Add customer' button, then a five-column table (Name, Email, Plan, Status, Joined) with six example rows. Status should use Badge variants.",
  },
  {
    id: "shader",
    label: "Shader hero",
    description: "Animated WebGL backdrop with a CTA over it.",
    // ThreeScene is a GL primitive in @gradeui/ui. The `palette` prop reads
    // the theme's primary / secondary / accent via CSS vars, so the shader
    // follows whatever hue the builder panel is set to. We seed with the
    // "space" preset + "vhs" post-FX as the most instantly-recognisable
    // pairing — easy to swap out once the user is in the preview.
    prompt:
      "A hero with an animated WebGL backdrop behind a centred headline and CTA. Use <ThreeScene preset=\"space\" postPreset=\"vhs\" aspect=\"landscape\" radius=\"lg\" /> as the background, driven by the current theme palette (pass palette={{ primary: 'var(--primary)', secondary: 'var(--secondary)', accent: 'var(--accent)', background: 'var(--background)' }}). Overlay: a bold 2–3 word headline, a one-line supporting sentence, and a primary CTA Button. Keep the composition to a single screen.",
  },
  {
    id: "blank",
    label: "Blank",
    description: "Just the prompt box — describe it yourself.",
    prompt: "",
  },
];
