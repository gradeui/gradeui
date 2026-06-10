/**
 * @label       Density Bench
 * @description Spacing/type-scale test bench — toolbar, stat cards, data table, meta strip. Drag density + scale and watch it all move.
 * @tags        density spacing scale typography test bench admin table toolbar cards theme
 * @source      THEME-MIGRATION.md Phase B (at-will theming test surface)
 * @notes       Generated 2026-06-10 as the receipt surface for the Design
 *              System tab's at-will controls. EVERY spacing class here is
 *              scale-reachable (p-*, gap-*, space-y-* — no arbitrary pixel
 *              values) and every text size is a named step (text-2xs…3xl),
 *              so dragging Density re-pitches --spacing and switching to a
 *              modular Scale re-pitches --text-* across the whole screen.
 *              If something does NOT move, it's a contract leak — exactly
 *              what this bench exists to expose.
 */
import {
  Stack,
  Row,
  Grid,
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@gradeui/ui";
import { Search, Filter, Plus, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";

const STATS = [
  { label: "Active accounts", value: "2,841", delta: "+12.4%", up: true },
  { label: "Monthly revenue", value: "$48.2k", delta: "+3.1%", up: true },
  { label: "Open tickets", value: "37", delta: "+9", up: false },
  { label: "Avg. response", value: "1h 12m", delta: "-18m", up: true },
];

const ROWS = [
  { name: "Meridian Labs", status: "Active", value: "$12,400", date: "Jun 02, 2026" },
  { name: "Hollis & Park", status: "Pending", value: "$8,150", date: "Jun 04, 2026" },
  { name: "Bluegate Systems", status: "Active", value: "$21,090", date: "Jun 05, 2026" },
  { name: "Foxglove Studio", status: "Overdue", value: "$3,720", date: "Jun 06, 2026" },
  { name: "Caldera Works", status: "Active", value: "$15,860", date: "Jun 08, 2026" },
  { name: "Northbeam Co.", status: "Pending", value: "$6,300", date: "Jun 09, 2026" },
];

/** Status → tinted badge classes. Uses the -soft/-deep alert-surface pair
 *  so the badges also exercise the status colour tokens. */
function statusClasses(status) {
  if (status === "Active") return "bg-success-soft text-success-deep";
  if (status === "Pending") return "bg-warning-soft text-warning-deep";
  return "bg-destructive-soft text-destructive-deep";
}

export default function App() {
  return (
    <div className="min-h-screen bg-background p-6">
      <Stack gap={6} className="mx-auto max-w-5xl">
        {/* ── Page header — top of the type ladder (text-3xl → text-sm) ── */}
        <Stack gap={1}>
          {/* No hardcoded font-weight — naked headings read
              var(--font-heading-weight) from the theme, so the Design
              System tab's Heading weight control actually moves this.
              (Hardcoded font-semibold would freeze it — the Phase C
              "theme-unreachable absolutes" leak.) */}
          <h1 className="text-3xl tracking-tight text-foreground">
            Accounts overview
          </h1>
          <p className="text-sm text-muted-foreground">
            A spacing-heavy bench: drag Density and Scale in the Design
            System tab — every gap, pad and size on this screen should move.
          </p>
        </Stack>

        {/* ── Toolbar — search + filters + primary action ── */}
        <Row gap={2} align="center" className="rounded-lg border border-border bg-card p-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search accounts…" className="pl-8" />
          </div>
          <Button variant="outline" size="sm">
            <Filter />
            Status
          </Button>
          <Button variant="outline" size="sm">
            <Clock />
            Last 30 days
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button size="sm">
            <Plus />
            New account
          </Button>
        </Row>

        {/* ── Stat cards — number + label + status-coloured delta ── */}
        <Grid cols={4} gap={4}>
          {STATS.map((s) => (
            <Card key={s.label}>
              <CardContent className="space-y-1 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {s.label}
                </p>
                <Row gap={2} align="center">
                  <span className="text-2xl font-semibold tabular-nums text-foreground">
                    {s.value}
                  </span>
                  <Badge
                    className={
                      "gap-0.5 text-2xs " +
                      (s.up
                        ? "bg-success-soft text-success-deep"
                        : "bg-warning-soft text-warning-deep")
                    }
                  >
                    {s.up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                    {s.delta}
                  </Badge>
                </Row>
              </CardContent>
            </Card>
          ))}
        </Grid>

        {/* ── Data table — comfortable cell padding (py-3 px-4) so density
              changes read clearly row to row ── */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3 text-xs">Account</TableHead>
                  <TableHead className="px-4 py-3 text-xs">Status</TableHead>
                  <TableHead className="px-4 py-3 text-right text-xs">Value</TableHead>
                  <TableHead className="px-4 py-3 text-right text-xs">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ROWS.map((r) => (
                  <TableRow key={r.name}>
                    <TableCell className="px-4 py-3 text-sm font-medium text-foreground">
                      {r.name}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={"text-2xs " + statusClasses(r.status)}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right text-sm tabular-nums">
                      {r.value}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {r.date}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* ── Meta strip — the LOW end of the ladder (text-2xs/xs) so a
              modular ratio's reciprocal descent (and its 0.625rem floor)
              is visible ── */}
        <Row gap={4} align="center" justify="between" className="rounded-lg border border-border bg-muted/40 px-4 py-2">
          <Row gap={4} align="center">
            <span className="text-2xs uppercase tracking-wider text-muted-foreground">
              6 of 128 accounts
            </span>
            <span className="text-2xs uppercase tracking-wider text-muted-foreground">
              Synced 2 min ago
            </span>
          </Row>
          <Row gap={2} align="center">
            <Button variant="ghost" size="sm" className="text-xs">
              Previous
            </Button>
            <span className="text-xs tabular-nums text-muted-foreground">1 / 22</span>
            <Button variant="ghost" size="sm" className="text-xs">
              Next
            </Button>
          </Row>
        </Row>
      </Stack>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// DS gaps surfaced by this scaffold
// ────────────────────────────────────────────────────────────────────
//
// • Badge status variants — this bench (like most admin scaffolds) wants
//   `<Badge variant="success" />` etc. instead of hand-rolling the
//   bg-<status>-soft/text-<status>-deep pair every time. The tokens
//   exist; the Badge API doesn't surface them. Recurs in every
//   dashboard/table scaffold with a status column.
//
// • StatCard — number + label + delta-direction badge is the third
//   scaffold to hand-roll this exact composition (see crm/dashboard
//   playgrounds). Sketch: <StatCard label value delta trend="up|down" />.
