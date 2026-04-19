# CodeEditor Component

A reusable, full-featured code editor component with live preview, built on Sandpack. Perfect for documentation, playgrounds, templates, and anywhere you need interactive code editing.

## Features

- **Multiple View Modes**: Preview-only, Code-only, Split view, and Visual editor (placeholder for future integration)
- **Live Preview**: See changes in real-time with hot module reloading
- **Design System Integration**: Pre-configured with all Grade Design System components
- **Customizable**: Add custom component files, modify styling, adjust behavior
- **Reusable**: Use anywhere in your app - templates, docs, playgrounds, modals
- **Future-Ready**: Built with visual editor support in mind for tools like Figma/Subframe integration

## Basic Usage

```tsx
import { CodeEditor } from "@/components/code-editor";

function MyComponent() {
  const code = `import { Button } from "./components/ui/button"

export default function App() {
  return <Button>Click me</Button>
}`;

  return <CodeEditor code={code} />;
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `code` | `string` | Required | The initial code to display in the editor |
| `title` | `string` | - | Optional title shown in the header |
| `showViewModeToggle` | `boolean` | `true` | Show/hide the view mode toggle buttons |
| `defaultViewMode` | `"preview" \| "code" \| "split" \| "visual"` | `"split"` | Initial view mode |
| `componentFiles` | `Record<string, string>` | `{}` | Additional component files to include |
| `onCodeChange` | `(code: string) => void` | - | Callback when code changes |
| `enableVisualEditor` | `boolean` | `false` | Show the "Visual" mode button (placeholder for future integration) |
| `headerContent` | `React.ReactNode` | - | Custom content to show in the header (e.g., Save button, Back link) |
| `height` | `string \| number` | `"100%"` | Height of the editor container |

## View Modes

### Preview Only
Shows only the live preview - great for showcasing components.

```tsx
<CodeEditor
  code={code}
  defaultViewMode="preview"
/>
```

### Code Only
Shows only the code editor - useful for code snippets.

```tsx
<CodeEditor
  code={code}
  defaultViewMode="code"
/>
```

### Split View (Default)
Shows both code editor and preview side-by-side - best for editing and seeing results.

```tsx
<CodeEditor
  code={code}
  defaultViewMode="split"
/>
```

### Visual Mode
Placeholder for future visual editor integration (e.g., Figma, Subframe).

```tsx
<CodeEditor
  code={code}
  enableVisualEditor={true}
  defaultViewMode="visual"
/>
```

## Advanced Examples

### With Title and Header Actions

```tsx
<CodeEditor
  code={code}
  title="Button Example"
  headerContent={
    <>
      <Button onClick={handleSave}>Save</Button>
      <Button variant="outline" onClick={handleReset}>Reset</Button>
    </>
  }
/>
```

### With Custom Components

```tsx
const customComponents = {
  "/components/my-widget.tsx": `
    export function MyWidget() {
      return <div>Custom Widget</div>
    }
  `
};

<CodeEditor
  code={code}
  componentFiles={customComponents}
/>
```

### In a Modal/Dialog

```tsx
<Dialog>
  <DialogContent className="max-w-6xl h-[80vh]">
    <CodeEditor
      code={code}
      title="Edit Template"
      height="100%"
    />
  </DialogContent>
</Dialog>
```

### With Code Change Tracking

```tsx
function MyEditor() {
  const [isDirty, setIsDirty] = useState(false);

  return (
    <CodeEditor
      code={code}
      onCodeChange={(newCode) => {
        setIsDirty(newCode !== code);
        // Auto-save, validate, etc.
      }}
      headerContent={
        isDirty && <Badge variant="warning">Unsaved changes</Badge>
      }
    />
  );
}
```

## Standard Component Files

The editor comes pre-configured with these components:
- Button
- Card (with CardHeader, CardTitle, CardContent, CardFooter, CardDescription)
- Badge
- Input
- Label
- Utility functions (cn)

All components use the Grade Design System styling and are ready to use out of the box.

## Integration with Visual Editors

The `enableVisualEditor` prop prepares the component for future integration with visual design tools:

```tsx
<CodeEditor
  code={code}
  enableVisualEditor={true}
  onCodeChange={(newCode) => {
    // Sync with visual editor
    visualEditor.updateFromCode(newCode);
  }}
/>
```

When a visual editor is integrated (e.g., Subframe, Figma plugin):
1. Users can switch between Code and Visual modes
2. Changes in one mode sync to the other
3. Visual editor provides drag-and-drop UI building
4. Code editor shows the resulting React/TypeScript code

## Use Cases

1. **Template Viewer**: Full-page template editing with live preview
2. **Component Playground**: Interactive component documentation
3. **Code Examples**: Embedded in docs with live demos
4. **In-app Editor**: Let users customize components visually
5. **Learning Tool**: Interactive tutorials and examples
6. **Design Handoff**: Bridge between design (Figma) and code

## Styling

The editor uses Sandpack's dark theme and integrates seamlessly with your design system. The preview inherits all your design tokens (colors, spacing, typography).

## Performance

- Lazy loading of Sandpack
- Efficient re-renders with React
- Hot module reloading for instant preview updates
- CDN-loaded dependencies for faster load times

## Future Enhancements

- [ ] Integration with Figma/Subframe for visual editing
- [ ] AI-powered code suggestions
- [ ] Real-time collaboration
- [ ] Version history and undo/redo
- [ ] Export to CodeSandbox/StackBlitz
- [ ] Screenshot/video capture of preview
- [ ] Responsive preview modes (mobile/tablet/desktop)
