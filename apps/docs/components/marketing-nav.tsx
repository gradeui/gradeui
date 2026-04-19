"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/routing";
import { Menu } from "lucide-react";
import { useRampTheme } from "@/components/ramp-theme-provider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LanguageSwitcher } from "@/components/language-switcher";

export function MarketingNav() {
  const t = useTranslations("common.nav");
  const { isDark, setMode } = useRampTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Marketing-side links. The product-catalog style nav is gone now —
  // this site is a Design System + AI playground, not a product marketing site.
  const dsLinks = [
    { name: "Components", href: "/components", external: false },
    { name: "Docs", href: "/docs", external: false },
    { name: "Templates", href: "/templates", external: false },
    { name: "Playground", href: "/play", external: false },
    { name: "Brand", href: "/brand", external: false },
    { name: "Community", href: "/community", external: false },
  ];

  const toggleTheme = () => {
    setMode(isDark ? "light" : "dark");
  };

  return (
    <nav
      className={cn(
        "fixed w-full z-50 transition-all duration-300 border-b",
        scrolled
          ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm"
          : "bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/40"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Logo variant="full" size="sm" />
        </Link>

        {/* Desktop Navigation — flattened. Ramp DS is not a multi-product site
            any more, so the old Products/UseCases dropdowns are gone. */}
        <div className="hidden lg:flex items-center gap-1">
          {dsLinks.map((item) => (
            <Button key={item.href} variant="ghost" asChild>
              <Link href={item.href}>{item.name}</Link>
            </Button>
          ))}
          <Button variant="ghost" asChild>
            <Link href="/about">{t("about")}</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/contact">{t("contact")}</Link>
          </Button>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <LanguageSwitcher />

          {/* Theme toggle */}
          {mounted && (
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="hidden md:flex" aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}>
              {isDark ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </Button>
          )}

          {/* CTA — single button to the npm package page. */}
          <div className="hidden md:flex items-center gap-2">
            <Button asChild>
              <a href="https://www.npmjs.com/package/@grade/ui" target="_blank" rel="noopener noreferrer">
                Install @grade/ui
              </a>
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col space-y-4">
                {dsLinks.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="font-medium py-2 hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                <Link
                  href="/about"
                  className="font-medium py-2 hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("about")}
                </Link>
                <Link
                  href="/contact"
                  className="font-medium py-2 hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("contact")}
                </Link>

                <div className="pt-4 border-t">
                  <Button className="w-full" asChild>
                    <a href="https://www.npmjs.com/package/@grade/ui" target="_blank" rel="noopener noreferrer">
                      Install @grade/ui
                    </a>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
