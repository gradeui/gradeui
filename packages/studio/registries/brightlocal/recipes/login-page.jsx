// LoginPage — A login page with split layout: form on the left, marketing on the right, with a branded header.
// keywords: login page, sign in page, auth page, authentication layout, split login, onboarding page, signup page
// components: split-layout, header, logo, card
// Harvested from BrightLocal's DS MCP (get_composition_recipe "LoginPage") —
// hand-edit freely; re-running the harvester OVERWRITES this file.

<SplitLayout dataHook="login-layout">
  <SplitLayoutHeader>
    <Header dataHook="login-header">
      <Logo dataHook="login-logo" />
    </Header>
  </SplitLayoutHeader>
  <SplitLayoutContentLeft>
    <Card dataHook="login-card" className="max-w-md">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
      </CardHeader>
      <CardContent>{/* form fields */}</CardContent>
      <CardFooter>
        <Button dataHook="login-submit" className="w-full">Sign in</Button>
      </CardFooter>
    </Card>
  </SplitLayoutContentLeft>
  <SplitLayoutContentRight>
    {/* marketing content */}
  </SplitLayoutContentRight>
</SplitLayout>
