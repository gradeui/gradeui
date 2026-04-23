import {
  AppShell, AppShellNav, AppShellMain,
  Stack, Row, Grid,
  Button, Card, CardContent,
  Input, Label, Checkbox, Separator, Badge,
  Select, SelectTrigger, SelectContent, SelectValue, SelectItem,
  MediaSurface,
} from "@gradeui/ui";
import { Search, Star, Heart, ShoppingBag } from "lucide-react";

export default function App() {
  const products = [
    { name: "Aero Run 4", price: 128, rating: 4.6 },
    { name: "Trail Crush Pro", price: 165, rating: 4.8 },
    { name: "Glide Lite", price: 92, rating: 4.2 },
    { name: "Pulse Street", price: 110, rating: 4.4 },
    { name: "Horizon Knit", price: 145, rating: 4.7 },
    { name: "Drift Low", price: 88, rating: 4.1 },
    { name: "Summit 2", price: 180, rating: 4.9 },
    { name: "Echo Flex", price: 98, rating: 4.3 },
  ];
  return (
    <AppShell nav="side" className="min-h-screen bg-background">
      <AppShellNav placement="side" className="w-64 border-r bg-muted/30">
        <Stack gap="lg" className="p-4">
          <Row gap="xs" align="center">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <span className="text-base font-semibold">Acme Store</span>
          </Row>
          <Separator />
          <Stack gap="sm">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Category</Label>
            <Stack gap="xs">
              {["Men", "Women", "Kids", "Home", "Accessories"].map((c) => (
                <Row key={c} gap="sm" align="center">
                  <Checkbox id={`cat-${c}`} />
                  <Label htmlFor={`cat-${c}`} className="text-sm font-normal">{c}</Label>
                </Row>
              ))}
            </Stack>
          </Stack>
          <Stack gap="sm">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Price</Label>
            <Row gap="sm">
              <Input type="number" placeholder="Min" />
              <Input type="number" placeholder="Max" />
            </Row>
          </Stack>
          <Button variant="outline" size="sm">Clear filters</Button>
        </Stack>
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
              <Card key={p.name} className="overflow-hidden">
                <MediaSurface aspect="square" radius="none" className="relative bg-gradient-to-br from-primary/30 via-muted to-accent/20">
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 bg-background/80 backdrop-blur">
                    <Heart className="h-4 w-4" />
                  </Button>
                </MediaSurface>
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
