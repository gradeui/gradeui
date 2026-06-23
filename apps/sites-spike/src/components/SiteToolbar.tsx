import { Toolbar, Container, Button } from "@gradeui/ui";

/* Site nav built on the Grade Toolbar (leading / trailing slots), the DS-correct
   chrome bar. A thin React component so Astro can render it statically (no
   client directive needed) and still feed the Toolbar its ReactNode slots,
   which can't be passed from a .astro file. A real SiteHeader/SiteToolbar
   probably belongs in @gradeui/ui; this is the spike's stand-in. */
export default function SiteToolbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <Container maxW="lg">
        <Toolbar
          variant="transparent"
          size="lg"
          leading={
            <a href="/" className="text-base font-semibold tracking-tight">
              Grade
            </a>
          }
          trailing={
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="/" className="hover:text-foreground">
                Home
              </a>
              <a href="/products/aurora-desk" className="hover:text-foreground">
                Shop
              </a>
              <Button size="sm">Get started</Button>
            </nav>
          }
        />
      </Container>
    </header>
  );
}
