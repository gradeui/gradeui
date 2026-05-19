import { notFound } from "next/navigation";

/**
 * SimpleTabs retired (May 2026) — merged into Tabs as
 * `<Tabs><TabsList variant="underlined">…</TabsList></Tabs>`.
 *
 * This route exists only because Next.js requires every `app/`
 * directory to resolve to a valid module. Delete the directory
 * when the sandbox allows `rm -rf` again.
 */
export default function SimpleTabsRoute() {
  notFound();
}
