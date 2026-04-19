# @gradeui/ui

React component library for the [Grade Design System](https://gradeui.com). Built on Tailwind CSS + Radix primitives, with a built-in OKLCH-based theme engine for runtime skinning.

## Install

```bash
npm install @gradeui/ui
# or
pnpm add @gradeui/ui
```

## Usage

```tsx
import { Button, Card, CardContent } from "@gradeui/ui";
import "@gradeui/ui/styles.css";

export default function Example() {
  return (
    <Card>
      <CardContent>
        <Button>Hello, Grade</Button>
      </CardContent>
    </Card>
  );
}
```

### Tailwind preset

If you're using Tailwind in your consuming app, extend the Grade preset so brand tokens and OKLCH semantic colors resolve correctly:

```ts
// tailwind.config.ts
import gradePreset from "@gradeui/ui/tailwind-preset";

export default {
  presets: [gradePreset],
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./node_modules/@gradeui/ui/dist/**/*.{js,mjs}",
  ],
};
```

## Theme engine

`@gradeui/ui` ships an OKLCH-based theme generator. Wrap your app in `GradeThemeProvider` (currently still named `RampThemeProvider` pending rename — see upstream TODO) to get runtime theme switching.

## License

MIT © Grade
