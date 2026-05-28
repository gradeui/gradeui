"use client";
import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import { InstallBlock } from "@/components/install-block";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
} from "lucide-react";

const bannerProps = [
  {
    name: "variant",
    type: '"default" | "info" | "success" | "warning" | "destructive" | "announcement"',
    default: '"default"',
    description:
      "Intent + tonal direction. `announcement` uses a low-alpha primary tint for new-feature messaging; status variants pick up the soft+deep pairs (same pattern as Callout).",
  },
  {
    name: "surface",
    type: '"solid" | "translucent" | "glass" | "glass-strong"',
    default: '"solid"',
    description:
      "Material applied over the variant tint. Reach for `glass` when the banner sits over imagery or a generative backdrop.",
  },
  {
    name: "align",
    type: '"start" | "center" | "between"',
    default: '"between"',
    description:
      "Justify behaviour of the inner flex row. `between` keeps action / dismiss right-aligned; `center` centers a no-action message.",
  },
  {
    name: "sticky",
    type: "boolean",
    default: "false",
    description: "Stick to the top of the scroll container.",
  },
  {
    name: "dismissible",
    type: "boolean",
    default: "false",
    description: "Render the trailing X close button. Pair with `onDismiss`.",
  },
  {
    name: "onDismiss",
    type: "() => void",
    default: "-",
    description: "Called when the user clicks the close button.",
  },
  {
    name: "icon",
    type: "ReactNode",
    default: "-",
    description: "Leading icon slot. Not inferred from variant — pass what fits the message.",
  },
  {
    name: "action",
    type: "ReactNode",
    default: "-",
    description: "Trailing slot before the dismiss button. Usually a Button or a link.",
  },
  {
    name: "role",
    type: '"alert" | "status" | string',
    default: "auto",
    description:
      "Overrides the automatic role mapping (warning/destructive → alert, others → status).",
  },
];

export default function BannerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Banner</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Full-width horizontal strip for system-level state, announcements, and first-run guidance.
        </p>
        <p className="text-sm text-muted-foreground mt-3 max-w-3xl">
          The shape difference from Callout matters: Callout is an inline boxed message inside layout flow; Banner is full-bleed and meant to anchor at the top of a page, panel, or <code className="font-mono">AppShellHeader</code>. Use Banner for things that should stay visible until acknowledged.
        </p>
        <p className="text-sm text-muted-foreground mt-3 max-w-3xl">
          Banner exists because the previous inline-style chrome it replaced referenced{" "}
          <code className="font-mono">--gds-primary</code> / <code className="font-mono">--gds-foreground</code> tokens that don&rsquo;t exist in our system (semantic tokens are unprefixed). The fallback values kicked in and the banner washed out entirely. The primitive makes that category of mistake impossible.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <InstallBlock>{`import { Banner } from "@gradeui/ui"`}</InstallBlock>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <ComponentPreview
          code={`<Banner
  variant="default"
  dismissible
  onDismiss={() => {}}
  action={
    <a href="/plugin" className="text-sm font-medium underline underline-offset-4">
      Get the Grade plugin →
    </a>
  }
>
  Send your design to Figma as live components.
</Banner>`}
        >
          <Banner
            variant="default"
            dismissible
            onDismiss={() => {}}
            action={
              <a href="#" className="text-sm font-medium underline underline-offset-4 hover:opacity-80">
                Get the Grade plugin →
              </a>
            }
            className="w-full"
          >
            Send your design to Figma as live components.
          </Banner>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Variants
        </h2>

        <h3 className="text-lg font-medium">Default — first-run guidance</h3>
        <p className="text-sm text-muted-foreground max-w-3xl">
          The calm muted tint. Use for ambient prompts that should stay visible until the user acknowledges them.
        </p>
        <ComponentPreview
          code={`<Banner variant="default" dismissible onDismiss={...}>
  Welcome back. Three projects have new comments since you were last in.
</Banner>`}
        >
          <Banner variant="default" dismissible onDismiss={() => {}} className="w-full">
            Welcome back. Three projects have new comments since you were last in.
          </Banner>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Announcement — new feature messaging</h3>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Low-alpha primary tint. Brand-coloured enough to feel like news; calm enough not to compete with the page.
        </p>
        <ComponentPreview
          code={`<Banner
  variant="announcement"
  icon={<Sparkles className="h-4 w-4" />}
  dismissible
  onDismiss={...}
  action={<Button size="sm">See how →</Button>}
>
  <strong className="font-medium">New —</strong> Code component lands with diff hero and scroll-triggered reveals.
</Banner>`}
        >
          <Banner
            variant="announcement"
            icon={<Sparkles className="h-4 w-4" />}
            dismissible
            onDismiss={() => {}}
            action={<Button size="sm">See how →</Button>}
            className="w-full"
          >
            <strong className="font-medium">New —</strong> Code component lands with diff hero and scroll-triggered reveals.
          </Banner>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Info — ambient context</h3>
        <ComponentPreview
          code={`<Banner variant="info" icon={<Info className="h-4 w-4" />}>
  You&rsquo;re previewing this from a draft branch.
</Banner>`}
        >
          <Banner
            variant="info"
            icon={<Info className="h-4 w-4" />}
            className="w-full"
          >
            You&rsquo;re previewing this from a draft branch.
          </Banner>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Success — completion / confirmation</h3>
        <ComponentPreview
          code={`<Banner variant="success" icon={<CheckCircle2 className="h-4 w-4" />} dismissible onDismiss={...}>
  Theme published. All 12 screens now use the new tokens.
</Banner>`}
        >
          <Banner
            variant="success"
            icon={<CheckCircle2 className="h-4 w-4" />}
            dismissible
            onDismiss={() => {}}
            className="w-full"
          >
            Theme published. All 12 screens now use the new tokens.
          </Banner>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Warning — degradation / time pressure</h3>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Maps to <code className="font-mono">role=&quot;alert&quot;</code> automatically — screen readers interrupt to announce it.
        </p>
        <ComponentPreview
          code={`<Banner
  variant="warning"
  sticky
  icon={<AlertTriangle className="h-4 w-4" />}
  action={<Button variant="outline" size="sm">Status page</Button>}
>
  We&rsquo;re investigating an incident affecting search. Comments and edits are unaffected.
</Banner>`}
        >
          <Banner
            variant="warning"
            icon={<AlertTriangle className="h-4 w-4" />}
            action={<Button variant="outline" size="sm">Status page</Button>}
            className="w-full"
          >
            We&rsquo;re investigating an incident affecting search. Comments and edits are unaffected.
          </Banner>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Destructive — failure / blocked</h3>
        <ComponentPreview
          code={`<Banner variant="destructive" icon={<AlertTriangle className="h-4 w-4" />} action={<Button size="sm">Retry</Button>}>
  Couldn&rsquo;t reach the theme service. Your changes are saved locally.
</Banner>`}
        >
          <Banner
            variant="destructive"
            icon={<AlertTriangle className="h-4 w-4" />}
            action={<Button size="sm">Retry</Button>}
            className="w-full"
          >
            Couldn&rsquo;t reach the theme service. Your changes are saved locally.
          </Banner>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Surface
        </h2>
        <p className="text-muted-foreground max-w-3xl">
          The surface axis composes on top of the variant tint. Reach for <code className="font-mono">glass</code> when the banner sits over imagery or a generative backdrop.
        </p>

        <h3 className="text-lg font-medium">Glass over an image hero</h3>
        <ComponentPreview
          code={`<div className="relative h-48 rounded-lg overflow-hidden" style={{ backgroundImage: "url(/hero.jpg)", backgroundSize: "cover" }}>
  <Banner surface="glass" sticky align="center" action={<Button size="sm" variant="outline">Watch the launch →</Button>}>
    GradeUI launch week kicks off 14 June.
  </Banner>
</div>`}
        >
          <div
            className="relative h-48 rounded-lg overflow-hidden border border-border w-full"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.55 0.22 258 / 0.3), oklch(0.62 0.18 145 / 0.3)), radial-gradient(circle at 30% 30%, oklch(0.85 0.15 60), oklch(0.4 0.12 280))",
            }}
          >
            <Banner
              surface="glass"
              align="center"
              action={
                <Button size="sm" variant="outline">
                  Watch the launch →
                </Button>
              }
            >
              GradeUI launch week kicks off 14 June.
            </Banner>
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Props
        </h2>
        <PropsTable props={bannerProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Accessibility
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground max-w-3xl">
          <li>
            ARIA role is conditional on variant:{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-sm">role=&quot;alert&quot;</code>{" "}
            (assertive — screen readers interrupt) for <code className="font-mono">warning</code> and{" "}
            <code className="font-mono">destructive</code>; <code className="bg-muted px-1 py-0.5 rounded text-sm">role=&quot;status&quot;</code>{" "}
            (polite — announces after current speech) for the rest. Pass <code className="font-mono">role</code> explicitly to override.
          </li>
          <li>
            The dismiss button is keyboard-focusable with a visible focus ring (<code className="font-mono">focus-visible:ring-2 focus-visible:ring-ring</code>).
          </li>
          <li>
            Pass an icon explicitly when the message&rsquo;s intent should be visually reinforced — icons are NOT inferred from the variant.
          </li>
          <li>
            Colour is never the sole indicator. Always pair tint with copy or an icon that carries the same signal.
          </li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Banner vs Callout vs Toast vs Dialog
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground max-w-3xl">
          <li>
            <strong className="text-foreground">Banner</strong> — full-bleed strip at the top of a page / panel / AppShellHeader. Persistent until dismissed. System-level state, announcements, first-run guidance.
          </li>
          <li>
            <strong className="text-foreground">Callout</strong> — inline boxed message in the layout flow. Form-level validation summaries, in-section notices.
          </li>
          <li>
            <strong className="text-foreground">Toast (Sonner)</strong> — transient floating notification. Auto-dismisses. &ldquo;Saved&rdquo;, &ldquo;Copied&rdquo;, &ldquo;Reverted&rdquo;.
          </li>
          <li>
            <strong className="text-foreground">Dialog</strong> — modal interruption. User must respond before continuing.
          </li>
        </ul>
      </div>

      <SidecarBlock slug="banner" />

      <ComponentNav currentHref="/components/banner" />
    </div>
  );
}
