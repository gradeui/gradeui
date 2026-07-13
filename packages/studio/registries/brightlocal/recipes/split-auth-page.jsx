// SplitAuthPage — A two-column auth page using SplitLayout with a sticky marketing column on the right.
// keywords: split auth, two column auth, split login, split signup, split layout auth, auth with marketing
// components: split-layout, header, logo, card
// Harvested from BrightLocal's DS MCP (get_composition_recipe "SplitAuthPage") —
// hand-edit freely; re-running the harvester OVERWRITES this file.

import { SplitLayout, SplitLayoutHeader, SplitLayoutContentLeft, SplitLayoutContentRight } from "@brightlocal/ui-components/split-layout";
import { Header } from "@brightlocal/ui-components/header";
import { Logo } from "@brightlocal/ui-components/logo";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@brightlocal/ui-components/card";
import { Button } from "@brightlocal/ui-components/button";
import { Field, FieldLabel } from "@brightlocal/ui-components/field";
import { Input } from "@brightlocal/ui-components/input";

<SplitLayout dataHook="split-auth-layout">
  <SplitLayoutHeader>
    <Header dataHook="split-auth-header">
      <Logo dataHook="split-auth-logo" />
    </Header>
  </SplitLayoutHeader>
  <SplitLayoutContentLeft>
    <Card dataHook="split-auth-card" className="max-w-md">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
      </CardHeader>
      <CardContent>
        <Field>
          <FieldLabel htmlFor="name">Full name</FieldLabel>
          <Input id="name" dataHook="split-auth-name-input" />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" dataHook="split-auth-email-input" type="email" />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input id="password" dataHook="split-auth-password-input" type="password" />
        </Field>
      </CardContent>
      <CardFooter>
        <Button dataHook="split-auth-submit" className="w-full">Sign up</Button>
      </CardFooter>
    </Card>
  </SplitLayoutContentLeft>
  <SplitLayoutContentRight>
    <div className="sticky top-0 flex h-screen flex-col items-center justify-center bg-muted p-8">
      <h2 className="text-2xl font-bold">Grow your local presence</h2>
      <p className="mt-2 text-muted-foreground">Join thousands of businesses improving their local SEO.</p>
    </div>
  </SplitLayoutContentRight>
</SplitLayout>
