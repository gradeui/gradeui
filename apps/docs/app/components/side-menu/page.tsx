import { notFound } from "next/navigation";

/**
 * SideMenu retired (May 2026) — renamed to Sidebar and rebuilt as a
 * compound API (`Sidebar / SidebarHeader / SidebarContent /
 * SidebarFooter / SidebarSection / SidebarItem`). See
 * `/components/sidebar` for the new component.
 *
 * This file exists only because Next.js requires every `app/` directory
 * to resolve to a valid module. Delete the directory when the sandbox
 * allows `rm -rf` again.
 */
export default function SideMenuRoute() {
  notFound();
}
