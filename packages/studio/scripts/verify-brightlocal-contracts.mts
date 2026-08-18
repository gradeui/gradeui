/**
 * verify-brightlocal-contracts.mts — end-to-end regression test for the
 * BrightLocal contracts, run through the REAL validator.
 *
 *   pnpm -F @gradeui/studio verify:brightlocal-contracts
 *
 * check-registry-contracts.mjs asserts the contract DATA is in sync and
 * structurally sound. This asserts the thing authors actually care about:
 * that JSX which should save, saves — and that JSX which should be caught,
 * still is. Every positive case here is a snippet that `save_screen`
 * rejected before the d.ts rewrite (Aug 2026 reports), including the two
 * the reports name as verification criteria.
 *
 * Contracts are converted here exactly as the two production seams do it
 * (apps/mcp-server/src/registry-contracts.ts and
 * apps/docs/lib/registry-contracts.ts). If you change the conversion,
 * change it in all three or this test stops meaning anything.
 */

import { z } from "zod";
import { validateAgainstContract, formatViolations } from "../src/core/index.js";
import { BRIGHTLOCAL_CONTRACTS } from "../src/registry/brightlocal/contracts.generated.js";
import { BRIGHTLOCAL_REGISTRY } from "../src/registry/index.js";
import {
  renderComponentRefsBlock,
  listComponentRefs,
} from "../src/playbook/components/refs.js";

type ContractsMap = Parameters<typeof validateAgainstContract>[1]["contracts"];
type Contract = ContractsMap[string];

function toContracts(): ContractsMap {
  const out: Record<string, Contract> = {};
  for (const [name, spec] of Object.entries(BRIGHTLOCAL_CONTRACTS)) {
    const props: Record<string, Contract["props"][string]> = {};
    for (const [pn, p] of Object.entries(spec.props)) {
      let schema: z.ZodType<unknown>;
      switch (p.kind) {
        case "enum":
          schema = p.values?.length
            ? z.enum(p.values as [string, ...string[]])
            : z.string();
          break;
        case "boolean": schema = z.boolean(); break;
        case "number": schema = z.number(); break;
        case "unknown": schema = z.unknown(); break;
        default: schema = z.string();
      }
      if (p.optional) schema = schema.optional();
      props[pn] = { schema, design: p.design, description: p.description, default: p.default };
    }
    out[name] = {
      name: spec.name,
      description: spec.description ?? "",
      props,
      variantDefaults: spec.variantDefaults ? { ...spec.variantDefaults } : undefined,
      subcomponents: spec.subcomponents ? [...spec.subcomponents] : undefined,
      element: spec.element,
      subcomponentElements: spec.subcomponentElements ? { ...spec.subcomponentElements } : undefined,
    };
  }
  return out;
}

const contracts = toContracts();

const CASES: Array<[string, string, boolean]> = [
  [
    "doc verification: Tabs",
    `const App = () => (
      <Tabs dataHook="review-tabs" value={tab} onValueChange={setTab}>
        <TabsList dataHook="review-tabs-list">
          <TabsTrigger value="all" dataHook="tab-all">All</TabsTrigger>
        </TabsList>
      </Tabs>
    );`,
    true,
  ],
  [
    "doc verification: Checkbox checked/onCheckedChange",
    `const App = () => <Checkbox dataHook="cb" checked onCheckedChange={() => {}} />;`,
    true,
  ],
  [
    "Button onClick + variant + size",
    `const App = () => <Button dataHook="b" variant="outline" size="sm" onClick={() => {}}>Go</Button>;`,
    true,
  ],
  [
    "DataTable family: pagination + select-all + search take `table`",
    `const App = () => (
      <DataTable table={table} dataHook="dt">
        <DataTableToolbar dataHook="tb">
          <DataTableSearch table={table} placeholder="Search" />
        </DataTableToolbar>
        <DataTableSelectAllCheckbox table={table} dataHook="all" />
        <DataTablePagination table={table} dataHook="pg" showRowCount />
      </DataTable>
    );`,
    true,
  ],
  [
    "Progress takes value/max (doc 2 §5)",
    `const App = () => <Progress dataHook="p" value={62} max={100} indicatorClassName="bg-red-500" />;`,
    true,
  ],
  [
    "Progress `color` — present in 2.25.0 (absent in the 2.20.0 the repo used to pin, which is why doc 2 §5 and the registry disagreed)",
    `const App = () => <Progress dataHook="p" value={62} color="green" />;`,
    true,
  ],
  [
    "NEGATIVE: Progress color is a real enum, so a bogus member is caught",
    `const App = () => <Progress dataHook="p" value={62} color="__x" />;`,
    false,
  ],
  [
    "ChartContainer width as number (doc 2 §4)",
    `const App = () => <ChartContainer dataHook="c" config={cfg} width={190} height="100%" />;`,
    true,
  ],
  [
    "House template: SidebarProvider / GlobalLayoutContentBody dataHook (doc 2 §3)",
    `const App = () => (
      <SidebarProvider dataHook="provider" defaultOpen>
        <GlobalLayoutContentBody dataHook="reviews-page-body">x</GlobalLayoutContentBody>
      </SidebarProvider>
    );`,
    true,
  ],
  [
    "DropdownMenu with checkbox items (doc 2 §2/§3)",
    `const App = () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button dataHook="m">Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuCheckboxItem checked onCheckedChange={() => {}}>Google</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );`,
    true,
  ],
  [
    "Input controlled (doc 2 §2)",
    `const App = () => <Input dataHook="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" />;`,
    true,
  ],
  [
    "Table family on 2.25.0: scrollRegionLabel / layout / minWidth on the root, sizing on cells, onClick on a row",
    `const App = () => (
      <Table dataHook="t" layout="fixed" minWidth="720px" scrollRegionLabel="Reviews">
        <TableHeader dataHook="th">
          <TableRow dataHook="hr">
            <TableHead dataHook="c1" width="40%" minWidth="220px" align="left">Review</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody dataHook="tb">
          <TableRow dataHook="r1" onClick={() => open(1)}>
            <TableCell dataHook="c1" size="lg" align="left">x</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );`,
    true,
  ],
  [
    "DataTable root: stickyHeader / scrollRegionLabel / layout / footer (2.25.0)",
    `const App = () => (
      <DataTable
        table={table}
        dataHook="dt"
        stickyHeader
        layout="fixed"
        minWidth="900px"
        scrollRegionLabel="Reviews"
        isLoading={false}
        skeletonRowCount={8}
        noResultsMessage="Nothing yet"
        footer={<TableFooter dataHook="f" />}
      />
    );`,
    true,
  ],
  [
    "DataTableBulkActions — new in 2.25.0, absent from every earlier contract set",
    `const App = () => (
      <DataTableBulkActions table={table} dataHook="bulk">
        <DataTableBulkActionsSummary dataHook="sum" />
        <DataTableBulkActionsActions dataHook="acts" />
      </DataTableBulkActions>
    );`,
    true,
  ],
  [
    "NEGATIVE: bad variant is still caught",
    `const App = () => <Button dataHook="b" variant="__x">Go</Button>;`,
    false,
  ],
  [
    "NEGATIVE: unknown prop is still caught",
    `const App = () => <Button dataHook="b" __x="canary">Go</Button>;`,
    false,
  ],
  [
    "dataHook is REQUIRED in the contract but design:plumbing, which the validator deliberately exempts from the missing-required check — recorded so a future change to that rule is a visible test flip, not a silent wave of new errors",
    `const App = () => <Checkbox checked />;`,
    true,
  ],
];

let failed = 0;

// ─── The reference block must describe what the validator enforces ────
//
// The cases above test the GATE. These test the thing an author READS
// before hitting the gate — `list_components` / the system prompt's
// component reference. They were two independent descriptions of one API:
// the gate came from the d.ts-extracted contracts, the reference from the
// sidecars (a transform of `component-meta.json`, which documents only the
// props the DS ADDS). So Radix passthrough was enforceable but invisible —
// `<TabsTrigger value>` was REQUIRED by the gate and absent from the
// reference, and `Checkbox.checked` likewise. Authors read "no such prop"
// and hand-rolled components the DS already shipped (Aug 2026 reports).
//
// A reference NARROWER than its gate is the expensive direction of drift,
// so this asserts the invariant directly: every prop the validator would
// REQUIRE is named in the block the author is given. The next component to
// wrap a primitive fails here instead of silently.
function refBlockFor(name: string): string {
  return renderComponentRefsBlock({
    onlyFor: [name],
    style: "compact",
    registry: BRIGHTLOCAL_REGISTRY,
  });
}

const REF_CASES: Array<[string, string, readonly string[]]> = [
  [
    "doc verification: the Tabs reference names TabsTrigger's required `value`",
    "Tabs",
    ["TabsTrigger", "value (REQUIRED)"],
  ],
  [
    "doc verification: the Checkbox reference names checked / onCheckedChange",
    "Checkbox",
    ["checked", "onCheckedChange"],
  ],
];

for (const [label, component, needles] of REF_CASES) {
  const block = refBlockFor(component);
  const missing = needles.filter((n) => !block.includes(n));
  if (missing.length) failed++;
  console.log(
    `${missing.length === 0 ? "PASS" : "FAIL"}  ${label}${missing.length ? ` — missing: ${missing.join(", ")}` : ""}`,
  );
}

// General form of the same invariant, across every sidecar-documented
// component in the registry: a REQUIRED prop the author is never shown is
// a trap, whichever component grows one.
const refs = listComponentRefs(BRIGHTLOCAL_REGISTRY);
const sidecarNames = new Set(refs.map((r) => r.name));
const unnamed: string[] = [];
for (const [name, spec] of Object.entries(BRIGHTLOCAL_CONTRACTS)) {
  const required = Object.entries(spec.props)
    // `children` is content, not an attribute an author spells out — the
    // reference deliberately never lists it.
    .filter(([n, p]) => !p.optional && n !== "children")
    .map(([n]) => n);
  if (!required.length) continue;
  // Only components the reference can actually reach: a block is rendered
  // per SIDECAR, and sub-exports render under their family's root.
  const root = sidecarNames.has(name)
    ? name
    : refs.find((r) => r.subcomponents?.includes(name))?.name;
  if (!root) continue;
  const block = refBlockFor(root);
  for (const prop of required) {
    if (!block.includes(prop)) unnamed.push(`${name}.${prop}`);
  }
}
if (unnamed.length) failed++;
console.log(
  `${unnamed.length === 0 ? "PASS" : "FAIL"}  every REQUIRED contract prop is named in its component's reference block${unnamed.length ? ` — ${unnamed.length} missing: ${unnamed.slice(0, 12).join(", ")}` : ""}`,
);

for (const [label, jsx, shouldPass] of CASES) {
  const report = validateAgainstContract(jsx, { contracts });
  const errors = report.violations.filter((v) => v.severity === "error");
  const passed = errors.length === 0;
  const ok = passed === shouldPass;
  if (!ok) failed++;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${label} — ${errors.length} error(s), ${report.componentsChecked} checked`,
  );
  if (!ok || (!shouldPass && errors.length)) {
    console.log(
      formatViolations(report)
        .split("\n")
        .map((l) => `        ${l}`)
        .join("\n"),
    );
  }
}
console.log(failed === 0 ? "\nALL CASES OK" : `\n${failed} CASE(S) FAILED`);
process.exit(failed === 0 ? 0 : 1);
