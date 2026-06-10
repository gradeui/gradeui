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

### Styles

Import the compiled stylesheet once (e.g. in your root layout). It is fully self-contained — design tokens, the native Tailwind v4 `@theme` bridge, and every utility the components use are baked in; there is no JS Tailwind config to extend (the old `@gradeui/ui/tailwind-preset` export was retired with the v4 native-@theme migration):

```ts
import "@gradeui/ui/styles.css";
```

If your app runs its own Tailwind v4 build alongside Grade, add a `@source` for `node_modules/@gradeui/ui/dist` so your scan picks up the library's class names — the brand and semantic tokens themselves already ship in the stylesheet as CSS variables (`--gds-*`, OKLCH role triplets).

## Theme engine

`@gradeui/ui` ships an OKLCH-based theme generator. Wrap your app in `GradeThemeProvider` (currently still named `GradeThemeProvider` pending rename — see upstream TODO) to get runtime theme switching.

## License

MIT © Grade
