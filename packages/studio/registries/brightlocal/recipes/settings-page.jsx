// SettingsPage — A settings page with sidebar navigation and tabbed content sections inside a global layout.
// keywords: settings page, preferences, account settings, admin settings, sidebar navigation page, settings layout
// components: global-layout, sidebar, card, tabs
// Harvested from BrightLocal's DS MCP (get_composition_recipe "SettingsPage") —
// hand-edit freely; re-running the harvester OVERWRITES this file.

<GlobalLayout dataHook="settings-layout">
  <Sidebar dataHook="settings-nav">
    <SidebarContent>
      <SidebarMenu>
        <SidebarMenuItem><SidebarMenuButton>General</SidebarMenuButton></SidebarMenuItem>
        <SidebarMenuItem><SidebarMenuButton>Security</SidebarMenuButton></SidebarMenuItem>
        <SidebarMenuItem><SidebarMenuButton>Notifications</SidebarMenuButton></SidebarMenuItem>
      </SidebarMenu>
    </SidebarContent>
  </Sidebar>
  <main>
    <Card dataHook="settings-card">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general" dataHook="settings-tabs">
          <TabsList><TabsTrigger value="general">General</TabsTrigger></TabsList>
          <TabsContent value="general">{/* form fields */}</TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  </main>
</GlobalLayout>
