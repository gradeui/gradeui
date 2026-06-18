import {
  AppShell, AppShellMain,
  Stack, Row,
  Button, Badge,
  Avatar, AvatarFallback,
  Separator, Input, Switch,
  Combobox, MultiSelect,
  DataView, useDataView,
  PropertyList, Card,
} from "@gradeui/ui";
import { useMemo, useState } from "react";
import {
  Activity, BarChart3, Calendar, Users, Tag, Link2, Building2,
  MessageSquare, CircleDollarSign, X, Lock,
} from "lucide-react";

// People are referenced by id everywhere (owner + team), resolved through
// one lookup, so the single-avatar and avatar-stack renderers read from the
// SAME source and can't drift in size or content.
const PEOPLE = {
  eo: { name: "Elena Okafor", initials: "EO" },
  ml: { name: "Marcus Li", initials: "ML" },
  pd: { name: "Priya Devi", initials: "PD" },
  sk: { name: "Samir Khan", initials: "SK" },
  zc: { name: "Zoe Chen", initials: "ZC" },
  ra: { name: "Ruth Adler", initials: "RA" },
  np: { name: "Noah Park", initials: "NP" },
  hs: { name: "Hana Sato", initials: "HS" },
  tv: { name: "Tomas Vega", initials: "TV" },
};

// ── Option pools (shared by the display badges AND the inline editors) ──
const TYPE_OPTIONS = ["Conversion", "Deliverability", "Reliability"].map((v) => ({ value: v, label: v }));
const IMPACT_OPTIONS = ["Open · Not started", "In progress", "Resolved"].map((v) => ({ value: v, label: v }));
const PRIORITY_OPTIONS = ["Low", "Medium", "High"].map((v) => ({ value: v, label: v }));
const TOPIC_OPTIONS = ["Pricing", "Onboarding", "Email", "Lifecycle", "Auth", "Performance", "Billing", "Activation", "Integrations", "Queue"].map((v) => ({ value: v, label: v }));
const BP_OPTIONS = ["Acme", "Kite", "Anvil", "Folio", "Ribbon", "Zen", "Vega", "Kohi"].map((v) => ({ value: v, label: v }));
const PEOPLE_OPTIONS = Object.entries(PEOPLE).map(([value, p]) => ({ value, label: p.name }));

const STATUS_VARIANT = { "Open · Not started": "outline", "In progress": "info-soft", Resolved: "success-soft" };
const PRIORITY_VARIANT = { Low: "secondary", Medium: "warning-soft", High: "destructive-soft" };

// One avatar treatment, used by both the single owner and the team stack.
function UserAvatar({ id, ring }) {
  const p = PEOPLE[id];
  if (!p) return null;
  return (
    <Avatar className={ring ? "h-6 w-6 ring-2 ring-background" : "h-6 w-6"}>
      <AvatarFallback className="text-xs">{p.initials}</AvatarFallback>
    </Avatar>
  );
}

const statusBadge = (s) => <Badge variant={STATUS_VARIANT[s] || "outline"}>{s}</Badge>;
const priorityBadge = (p) => <Badge variant={PRIORITY_VARIANT[p] || "secondary"}><BarChart3 />{p}</Badge>;
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// The schema for the DETAIL panel. `editor` marks which fields can be
// changed in place; the rest are display-only.
const FIELDS = [
  { key: "alertType", label: "Type", type: "select", icon: Tag, editor: "type" },
  { key: "impact", label: "Impact", type: "status", icon: Activity, editor: "impact" },
  { key: "priority", label: "Priority", type: "priority", icon: BarChart3, editor: "priority" },
  { key: "topics", label: "Topics", type: "tags", icon: Tag, editor: "topics" },
  { key: "published", label: "Published", type: "date", icon: Calendar },
  { key: "owner", label: "Owner", type: "user", icon: Users, editor: "owner" },
  { key: "team", label: "Team", type: "users", icon: Users },
  { key: "businessProfiles", label: "Business profiles", type: "relation", icon: Building2, editor: "businessProfiles" },
  { key: "comments", label: "Comments", type: "number", icon: MessageSquare },
  { key: "arr", label: "ARR", type: "currency", icon: CircleDollarSign, editor: "arr" },
  { key: "progress", label: "Progress", type: "percent", icon: BarChart3 },
  { key: "url", label: "Link", type: "url", icon: Link2, editor: "url" },
  { key: "active", label: "Active", type: "boolean", icon: Activity, editor: "active" },
  { key: "summary", label: "Summary", type: "longtext" },
];

// Display renderer for the detail rows + the card tiles.
function renderValue(type, v) {
  switch (type) {
    case "select": return <Badge variant="info-soft">{v}</Badge>;
    case "status": return statusBadge(v);
    case "priority": return priorityBadge(v);
    case "tags": return <Row gap="xs" wrap>{v.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}</Row>;
    case "date": return <span className="tabular-nums text-muted-foreground">{formatDate(v)}</span>;
    case "user": return <Row gap="xs" align="center"><UserAvatar id={v} /><span>{PEOPLE[v]?.name}</span></Row>;
    case "users": return <div className="flex -space-x-2">{v.map((id) => <UserAvatar key={id} id={id} ring />)}</div>;
    case "relation": return <Row gap="xs" wrap>{v.map((b) => <Badge key={b} variant="outline">{b}</Badge>)}</Row>;
    case "number": return <span className="tabular-nums">{v}</span>;
    case "currency": return <span className="tabular-nums">{"$" + v.toLocaleString("en-US")}</span>;
    case "percent": return <span className="tabular-nums">{Math.round(v * 100) + "%"}</span>;
    case "url": return <a href={v} className="text-primary underline-offset-2 hover:underline">{v.replace(/^https?:\/\//, "")}</a>;
    case "boolean": return <Badge variant={v ? "success-soft" : "outline"}>{v ? "Active" : "Inactive"}</Badge>;
    case "longtext": return <span className="text-muted-foreground">{v}</span>;
    default: return <span>{v}</span>;
  }
}

// Editor renderer — the SAME schema, the edit face. Combobox for single-pick
// (the Linear "selectable badge"), MultiSelect for tag groups, Switch / Input
// for the rest.
function renderEditor(kind, item, set) {
  switch (kind) {
    case "type":
      return <Combobox options={TYPE_OPTIONS} value={item.alertType} onValueChange={(v) => set("alertType", v)} />;
    case "impact":
      return <Combobox triggerVariant="inline" hideChevron searchable={false} options={IMPACT_OPTIONS} value={item.impact} onValueChange={(v) => set("impact", v)} renderValue={(opt) => statusBadge(opt.value)} />;
    case "priority":
      return <Combobox triggerVariant="inline" hideChevron searchable={false} options={PRIORITY_OPTIONS} value={item.priority} onValueChange={(v) => set("priority", v)} renderValue={(opt) => priorityBadge(opt.value)} />;
    case "topics":
      return <MultiSelect options={TOPIC_OPTIONS} value={item.topics} onValueChange={(v) => set("topics", v)} />;
    case "owner":
      return <Combobox options={PEOPLE_OPTIONS} value={item.owner} onValueChange={(v) => set("owner", v)} />;
    case "businessProfiles":
      return <MultiSelect options={BP_OPTIONS} value={item.businessProfiles} onValueChange={(v) => set("businessProfiles", v)} />;
    case "active":
      return <Switch checked={item.active} onCheckedChange={(v) => set("active", v)} />;
    case "arr":
      return <Input value={item.arr} onChange={(e) => set("arr", Number(e.target.value) || 0)} />;
    case "url":
      return <Input value={item.url} onChange={(e) => set("url", e.target.value)} />;
    default:
      return null;
  }
}

// Detail — one consumer of the selection. Edit-in-place when the user has
// edit access; otherwise the very same rows render read-only.
function DetailPanel({ item, canEdit, onClose, onChange }) {
  if (!item) {
    return (
      <Card className="w-full lg:w-96 shrink-0">
        <Stack gap="xs" align="center" className="p-10 text-center">
          <span className="text-sm font-medium">No alert selected</span>
          <span className="text-sm text-muted-foreground">Pick a row or card to see its full record.</span>
        </Stack>
      </Card>
    );
  }
  return (
    <Card className="w-full lg:w-96 shrink-0">
      <Stack gap="none">
        <Row justify="between" align="start" className="p-4">
          <Stack gap="none" className="min-w-0">
            <span className="text-lg font-semibold truncate">{item.title}</span>
            <span className="text-sm text-muted-foreground">{item.alertType}</span>
          </Stack>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </Row>
        <Separator />
        <div className="p-4">
          <PropertyList align="start" divider labelWidth="7.5rem">
            {FIELDS.map((f) => {
              const Icon = f.icon;
              const editing = canEdit && f.editor;
              return (
                <PropertyList.Row key={f.key} label={f.label} icon={Icon ? <Icon /> : undefined}>
                  {editing ? renderEditor(f.editor, item, onChange) : renderValue(f.type, item[f.key])}
                </PropertyList.Row>
              );
            })}
          </PropertyList>
        </div>
      </Stack>
    </Card>
  );
}

export default function App() {
  const initial = useMemo(() => [
    { id: "a-01", title: "Pricing page conversion drop", alertType: "Conversion", impact: "In progress", priority: "High", topics: ["Pricing", "Onboarding"], published: "2026-03-12", owner: "eo", team: ["eo", "ml", "pd"], businessProfiles: ["Acme", "Kite"], comments: 12, arr: 84000, progress: 0.72, url: "https://app.acme.co/alerts/a-01", active: true, summary: "Checkout funnel shed 8% week-over-week after the new plan grid shipped." },
    { id: "a-02", title: "Onboarding email bounce spike", alertType: "Deliverability", impact: "Open · Not started", priority: "Medium", topics: ["Email", "Lifecycle"], published: "2026-02-28", owner: "ml", team: ["ml", "zc"], businessProfiles: ["Anvil"], comments: 4, arr: 32000, progress: 0.15, url: "https://app.acme.co/alerts/a-02", active: true, summary: "Hard-bounce rate crossed 3% for the day-2 welcome sequence." },
    { id: "a-03", title: "Enterprise SSO latency", alertType: "Reliability", impact: "Resolved", priority: "High", topics: ["Auth", "Performance"], published: "2026-01-19", owner: "pd", team: ["pd", "sk", "ra", "np"], businessProfiles: ["Folio", "Ribbon"], comments: 21, arr: 156000, progress: 1, url: "https://app.acme.co/alerts/a-03", active: false, summary: "SAML round-trip exceeded 2s p95 for three enterprise tenants." },
    { id: "a-04", title: "Trial-to-paid stall", alertType: "Conversion", impact: "In progress", priority: "Low", topics: ["Billing", "Activation"], published: "2026-04-11", owner: "zc", team: ["zc", "tv"], businessProfiles: ["Zen"], comments: 7, arr: 48000, progress: 0.4, url: "https://app.acme.co/alerts/a-04", active: true, summary: "Trials converting 11% below the quarter baseline since the paywall test." },
    { id: "a-05", title: "Webhook retry storm", alertType: "Reliability", impact: "Open · Not started", priority: "Medium", topics: ["Integrations", "Queue"], published: "2026-05-02", owner: "sk", team: ["sk", "hs"], businessProfiles: ["Vega", "Kohi"], comments: 9, arr: 67000, progress: 0.25, url: "https://app.acme.co/alerts/a-05", active: true, summary: "Failed deliveries re-queued 6x, doubling outbound volume overnight." },
  ], []);

  const [records, setRecords] = useState(initial);
  const [canEdit, setCanEdit] = useState(true);

  // useDataView holds the view / selection / sorting / visibility state, so
  // the toggle + columns menu can sit up in the header (not on the table) and
  // still drive the DataView below. Published starts hidden — toggle it on
  // from the Display menu.
  const dv = useDataView({ defaultView: "table", defaultActiveId: "a-01", defaultColumnVisibility: { published: false } });
  const active = records.find((r) => r.id === dv.activeId) ?? null;
  const updateField = (key, value) =>
    setRecords((rs) => rs.map((r) => (r.id === dv.activeId ? { ...r, [key]: value } : r)));

  // Columns are a subset of the schema. `cell` overrides reuse the same
  // badge / avatar renderers as the detail panel, so the table, the cards,
  // and the detail view never drift.
  const columns = useMemo(() => [
    {
      key: "title", header: "Alert", role: "title", sortable: true,
      cell: (r) => (
        <Stack gap="none" className="min-w-0">
          <span className="font-medium truncate">{r.title}</span>
          <span className="text-xs text-muted-foreground">{r.alertType}</span>
        </Stack>
      ),
    },
    { key: "impact", header: "Impact", cell: (r) => statusBadge(r.impact) },
    { key: "priority", header: "Priority", sortable: true, cell: (r) => priorityBadge(r.priority) },
    { key: "owner", header: "Owner", cell: (r) => renderValue("user", r.owner) },
    { key: "comments", header: "Comments", type: "number", align: "end", sortable: true },
    { key: "arr", header: "ARR", type: "currency", align: "end", sortable: true },
    { key: "published", header: "Published", cell: (r) => renderValue("date", r.published) },
  ], []);

  // Card / grid tiles — the bars-icon priority badge and the shared avatar
  // come straight from the helpers above.
  const renderCard = (r) => (
    <Card className={r.id === dv.activeId ? "cursor-pointer ring-2 ring-primary" : "cursor-pointer hover:bg-muted/40"}>
      <Stack gap="sm" className="p-4">
        <Row justify="between" align="start" gap="sm">
          <Stack gap="none" className="min-w-0">
            <span className="font-medium truncate">{r.title}</span>
            <span className="text-xs text-muted-foreground">{r.alertType}</span>
          </Stack>
          {priorityBadge(r.priority)}
        </Row>
        <Row gap="xs" wrap>{statusBadge(r.impact)}</Row>
        <Separator />
        <Row justify="between" align="center">
          {renderValue("user", r.owner)}
          <Row gap="xs" align="center" className="text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="text-sm tabular-nums">{r.comments}</span>
          </Row>
        </Row>
      </Stack>
    </Card>
  );

  return (
    <AppShell nav="none" className="min-h-screen bg-background">
      <AppShellMain className="p-6">
        <Stack gap="lg" className="h-full">
          <Row justify="between" align="center" wrap gap="md">
            <Stack gap="xs">
              <h1 className="text-2xl font-semibold">Alerts</h1>
              <span className="text-sm text-muted-foreground">
                {records.length} alerts · select one, then edit it in place
              </span>
            </Stack>
            <Row gap="md" align="center">
              <Row gap="xs" align="center">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Edit access</span>
                <Switch checked={canEdit} onCheckedChange={setCanEdit} />
              </Row>
              {/* The toggle + columns menu live OUTSIDE the DataView, wired
                  only by the state useDataView holds. */}
              <DataView.Columns columns={columns} visibility={dv.columnVisibility} onVisibilityChange={dv.setColumnVisibility} />
              <DataView.Toggle value={dv.view} onChange={dv.setView} views={dv.views} />
            </Row>
          </Row>

          <Row gap="lg" align="start" className="min-h-0">
            <div className="min-w-0 flex-1">
              <DataView
                data={records}
                columns={columns}
                view={dv.view}
                activeId={dv.activeId}
                onActiveChange={dv.setActiveId}
                sorting={dv.sorting}
                onSortingChange={dv.setSorting}
                columnVisibility={dv.columnVisibility}
                onColumnVisibilityChange={dv.setColumnVisibility}
                renderCard={renderCard}
              />
            </div>
            <DetailPanel
              item={active}
              canEdit={canEdit}
              onClose={() => dv.setActiveId(null)}
              onChange={updateField}
            />
          </Row>
        </Stack>
      </AppShellMain>
    </AppShell>
  );
}
