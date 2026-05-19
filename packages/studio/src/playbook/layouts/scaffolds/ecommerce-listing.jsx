import {
  AppShell, AppShellNav, AppShellMain,
  Stack, Row, Grid,
  Button, Card, CardContent,
  Input, Label, Checkbox, Separator, Badge,
  Select, SelectTrigger, SelectContent, SelectValue, SelectItem,
  MediaSurface,
  Sidebar, SidebarHeader, SidebarContent, SidebarSection,
} from "@gradeui/ui";
import { Search, Star, Heart, ShoppingBag } from "lucide-react";

export default function App() {
  // Data-driven shape: every entry has a stable `id` so Studio's Fill
  // button can write resolved URLs back into THIS entry (via the
  // MediaSurface's instanceId stamp), and the settings panel can target
  // a single product card for per-item edits. Starter picker rewrites
  // these ids to fresh nanoids on instantiation.
  const products = [
    { id: "prod-aero-run-4", name: "Aero Run 4", price: 128, rating: 4.6 },
    { id: "prod-trail-crush", name: "Trail Crush Pro", price: 165, rating: 4.8 },
    { id: "prod-glide-lite", name: "Glide Lite", price: 92, rating: 4.2 },
    { id: "prod-pulse-street", name: "Pulse Street", price: 110, rating: 4.4 },
    { id: "prod-horizon-knit", name: "Horizon Knit", price: 145, rating: 4.7 },
    { id: "prod-drift-low", name: "Drift Low", price: 88, rating: 4.1 },
    { id: "prod-summit-2", name: "Summit 2", price: 180, rating: 4.9 },
    { id: "prod-echo-flex", name: "Echo Flex", price: 98, rating: 4.3 },
  ];
  return (
    <AppShell nav="side" className="min-h-screen bg-background">
      <AppShellNav placement="side">
        {/* Sidebar with filter-style content — Header carries the brand;
            SidebarSections wrap each filter group. Sidebar's children
            are arbitrary, so form controls slot in cleanly. */}
        <Sidebar collapsible={false}>
          <SidebarHeader>
            <Row gap="xs" align="center">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <span className="text-base font-semibold">Acme Store</span>
            </Row>
          </SidebarHeader>
          <SidebarContent>
            <SidebarSection title="Category" collapsible={false}>
              {["Men", "Women", "Kids", "Home", "Accessories"].map((c) => (
                <Row key={c} gap="sm" align="center" className="px-2">
                  <Checkbox id={`cat-${c}`} />
                  <Label htmlFor={`cat-${c}`} className="text-sm font-normal">{c}</Label>
                </Row>
              ))}
            </SidebarSection>
            <SidebarSection title="Price" collapsible={false}>
              <Row gap="sm" className="px-2">
                <Input type="number" placeholder="Min" />
                <Input type="number" placeholder="Max" />
              </Row>
            </SidebarSection>
            <div className="px-2 pt-2">
              <Button variant="outline" size="sm" className="w-full">Clear filters</Button>
            </div>
          </SidebarContent>
        </Sidebar>
      </AppShellNav>
      <AppShellMain className="p-6">
        <Stack gap="lg">
          <Row justify="between" align="center">
            <Stack gap="xs">
              <span className="text-xs text-muted-foreground">Home / Women / Running</span>
              <h1 className="text-2xl font-semibold">Running shoes</h1>
            </Stack>
            <Row gap="sm" align="center">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search products" className="pl-7 w-56" />
              </div>
              <Select>
                <SelectTrigger className="w-40"><SelectValue placeholder="Sort: Featured" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest rated</SelectItem>
                </SelectContent>
              </Select>
            </Row>
          </Row>
          <Row gap="sm" align="center" wrap>
            {["Women", "< $150", "4★ & up"].map((tag) => (
              <Badge key={tag} variant="outline">{tag} ×</Badge>
            ))}
          </Row>
          <Grid cols="4" gap="lg">
            {products.map((p) => (
              <Card key={p.id} className="overflow-hidden">
                <MediaSurface
                  instanceId={p.id}
                  hint={p.hint ?? "product"}
                  alt={p.alt ?? `${p.name} running shoe`}
                  source={p.source ?? { kind: "product", name: p.name, brand: "Acme" }}
                  src={p.src ?? undefined}
                  radius={p.radius ?? "none"}
                  overlay={
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 bg-background/80 backdrop-blur">
                      <Heart className="h-4 w-4" />
                    </Button>
                  }
                />
                <CardContent className="p-3">
                  <Stack gap="xs">
                    <Row justify="between" align="start">
                      <span className="text-sm font-medium">{p.name}</span>
                      <span className="text-sm font-semibold">${p.price}</span>
                    </Row>
                    <Row gap="xs" align="center">
                      <Row gap="none">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${i < Math.round(p.rating) ? "fill-primary text-primary" : "text-muted-foreground/50"}`}
                          />
                        ))}
                      </Row>
                      <span className="text-xs text-muted-foreground">{p.rating}</span>
                    </Row>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Grid>
        </Stack>
      </AppShellMain>
    </AppShell>
  );
}
