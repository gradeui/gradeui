/**
 * @label       Components gallery
 * @description One-page showcase of Grade controls for theme previewing — buttons, inputs, selection cards, switches, badges, all on semantic tokens.
 * @tags        theme preview gallery showcase kitchen-sink components cards radio checkbox switch
 * @source      https://fluxui.dev/themes (pattern reference for the preview layout)
 * @notes       Generated 2026-06-02. A "see everything in one place" surface for the theme builder. Everything uses semantic tokens (bg-card, text-foreground, border-border) so the DS theme picker rotates the whole page. Selection cards (RadioCard / CheckboxCard / SwitchCard) are the stars; add panels as the DS grows.
 */
import {
  Stack,
  Row,
  Grid,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Input,
  Textarea,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Separator,
  Progress,
  Callout,
  CalloutTitle,
  CalloutDescription,
  Avatar,
  AvatarFallback,
  RadioGroup,
  RadioCard,
  CheckboxCard,
  SwitchCard,
  Field,
  Checkbox,
  Switch,
  ThreeScene,
} from "@gradeui/ui";
import { CreditCard, Banknote, Wallet, Info } from "lucide-react";

// The four Presence surfaces, named for the card headers below.
const SURFACES = [
  { surface: "solid", name: "Solid" },
  { surface: "translucent", name: "Translucent" },
  { surface: "glass", name: "Glass" },
  { surface: "glass-strong", name: "Glass strong" },
];

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <Stack gap="xl">
          {/* Header — homage to a theme-builder preview header */}
          <Stack gap="xs">
            <h1 className="text-3xl font-bold tracking-tight">Make it your own.</h1>
            <p className="text-muted-foreground">
              Every control below reads from the theme tokens. Switch theme or
              mode and the whole page re-skins.
            </p>
          </Stack>

          <Grid cols="2" gap="lg">
            {/* Buttons */}
            <Card>
              <CardHeader>
                <CardTitle>Buttons</CardTitle>
              </CardHeader>
              <CardContent>
                <Stack gap="md">
                  <Row gap="sm" wrap>
                    <Button>Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Delete</Button>
                  </Row>
                  <Row gap="sm" align="center" wrap>
                    <Button size="sm">Small</Button>
                    <Button size="md">Medium</Button>
                    <Button size="lg">Large</Button>
                    <Button variant="raised">Raised</Button>
                  </Row>
                </Stack>
              </CardContent>
            </Card>

            {/* Badges */}
            <Card>
              <CardHeader>
                <CardTitle>Badges</CardTitle>
              </CardHeader>
              <CardContent>
                <Row gap="sm" wrap>
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="success-soft">Active</Badge>
                  <Badge variant="warning-soft">Pending</Badge>
                  <Badge variant="info-soft">New</Badge>
                  <Badge variant="destructive">Error</Badge>
                </Row>
              </CardContent>
            </Card>

            {/* Form inputs */}
            <Card>
              <CardHeader>
                <CardTitle>Inputs</CardTitle>
              </CardHeader>
              <CardContent>
                <Stack gap="md">
                  <Stack gap="xs">
                    <Label htmlFor="g-email">Email</Label>
                    <Input id="g-email" type="email" placeholder="you@example.com" />
                  </Stack>
                  <Stack gap="xs">
                    <Label htmlFor="g-plan">Plan</Label>
                    <Select defaultValue="pro">
                      <SelectTrigger id="g-plan">
                        <SelectValue placeholder="Choose a plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="team">Team</SelectItem>
                      </SelectContent>
                    </Select>
                  </Stack>
                  <Stack gap="xs">
                    <Label htmlFor="g-note">Note</Label>
                    <Textarea id="g-note" placeholder="Anything we should know?" />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Tabs + progress */}
            <Card>
              <CardHeader>
                <CardTitle>Tabs &amp; progress</CardTitle>
              </CardHeader>
              <CardContent>
                <Stack gap="md">
                  <Tabs defaultValue="overview">
                    <TabsList>
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="activity">Activity</TabsTrigger>
                      <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview">
                      <p className="text-sm text-muted-foreground pt-2">
                        A quick summary lives here.
                      </p>
                    </TabsContent>
                    <TabsContent value="activity">
                      <p className="text-sm text-muted-foreground pt-2">
                        Recent activity lives here.
                      </p>
                    </TabsContent>
                    <TabsContent value="settings">
                      <p className="text-sm text-muted-foreground pt-2">
                        Settings live here.
                      </p>
                    </TabsContent>
                  </Tabs>
                  <Stack gap="xs">
                    <Row justify="between">
                      <span className="text-sm text-muted-foreground">Storage</span>
                      <span className="text-sm font-medium">68%</span>
                    </Row>
                    <Progress value={68} />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Payment method — RadioCard */}
            <Card>
              <CardHeader>
                <CardTitle>Payment method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup defaultValue="card" className="grid gap-3">
                  <RadioCard value="card" label="Credit card" description="Visa, Mastercard, Amex" aside={<CreditCard className="size-4 text-muted-foreground" />} />
                  <RadioCard value="paypal" label="PayPal" description="Pay with your PayPal balance" aside={<Wallet className="size-4 text-muted-foreground" />} />
                  <RadioCard value="bank" label="Bank transfer" description="2–3 working days to clear" aside={<Banknote className="size-4 text-muted-foreground" />} />
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Role — RadioCard with descriptions */}
            <Card>
              <CardHeader>
                <CardTitle>Role</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup defaultValue="admin" className="grid gap-3">
                  <RadioCard value="admin" label="Administrator" description="Can perform any action." />
                  <RadioCard value="editor" label="Editor" description="Can read, create, and update." />
                  <RadioCard value="viewer" label="Viewer" description="Read only." />
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Shipping — the canonical RadioCard example */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup defaultValue="standard" className="grid gap-3">
                  <RadioCard value="standard" label="Standard" description="4–10 business days" />
                  <RadioCard value="fast" label="Fast" description="2–5 business days" />
                  <RadioCard value="next-day" label="Next day" description="1 business day" />
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Add-ons — CheckboxCard */}
            <Card>
              <CardHeader>
                <CardTitle>Add-ons</CardTitle>
              </CardHeader>
              <CardContent>
                <Stack gap="sm">
                  <CheckboxCard label="Priority support" description="24/7 response within an hour" defaultChecked />
                  <CheckboxCard label="Extended warranty" description="3 years parts and labour" />
                </Stack>
              </CardContent>
            </Card>

            {/* Email preferences — Field + Checkbox (inline rows) */}
            <Card>
              <CardHeader>
                <CardTitle>Email preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <Stack gap="md">
                  <Field>
                    <Checkbox defaultChecked />
                    <Field.Label>Communication emails</Field.Label>
                    <Field.Description>Account activity and receipts.</Field.Description>
                  </Field>
                  <Field>
                    <Checkbox />
                    <Field.Label>Marketing emails</Field.Label>
                    <Field.Description>New products, features, and more.</Field.Description>
                  </Field>
                  <Field>
                    <Checkbox />
                    <Field.Label>Security emails</Field.Label>
                    <Field.Description>Sign-ins and security alerts.</Field.Description>
                    <Field.Trailing><Badge variant="info-soft">Recommended</Badge></Field.Trailing>
                  </Field>
                </Stack>
              </CardContent>
            </Card>

            {/* Settings — Field layout="setting" + a SwitchCard */}
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <Stack gap="md">
                  <Field layout="setting">
                    <Field.Label>Dark mode</Field.Label>
                    <Field.Description>Use the dark theme.</Field.Description>
                    <Switch />
                  </Field>
                  <Separator />
                  <Field layout="setting">
                    <Field.Label>Weekly digest</Field.Label>
                    <Field.Description>A summary every Monday.</Field.Description>
                    <Switch defaultChecked />
                  </Field>
                  <SwitchCard label="Auto-renew" description="Renew this plan automatically each month" defaultChecked />
                </Stack>
              </CardContent>
            </Card>

            {/* Callout + identity bits */}
            <Card>
              <CardHeader>
                <CardTitle>Feedback &amp; identity</CardTitle>
              </CardHeader>
              <CardContent>
                <Stack gap="md">
                  <Callout variant="info">
                    <Info className="size-4" />
                    <CalloutTitle>Heads up</CalloutTitle>
                    <CalloutDescription>
                      This whole gallery re-skins when you change the theme.
                    </CalloutDescription>
                  </Callout>
                  <Row gap="sm" align="center">
                    <Avatar>
                      <AvatarFallback>AD</AvatarFallback>
                    </Avatar>
                    <Stack gap="none">
                      <span className="text-sm font-medium">Ali Driver</span>
                      <span className="text-xs text-muted-foreground">ali@gradeui.com</span>
                    </Stack>
                  </Row>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Live scene + surfaces. Glass / translucent only show their
              material over something busy, so the surface cards are layered
              on a ThreeScene. Each card's header names its surface. */}
          <Stack gap="sm">
            <h2 className="text-xl font-semibold tracking-tight">
              Surfaces, over a live scene
            </h2>
            <p className="text-muted-foreground">
              A ThreeScene backdrop with the same cards on top. The header of
              each card is its <code>surface</code> value.
            </p>
            <div className="relative overflow-hidden rounded-xl border border-border">
              <ThreeScene
                preset="mesh"
                aspect="auto"
                className="absolute inset-0 h-full w-full"
              />
              <div className="relative z-10 p-6">
                <Grid cols="2" gap="lg">
                  {SURFACES.map(({ surface, name }) => (
                    <Card key={surface} surface={surface}>
                      <CardHeader>
                        <CardTitle>{name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <RadioGroup defaultValue="standard" className="grid gap-3">
                          <RadioCard value="standard" label="Standard" description="4–10 business days" />
                          <RadioCard value="fast" label="Fast" description="2–5 business days" />
                        </RadioGroup>
                      </CardContent>
                    </Card>
                  ))}
                </Grid>
              </div>
            </div>
          </Stack>
        </Stack>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// DS gaps surfaced by this scaffold
// ────────────────────────────────────────────────────────────────────
//
// Things this layout had to hand-roll because no Grade primitive covers
// them yet. Each is a candidate for a future component.
//
// • Section/Panel header pattern — every panel is Card + CardHeader +
//   CardTitle with the same rhythm. A lighter <Panel title="…"> (or a
//   CardTitle size/eyebrow variant) would remove the repetition in any
//   gallery / settings page. Recurs anywhere there's a stack of titled
//   cards (settings, dashboards, this theme preview).
//
// • Tooltip — not in the allowlist. Several controls here would normally
//   carry hover hints (the payment icons, the raised button). Flagging
//   so the gap is visible; for now they're bare.
//
// • Slider — no range input primitive. A theme-preview gallery wants one
//   (opacity, radius, density sliders for the live theme controls). The
//   "saved styles / contact sheet" work will need it.
//
// • This is also the natural host for the future theme-builder controls
//   (accent + base pickers, light/dark, density). Those are app chrome,
//   not @gradeui/ui primitives, but worth noting the gallery is where
//   they'd dock.
