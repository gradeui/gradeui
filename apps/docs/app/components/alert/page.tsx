import { notFound } from "next/navigation";

/**
 * Pure 404 — the Alert → Callout rename is a clean break. No redirect.
 * No one's using gradeui yet, so external links to /components/alert
 * aren't a concern; the new route is /components/callout.
 *
 * This file exists only because Next.js requires every `app/` directory
 * to resolve to a valid module — the route-type validator errors on
 * empty files. When this directory can be deleted from the working
 * tree (`rm -rf apps/docs/app/components/alert`), this file goes too.
 */
export default function AlertRoute() {
  notFound();
}
