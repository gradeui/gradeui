// Example usage of the CodeEditor component

import { CodeEditor } from "@/components/code-editor";

// Example 1: Simple usage with just code
export function SimpleExample() {
  const code = `import { Button } from "./components/ui/button"

export default function App() {
  return (
    <div className="p-8">
      <Button>Click me</Button>
    </div>
  )
}`;

  return <CodeEditor code={code} />;
}

// Example 2: With title and custom view mode
export function WithTitleExample() {
  const code = `import { Card, CardHeader, CardTitle, CardContent } from "./components/ui/card"

export default function App() {
  return (
    <div className="p-8">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Card content goes here</p>
        </CardContent>
      </Card>
    </div>
  )
}`;

  return (
    <CodeEditor
      code={code}
      title="Card Example"
      defaultViewMode="preview"
    />
  );
}

// Example 3: With custom header content and visual editor enabled
export function FullFeaturedExample() {
  const code = `import { Button } from "./components/ui/button"
import { Badge } from "./components/ui/badge"

export default function App() {
  return (
    <div className="p-8 space-y-4">
      <div className="flex gap-2">
        <Button>Primary</Button>
        <Button variant="outline">Outline</Button>
      </div>
      <div className="flex gap-2">
        <Badge>Default</Badge>
        <Badge variant="success">Success</Badge>
      </div>
    </div>
  )
}`;

  return (
    <CodeEditor
      code={code}
      title="Component Showcase"
      defaultViewMode="split"
      enableVisualEditor={true}
      showViewModeToggle={true}
      headerContent={
        <button className="text-sm text-muted-foreground hover:text-foreground">
          Save
        </button>
      }
      onCodeChange={(newCode) => {
        console.log("Code changed:", newCode);
      }}
    />
  );
}

// Example 4: In a modal/dialog
export function ModalExample() {
  const code = `import { Alert, AlertTitle, AlertDescription } from "./components/ui/alert"
import { Info } from "lucide-react"

export default function App() {
  return (
    <div className="p-8">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Info</AlertTitle>
        <AlertDescription>This is an informational alert.</AlertDescription>
      </Alert>
    </div>
  )
}`;

  return (
    <div className="h-[600px]">
      <CodeEditor
        code={code}
        title="Alert Example"
        height="100%"
        defaultViewMode="split"
      />
    </div>
  );
}

// Example 5: Embedded in a page with custom component files
export function CustomComponentsExample() {
  const code = `import { CustomWidget } from "./components/custom-widget"

export default function App() {
  return (
    <div className="p-8">
      <CustomWidget title="My Widget" />
    </div>
  )
}`;

  const customFiles = {
    "/components/custom-widget.tsx": `import * as React from "react"

interface CustomWidgetProps {
  title: string;
}

export function CustomWidget({ title }: CustomWidgetProps) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">Custom widget content</p>
    </div>
  )
}`,
  };

  return (
    <CodeEditor
      code={code}
      title="Custom Components"
      componentFiles={customFiles}
    />
  );
}
