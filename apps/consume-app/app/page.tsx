import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
} from "@grade/ui";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-8 text-foreground">
      <div className="flex flex-col items-center gap-2">
        <Badge>@grade/ui</Badge>
        <h1 className="text-h1">Grade UI — consume app</h1>
        <p className="text-muted">
          Installed from the workspace to validate the public API.
        </p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Hello, Grade</CardTitle>
          <CardDescription>
            If you can see this card styled correctly, the @grade/ui workspace
            package is wired up and the Tailwind preset is applied.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
        </CardContent>
      </Card>
    </main>
  );
}
