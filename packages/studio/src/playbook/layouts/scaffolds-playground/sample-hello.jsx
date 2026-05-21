/**
 * @label   Playground — hello
 * @description Smoke test for the playground bundle. Delete when real experiments arrive.
 * @tags    hello sample playground smoke
 * @notes   This card is just here so the empty-state code path isn't the only thing
 *          the picker exercises on first load. Replace with a real experiment.
 */
import { AppShell, AppShellMain, Stack, Row, Card, CardContent, Button, Badge } from "@gradeui/ui";
import { FlaskConical } from "lucide-react";

export default function App() {
  return (
    <AppShell nav="none" className="min-h-screen bg-background">
      <AppShellMain className="p-6">
        <Stack gap="lg" className="max-w-2xl mx-auto">
          <Row gap="sm" align="center">
            <FlaskConical className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-semibold">Playground</h1>
            <Badge variant="outline" className="ml-1">test scaffold</Badge>
          </Row>
          <Card>
            <CardContent className="p-6">
              <Stack gap="sm">
                <h2 className="text-lg font-semibold">If you can see this card,</h2>
                <p className="text-sm text-muted-foreground">
                  the playground bundle resolved, the picker rendered the card, Fast Frame mounted the
                  scaffold, and the gradeui primitives all imported cleanly. Drop a real experiment in
                  <code className="mx-1 px-1 py-0.5 rounded bg-muted text-foreground">packages/studio/src/playbook/layouts/scaffolds-playground/</code>
                  and delete this file.
                </p>
                <Row gap="sm" justify="end">
                  <Button variant="outline" size="sm">Delete me</Button>
                  <Button size="sm">Add a real experiment</Button>
                </Row>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </AppShellMain>
    </AppShell>
  );
}

// ────────────────────────────────────────────────────────────────────
// DS gaps surfaced by this scaffold
// ────────────────────────────────────────────────────────────────────
//
// (No new DS gaps — this layout composes cleanly from existing
// primitives. Every real playground scaffold ends with a block like
// this listing the patterns it had to hand-roll because no Grade
// primitive covers them yet. Even when the block is empty, it stays
// in — so the gap audit across the folder is consistent.)
