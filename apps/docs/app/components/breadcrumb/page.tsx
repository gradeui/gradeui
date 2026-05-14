import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";

const breadcrumbProps = [
  {
    name: "aria-label",
    type: "string",
    default: '"breadcrumb"',
    description:
      "Accessible label for the <nav> wrapper. Override when the breadcrumb sits inside a region that already has a label.",
  },
  {
    name: "className",
    type: "string",
    default: "-",
    description: "Additional CSS classes applied to the root <nav>.",
  },
];

const linkProps = [
  {
    name: "href",
    type: "string",
    default: "-",
    description:
      "When set, renders as an <a>. When unset, renders as a <button> for in-app click handlers. asChild wraps a custom element instead.",
  },
  {
    name: "asChild",
    type: "boolean",
    default: "false",
    description:
      "Render the link as the child element via Slot — pair with Next.js Link or any custom router link.",
  },
];

const TWO_LEVEL_CODE = `<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Settings</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`;

const DEEP_PATH_CODE = `<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbEllipsis />
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/projects/acme">Acme</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Billing</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`;

export default function BreadcrumbDocsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
          Breadcrumb
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          A composable, surface-less navigation primitive for showing the
          hierarchical path back to the top of a screen — Dashboard →
          Settings → current page.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Examples
        </h2>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Two-level path</h3>
          <ComponentPreview code={TWO_LEVEL_CODE}>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Settings</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ComponentPreview>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">
            Deep path with collapsed middle
          </h3>
          <ComponentPreview code={DEEP_PATH_CODE}>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbEllipsis />
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/projects/acme">Acme</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Billing</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ComponentPreview>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Props
        </h2>
        <div className="space-y-2">
          <h3 className="text-base font-medium">Breadcrumb</h3>
          <PropsTable props={breadcrumbProps} />
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-medium">BreadcrumbLink</h3>
          <PropsTable props={linkProps} />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Accessibility
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>
            Root renders a{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-sm">
              &lt;nav aria-label=&quot;breadcrumb&quot;&gt;
            </code>
          </li>
          <li>
            BreadcrumbList renders an ordered{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-sm">
              &lt;ol&gt;
            </code>{" "}
            so the path order is meaningful to assistive tech
          </li>
          <li>
            BreadcrumbPage marks the current page with{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-sm">
              aria-current=&quot;page&quot;
            </code>{" "}
            and is not interactive
          </li>
          <li>BreadcrumbSeparator is decorative — hidden from the accessibility tree</li>
        </ul>
      </div>

      <SidecarBlock slug="breadcrumb" />

      <ComponentNav currentHref="/components/breadcrumb" />
    </div>
  );
}
