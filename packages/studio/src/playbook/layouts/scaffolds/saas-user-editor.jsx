import {
  AppShell, AppShellNav, AppShellMain,
  Stack, Row,
  Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Input, Label, Textarea, Switch, Separator, Badge, Avatar, AvatarFallback,
  Select, SelectTrigger, SelectContent, SelectValue, SelectItem,
  Sidebar, SidebarHeader, SidebarContent, SidebarSection, SidebarItem,
} from "@gradeui/ui";
import { Users, Settings, CreditCard, Building2, Search, Check } from "lucide-react";

export default function App() {
  const users = [
    { id: "u1", name: "Elena Okafor", email: "elena@acme.co", role: "Admin", initials: "EO", active: true, selected: true },
    { id: "u2", name: "Marcus Li", email: "marcus@acme.co", role: "Editor", initials: "ML", active: true },
    { id: "u3", name: "Priya Devi", email: "priya@acme.co", role: "Viewer", initials: "PD", active: false },
    { id: "u4", name: "Samir Khan", email: "samir@acme.co", role: "Editor", initials: "SK", active: true },
    { id: "u5", name: "Zoe Chen", email: "zoe@acme.co", role: "Admin", initials: "ZC", active: true },
  ];
  return (
    <AppShell nav="side" className="min-h-screen bg-background">
      <AppShellNav placement="side">
        {/* Sidebar is the canonical compound nav primitive — slot directly
            into AppShellNav. Each row is a SidebarItem with icon + `active`. */}
        <Sidebar collapsible={false}>
          <SidebarHeader>
            <span className="text-base font-semibold">Admin</span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarSection collapsible={false}>
              <SidebarItem asButton icon={<Users />} active>Users</SidebarItem>
              <SidebarItem asButton icon={<Building2 />}>Teams</SidebarItem>
              <SidebarItem asButton icon={<CreditCard />}>Billing</SidebarItem>
              <SidebarItem asButton icon={<Settings />}>Settings</SidebarItem>
            </SidebarSection>
          </SidebarContent>
        </Sidebar>
      </AppShellNav>
      <AppShellMain className="p-6">
        <Stack gap="lg">
          <Row justify="between" align="center">
            <Stack gap="xs">
              <h1 className="text-2xl font-semibold">Users</h1>
              <span className="text-sm text-muted-foreground">Manage who has access to your workspace.</span>
            </Stack>
            <Button>Invite user</Button>
          </Row>
          <Row gap="lg" align="start" className="min-h-0">
            <Card className="w-80 shrink-0">
              <CardHeader className="pb-3">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Search people" className="pl-7" />
                </div>
              </CardHeader>
              <Separator />
              <Stack gap="none" className="p-1 max-h-[520px] overflow-y-auto">
                {users.map((u) => (
                  <Row
                    key={u.id}
                    gap="sm"
                    align="center"
                    className={`rounded-md px-2 py-2 ${u.selected ? "bg-muted" : "hover:bg-muted/50"}`}
                  >
                    <Avatar>
                      <AvatarFallback>{u.initials}</AvatarFallback>
                    </Avatar>
                    <Stack gap="none" className="min-w-0 flex-1">
                      <Row justify="between" align="center">
                        <span className="text-sm font-medium truncate">{u.name}</span>
                        {u.selected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                      </Row>
                      <span className="text-xs text-muted-foreground truncate">{u.email}</span>
                    </Stack>
                    <Badge variant={u.active ? "default" : "outline"}>{u.role}</Badge>
                  </Row>
                ))}
              </Stack>
            </Card>
            <Card className="flex-1">
              <CardHeader>
                <Row gap="md" align="center">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>EO</AvatarFallback>
                  </Avatar>
                  <Stack gap="none">
                    <CardTitle>Elena Okafor</CardTitle>
                    <CardDescription>elena@acme.co · Joined Mar 2025</CardDescription>
                  </Stack>
                </Row>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <Stack gap="lg">
                  <Row gap="md">
                    <Stack gap="xs" className="flex-1">
                      <Label htmlFor="first">First name</Label>
                      <Input id="first" defaultValue="Elena" />
                    </Stack>
                    <Stack gap="xs" className="flex-1">
                      <Label htmlFor="last">Last name</Label>
                      <Input id="last" defaultValue="Okafor" />
                    </Stack>
                  </Row>
                  <Stack gap="xs">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue="elena@acme.co" />
                  </Stack>
                  <Stack gap="xs">
                    <Label htmlFor="role">Role</Label>
                    <Select defaultValue="admin">
                      <SelectTrigger id="role"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin — full access</SelectItem>
                        <SelectItem value="editor">Editor — can modify content</SelectItem>
                        <SelectItem value="viewer">Viewer — read-only</SelectItem>
                      </SelectContent>
                    </Select>
                  </Stack>
                  <Stack gap="xs">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea id="bio" rows={3} defaultValue="Design lead, running the workspace migration." />
                  </Stack>
                  <Separator />
                  <Row justify="between" align="center">
                    <Stack gap="none">
                      <span className="text-sm font-medium">Active</span>
                      <span className="text-xs text-muted-foreground">Disabled users can't sign in.</span>
                    </Stack>
                    <Switch defaultChecked />
                  </Row>
                  <Row justify="between" align="center">
                    <Stack gap="none">
                      <span className="text-sm font-medium">Two-factor authentication</span>
                      <span className="text-xs text-muted-foreground">Require 2FA on next sign-in.</span>
                    </Stack>
                    <Switch />
                  </Row>
                </Stack>
              </CardContent>
              <Separator />
              <CardFooter>
                <Row gap="sm" justify="end" className="w-full">
                  <Button variant="ghost">Cancel</Button>
                  <Button>Save changes</Button>
                </Row>
              </CardFooter>
            </Card>
          </Row>
        </Stack>
      </AppShellMain>
    </AppShell>
  );
}
