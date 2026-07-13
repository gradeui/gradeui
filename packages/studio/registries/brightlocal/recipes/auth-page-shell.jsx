// AuthPageShell — A centered auth page shell using CentredLayout with Logo, Header, and a Card for form content.
// keywords: auth page, centered auth, login centered, centred layout auth, auth shell, password reset page
// components: centred-layout, header, logo, card
// Harvested from BrightLocal's DS MCP (get_composition_recipe "AuthPageShell") —
// hand-edit freely; re-running the harvester OVERWRITES this file.

import { CentredLayout, CentredLayoutHeader, CentredLayoutContent } from "@brightlocal/ui-components/centred-layout";
import { Header } from "@brightlocal/ui-components/header";
import { Logo } from "@brightlocal/ui-components/logo";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@brightlocal/ui-components/card";
import { Button } from "@brightlocal/ui-components/button";
import { Field, FieldLabel } from "@brightlocal/ui-components/field";
import { Input } from "@brightlocal/ui-components/input";

<CentredLayout dataHook="auth-layout">
  <CentredLayoutHeader>
    <Header dataHook="auth-header">
      <Logo dataHook="auth-logo" />
    </Header>
  </CentredLayoutHeader>
  <CentredLayoutContent>
    <Card dataHook="auth-card" className="max-w-md">
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
      </CardHeader>
      <CardContent>
        <Field>
          <FieldLabel htmlFor="email">Email address</FieldLabel>
          <Input id="email" dataHook="auth-email-input" type="email" />
        </Field>
      </CardContent>
      <CardFooter>
        <Button dataHook="auth-submit" className="w-full">Send reset link</Button>
      </CardFooter>
    </Card>
  </CentredLayoutContent>
</CentredLayout>
