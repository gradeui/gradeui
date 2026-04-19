"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/routing";

/**
 * Marketing footer for the [locale]/* pages.
 *
 * Simplified away from the old multi-product layout — this is a Design System
 * + AI playground now, not a product marketing site, so the footer only
 * exposes the DS surfaces + a couple of external links.
 */
export function MarketingFooter() {
  const t = useTranslations("common.footer");

  return (
    <footer className="border-t py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h4 className="font-semibold mb-4">Design System</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/components" className="hover:text-foreground">Components</Link></li>
              <li><Link href="/docs" className="hover:text-foreground">Docs</Link></li>
              <li><Link href="/templates" className="hover:text-foreground">Templates</Link></li>
              <li><Link href="/play" className="hover:text-foreground">Playground</Link></li>
              <li><Link href="/brand" className="hover:text-foreground">Brand</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/changelog" className="hover:text-foreground">Changelog</Link></li>
              <li><Link href="/roadmap" className="hover:text-foreground">Roadmap</Link></li>
              <li>
                <a href="https://www.npmjs.com/package/@gradeui/ui" className="hover:text-foreground">
                  npm package
                </a>
              </li>
              <li>
                <a href="https://github.com/gradeui/gradeui" className="hover:text-foreground">
                  GitHub
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t("company")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-foreground">{t("about")}</Link></li>
              <li><Link href="/company" className="hover:text-foreground">Company</Link></li>
              <li><Link href="/community" className="hover:text-foreground">{t("community")}</Link></li>
              <li><Link href="/contact" className="hover:text-foreground">{t("contact")}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Grade Design System
          </p>
          <div className="flex gap-4">
            <a
              href="https://github.com/gradeui/gradeui"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/@gradeui/ui"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              npm
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
