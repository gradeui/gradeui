"use client";

/**
 * SuperAdminSheet — internal-only impersonation surface.
 *
 * Opens via the shield icon in the topbar (visible only when the
 * current user has `superAdmin === true`) or via the global
 * keyboard shortcut `⌘⇧⌥A`. Lets the developer pick any user +
 * any org to impersonate, so they can reproduce bugs from a real
 * user's perspective without touching production state.
 *
 * The sheet itself is built from gradeui primitives — Sheet, Tabs,
 * SidebarItem (with size="sm"), Badge, Button. The user + org
 * pickers are simple lists; the currently-impersonated row is
 * highlighted with the same `active` semantics any sidebar
 * navigation row uses.
 *
 * Real-world production users will never get this surface — it's
 * gated to internal staff via the `superAdmin` flag on User. The
 * impersonation override itself sits in sessionStorage (clears on
 * tab close) so a developer can't accidentally ship while
 * impersonated.
 */

import * as React from "react";
import { ShieldCheck, User as UserIcon, Building2 } from "lucide-react";
import {
  Badge,
  Button,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@gradeui/ui";

import {
  useImpersonation,
  type Organisation,
  type User,
} from "@/lib/studio-users";

interface SuperAdminSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** All users the storage knows about. Passed in rather than
   *  fetched here so the sheet doesn't have to know about the
   *  storage adapter. */
  users: User[];
  /** All orgs. */
  orgs: Organisation[];
}

export function SuperAdminSheet({
  open,
  onOpenChange,
  users,
  orgs,
}: SuperAdminSheetProps) {
  const {
    isImpersonating,
    realUser,
    realOrg,
    impersonatedUserId,
    impersonatedOrgId,
    startImpersonation,
    stopImpersonation,
  } = useImpersonation();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[88vw] max-w-md flex flex-col gap-0"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Super admin
          </SheetTitle>
          <SheetDescription>
            Switch identity to debug as any user in any org. Resets
            when you close the tab.
          </SheetDescription>
        </SheetHeader>

        {/* Current impersonation status — always visible at the top
            so the developer immediately sees what state they're
            in. The "Stop" button restores the real identity in one
            click. */}
        <div className="px-1 py-3">
          {isImpersonating ? (
            <div className="flex items-center justify-between gap-2 rounded-md border border-primary/30 bg-primary/5 px-2 py-1.5">
              <span className="flex flex-col text-xs">
                <span className="font-medium text-foreground">
                  Impersonating
                </span>
                <span className="text-muted-foreground">
                  {(impersonatedUserId &&
                    users.find((u) => u.id === impersonatedUserId)?.name) ??
                    realUser.name}
                  {" — "}
                  {(impersonatedOrgId &&
                    orgs.find((o) => o.id === impersonatedOrgId)?.name) ??
                    realOrg?.name ??
                    "no org"}
                </span>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={stopImpersonation}
              >
                Stop
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-2 py-1.5 text-xs">
              <span className="text-muted-foreground">
                Running as <b className="text-foreground">{realUser.name}</b>{" "}
                in <b className="text-foreground">{realOrg?.name ?? "no org"}</b>
              </span>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex-1 min-h-0 overflow-y-auto py-3">
          <Tabs defaultValue="users" className="flex flex-col gap-3">
            <TabsList className="self-start">
              <TabsTrigger value="users">
                <UserIcon className="h-3.5 w-3.5" />
                Users
              </TabsTrigger>
              <TabsTrigger value="orgs">
                <Building2 className="h-3.5 w-3.5" />
                Orgs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="flex flex-col gap-1">
              {users.map((u) => {
                const isReal = u.id === realUser.id;
                const isActive = u.id === (impersonatedUserId ?? realUser.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() =>
                      startImpersonation({
                        // Picking the real user is the same as
                        // clearing impersonation on this dimension.
                        userId: isReal ? null : u.id,
                      })
                    }
                    className={
                      "group flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors " +
                      (isActive
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted text-foreground")
                    }
                  >
                    <span className="flex-1 truncate">
                      <span className="font-medium">{u.name}</span>
                      {u.email && (
                        <span className="ml-1.5 text-muted-foreground">
                          {u.email}
                        </span>
                      )}
                    </span>
                    {u.superAdmin && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        Super admin
                      </Badge>
                    )}
                    {u.status === "unverified" && (
                      <Badge
                        variant="warning-soft"
                        className="text-[10px] px-1.5 py-0"
                      >
                        Unverified
                      </Badge>
                    )}
                  </button>
                );
              })}
            </TabsContent>

            <TabsContent value="orgs" className="flex flex-col gap-1">
              {orgs.map((o) => {
                const isReal = o.id === realOrg?.id;
                const isActive = o.id === (impersonatedOrgId ?? realOrg?.id);
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() =>
                      startImpersonation({
                        orgId: isReal ? null : o.id,
                      })
                    }
                    className={
                      "group flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors " +
                      (isActive
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted text-foreground")
                    }
                  >
                    <span className="flex-1 truncate font-medium">
                      {o.name}
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 capitalize"
                    >
                      {o.plan}
                    </Badge>
                  </button>
                );
              })}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
