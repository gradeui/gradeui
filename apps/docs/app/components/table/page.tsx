import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";

const tableProps = [
  {
    name: "className",
    type: "string",
    default: "-",
    description: "Additional CSS classes.",
  },
];

const projects = [
  { id: "PRJ001", name: "Marketing Site", status: "Live", power: "v2.4", today: "1,482 visits" },
  { id: "PRJ002", name: "Mobile App", status: "Live", power: "v1.8", today: "6,210 sessions" },
  { id: "PRJ003", name: "Admin Dashboard", status: "Deploying", power: "v3.1", today: "—" },
  { id: "PRJ004", name: "API Gateway", status: "Live", power: "v0.9", today: "2.1M requests" },
  { id: "PRJ005", name: "Docs Portal", status: "Live", power: "—", today: "—" },
];

const usageData = [
  { date: "2024-01-15", deploys: "8", requests: "2.1M", errors: "14" },
  { date: "2024-01-14", deploys: "5", requests: "1.8M", errors: "21" },
  { date: "2024-01-13", deploys: "12", requests: "2.4M", errors: "6" },
  { date: "2024-01-12", deploys: "3", requests: "1.5M", errors: "38" },
  { date: "2024-01-11", deploys: "9", requests: "2.0M", errors: "11" },
];

export default function TablePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Table</h1>
        <p className="text-lg text-muted-foreground mt-2">
          A responsive table component for displaying tabular data.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@gradeui/ui"`}</code>
          </pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <ComponentPreview
          code={`<Table>
  <TableCaption>A list of your recent projects.</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Device</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Power</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Marketing Site</TableCell>
      <TableCell>Live</TableCell>
      <TableCell className="text-right">v2.4</TableCell>
    </TableRow>
  </TableBody>
</Table>`}
        >
          <Table>
            <TableCaption>A list of your recent projects.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Power</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Marketing Site</TableCell>
                <TableCell>Live</TableCell>
                <TableCell className="text-right">v2.4</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Examples
        </h2>

        <h3 className="text-lg font-medium">Project List</h3>
        <ComponentPreview
          code={`<Table>
  <TableCaption>Your recent projects</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead className="w-[100px]">ID</TableHead>
      <TableHead>Project</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Version</TableHead>
      <TableHead className="text-right">Today</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {projects.map((project) => (
      <TableRow key={project.id}>
        <TableCell className="font-mono">{project.id}</TableCell>
        <TableCell className="font-medium">{project.name}</TableCell>
        <TableCell>
          <Badge variant={project.status === "Live" ? "success" : "secondary"}>
            {project.status}
          </Badge>
        </TableCell>
        <TableCell className="text-right">{project.power}</TableCell>
        <TableCell className="text-right">{project.today}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>`}
        >
          <Table>
            <TableCaption>Your recent projects</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Version</TableHead>
                <TableHead className="text-right">Today</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-mono">{project.id}</TableCell>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>
                    <Badge variant={project.status === "Live" ? "success" : "secondary"}>
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{project.power}</TableCell>
                  <TableCell className="text-right">{project.today}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ComponentPreview>

        <h3 className="text-lg font-medium">With Footer</h3>
        <ComponentPreview
          code={`<Table>
  <TableCaption>Daily activity summary</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Date</TableHead>
      <TableHead className="text-right">Deploys</TableHead>
      <TableHead className="text-right">Requests</TableHead>
      <TableHead className="text-right">Errors</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {usageData.map((row) => (
      <TableRow key={row.date}>
        <TableCell>{row.date}</TableCell>
        <TableCell className="text-right">{row.deploys}</TableCell>
        <TableCell className="text-right">{row.requests}</TableCell>
        <TableCell className="text-right">{row.errors}</TableCell>
      </TableRow>
    ))}
  </TableBody>
  <TableFooter>
    <TableRow>
      <TableCell>Total (5 days)</TableCell>
      <TableCell className="text-right">37</TableCell>
      <TableCell className="text-right">9.8M</TableCell>
      <TableCell className="text-right">90</TableCell>
    </TableRow>
  </TableFooter>
</Table>`}
        >
          <Table>
            <TableCaption>Daily activity summary</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Deploys</TableHead>
                <TableHead className="text-right">Requests</TableHead>
                <TableHead className="text-right">Errors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usageData.map((row) => (
                <TableRow key={row.date}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell className="text-right">{row.deploys}</TableCell>
                  <TableCell className="text-right">{row.requests}</TableCell>
                  <TableCell className="text-right">{row.errors}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell>Total (5 days)</TableCell>
                <TableCell className="text-right">37</TableCell>
                <TableCell className="text-right">9.8M</TableCell>
                <TableCell className="text-right">90</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Simple Table</h3>
        <ComponentPreview
          code={`<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Metric</TableHead>
      <TableHead className="text-right">Value</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Active users</TableCell>
      <TableCell className="text-right font-medium">1,284</TableCell>
    </TableRow>
    <TableRow>
      <TableCell>Today's sessions</TableCell>
      <TableCell className="text-right font-medium">6,210</TableCell>
    </TableRow>
    <TableRow>
      <TableCell>This month</TableCell>
      <TableCell className="text-right font-medium">186,420</TableCell>
    </TableRow>
    <TableRow>
      <TableCell>All-time</TableCell>
      <TableCell className="text-right font-medium">12.4M</TableCell>
    </TableRow>
  </TableBody>
</Table>`}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Active users</TableCell>
                <TableCell className="text-right font-medium">1,284</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Today&apos;s sessions</TableCell>
                <TableCell className="text-right font-medium">6,210</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>This month</TableCell>
                <TableCell className="text-right font-medium">186,420</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>All-time</TableCell>
                <TableCell className="text-right font-medium">12.4M</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Props
        </h2>
        <PropsTable props={tableProps} />
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Accessibility
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Uses native HTML table elements for semantics</li>
          <li>TableCaption provides accessible description</li>
          <li>TableHead cells use proper th elements</li>
          <li>Supports keyboard navigation</li>
          <li>Scrollable container for responsive design</li>
        </ul>
      </div>

      <SidecarBlock slug="table" />

      <ComponentNav currentHref="/components/table" />
    </div>
  );
}
