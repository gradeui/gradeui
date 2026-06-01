import {
  AppShell, AppShellNav, AppShellMain,
  Stack, Row, Grid,
  Button, Card, CardContent,
  Input, Label, Checkbox, Badge,
  Select, SelectTrigger, SelectContent, SelectValue, SelectItem,
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
  MediaSurface,
  Sidebar, SidebarHeader, SidebarContent, SidebarSection,
} from "@gradeui/ui";
import { useMemo, useState } from "react";
import { Search, Star, Heart, ShoppingBag } from "lucide-react";

export default function App() {
  // Catalog — every product has a stable `id` (so Studio's Fill button
  // writes resolved URLs back into the right entry via MediaSurface's
  // instanceId stamp). `category` and `audience` drive the filter
  // facets; `price` + `rating` drive sort + range filters.
  const products = [
    { id: "prod-aero-run-4",   name: "Aero Run 4",     price: 128, rating: 4.6, category: "Running",  audience: "Women" },
    { id: "prod-trail-crush",  name: "Trail Crush Pro", price: 165, rating: 4.8, category: "Trail",    audience: "Men" },
    { id: "prod-glide-lite",   name: "Glide Lite",      price: 92,  rating: 4.2, category: "Running",  audience: "Women" },
    { id: "prod-pulse-street", name: "Pulse Street",    price: 110, rating: 4.4, category: "Lifestyle", audience: "Men" },
    { id: "prod-horizon-knit", name: "Horizon Knit",    price: 145, rating: 4.7, category: "Lifestyle", audience: "Women" },
    { id: "prod-drift-low",    name: "Drift Low",       price: 88,  rating: 4.1, category: "Lifestyle", audience: "Kids" },
    { id: "prod-summit-2",     name: "Summit 2",        price: 180, rating: 4.9, category: "Trail",    audience: "Men" },
    { id: "prod-echo-flex",    name: "Echo Flex",       price: 98,  rating: 4.3, category: "Running",  audience: "Kids" },
  ];

  const ALL_AUDIENCES = ["Men", "Women", "Kids"];
  const SORTS = {
    "featured":   { label: "Featured",            cmp: () => 0 },
    "price-asc":  { label: "Price: Low to High",  cmp: (a, b) => a.price - b.price },
    "price-desc": { label: "Price: High to Low",  cmp: (a, b) => b.price - a.price },
    "rating":     { label: "Highest rated",       cmp: (a, b) => b.rating - a.rating },
  };

  // Filter state — every chrome element below writes into one of these.
  const [query, setQuery] = useState("");
  const [audiences, setAudiences] = useState(new Set());
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sort, setSort] = useState("featured");

  const toggleAudience = (a) =>
    setAudiences((prev) => {
      const next = new Set(prev);
      if (next.has(a)) next.delete(a);
      else next.add(a);
      return next;
    });

  // Filter + sort pipeline. Empty audience set = "show all". Price
  // bounds are optional and the strings are coerced to numbers only
  // when they parse cleanly (so a stray non-numeric character doesn't
  // wipe the catalog).
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const minN = priceMin === "" ? null : Number(priceMin);
    const maxN = priceMax === "" ? null : Number(priceMax);
    const minOk = (n) => minN == null || Number.isNaN(minN) ? true : n >= minN;
    const maxOk = (n) => maxN == null || Number.isNaN(maxN) ? true : n <= maxN;
    return products
      .filter((p) => {
        if (q && !p.name.toLowerCase().includes(q)) return false;
        if (audiences.size > 0 && !audiences.has(p.audience)) return false;
        if (!minOk(p.price) || !maxOk(p.price)) return false;
        return true;
      })
      .slice()
      .sort(SORTS[sort].cmp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, audiences, priceMin, priceMax, sort]);

  const clearAll = () => {
    setQuery("");
    setAudiences(new Set());
    setPriceMin("");
    setPriceMax("");
  };

  const activeChips = [
    ...Array.from(audiences).map((a) => ({ key: `aud-${a}`, label: a, clear: () => toggleAudience(a) })),
    ...(priceMin !== "" ? [{ key: "min", label: `≥ $${priceMin}`, clear: () => setPriceMin("") }] : []),
    ...(priceMax !== "" ? [{ key: "max", label: `≤ $${priceMax}`, clear: () => setPriceMax("") }] : []),
    ...(query.trim() ? [{ key: "q", label: `"${query.trim()}"`, clear: () => setQuery("") }] : []),
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
            <SidebarSection title="Audience" collapsible={false}>
              {ALL_AUDIENCES.map((a) => (
                <Row key={a} gap="sm" align="center" className="px-2">
                  <Checkbox
                    id={`aud-${a}`}
                    checked={audiences.has(a)}
                    onCheckedChange={() => toggleAudience(a)}
                  />
                  <Label htmlFor={`aud-${a}`} className="text-sm font-normal cursor-pointer">
                    {a}
                  </Label>
                </Row>
              ))}
            </SidebarSection>
            <SidebarSection title="Price" collapsible={false}>
              <Row gap="sm" className="px-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                />
              </Row>
            </SidebarSection>
            <div className="px-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={clearAll}
                disabled={activeChips.length === 0}
              >
                Clear filters
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>
      </AppShellNav>
      <AppShellMain className="p-6">
        <Stack gap="lg">
          <Row justify="between" align="center">
            <Stack gap="xs">
              {/* DS Breadcrumb — replaces the prior inline "Home / Women / Running" text */}
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink className="cursor-pointer">Home</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink className="cursor-pointer">Shoes</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Running</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <Row gap="sm" align="baseline">
                <h1 className="text-2xl font-semibold">Running shoes</h1>
                <span className="text-sm text-muted-foreground">
                  {visible.length} of {products.length}
                </span>
              </Row>
            </Stack>
            <Row gap="sm" align="center">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search products"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-7 w-56"
                />
              </div>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Sort: Featured" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SORTS).map(([key, meta]) => (
                    <SelectItem key={key} value={key}>{meta.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>
          </Row>

          {/* Chip strip — only shows when at least one filter is set.
              Each chip removes its own filter on click. */}
          {activeChips.length > 0 && (
            <Row gap="sm" align="center" wrap>
              {activeChips.map((chip) => (
                <Badge
                  key={chip.key}
                  variant="outline"
                  className="cursor-pointer"
                  onClick={chip.clear}
                >
                  {chip.label} ×
                </Badge>
              ))}
              <Button variant="ghost" size="sm" className="text-xs" onClick={clearAll}>
                Clear all
              </Button>
            </Row>
          )}

          {visible.length === 0 ? (
            <Stack gap="sm" align="center" className="py-16 text-center">
              <Search className="h-6 w-6 text-muted-foreground/50" />
              <span className="text-sm text-muted-foreground">No products match</span>
              <Button variant="outline" size="sm" onClick={clearAll}>
                Reset filters
              </Button>
            </Stack>
          ) : (
            <Grid cols="4" gap="lg">
              {visible.map((p) => (
                <Card key={p.id} className="overflow-hidden">
                  <MediaSurface
                    instanceId={p.id}
                    hint="product"
                    alt={`${p.name} running shoe`}
                    source={{ kind: "product", name: p.name, brand: "Acme" }}
                    // Per-item src — set by Studio's Fill button / asset
                    // picker (writes the resolved URL into THIS product's
                    // data entry). Unset → falls through to the `source`
                    // descriptor resolution. Binding to `p.src` (not a
                    // hardcoded literal) is what keeps each card's image
                    // independent inside the .map().
                    src={p.src ?? undefined}
                    radius="none"
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
          )}
        </Stack>
      </AppShellMain>
    </AppShell>
  );
}
