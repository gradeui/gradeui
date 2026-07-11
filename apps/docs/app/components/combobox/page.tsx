"use client";
import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import { InstallBlock } from "@/components/install-block";

import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
} from "@/components/ui/combobox";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";

const frameworks = ["Next.js", "React", "Remix", "Astro", "Vite", "Nuxt"];
const labels = ["bug", "feature", "docs", "chore", "design"];

const comboboxProps = [
  {
    name: "items",
    type: "T[]",
    default: "-",
    description:
      "The pool to filter as the user types. Pair with a render-function child on ComboboxList.",
  },
  {
    name: "value / defaultValue",
    type: "T | T[] | null",
    default: "null",
    description:
      "Controlled / uncontrolled selection. An array when multiple is set.",
  },
  {
    name: "onValueChange",
    type: "(next) => void",
    default: "-",
    description: "Fired with the next selection.",
  },
  {
    name: "multiple",
    type: "boolean",
    default: "false",
    description:
      "Enable multi-select. Render the selection with ComboboxChips / ComboboxChip.",
  },
  {
    name: "ComboboxInput · showTrigger",
    type: "boolean",
    default: "true",
    description: "Show the trailing chevron button that opens the list.",
  },
  {
    name: "ComboboxInput · showClear",
    type: "boolean",
    default: "false",
    description: "Show a clear (×) button to reset the value.",
  },
];

export default function ComboboxPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
          Combobox
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          A searchable picker with type-to-filter, built on the Base UI Combobox
          primitive and composed from InputGroup. Compositional — you render
          ComboboxItem children rather than passing an options array. Single
          select by default; add multiple for tag-style chips.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Installation
        </h2>
        <InstallBlock>{`import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@gradeui/ui"`}</InstallBlock>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <ComponentPreview
          code={`<Combobox items={frameworks}>
  <ComboboxInput placeholder="Search framework…" />
  <ComboboxContent>
    <ComboboxEmpty>No framework found.</ComboboxEmpty>
    <ComboboxList>
      {(item) => (
        <ComboboxItem key={item} value={item}>
          {item}
        </ComboboxItem>
      )}
    </ComboboxList>
  </ComboboxContent>
</Combobox>`}
        >
          <div className="w-64">
            <Combobox items={frameworks}>
              <ComboboxInput placeholder="Search framework…" />
              <ComboboxContent>
                <ComboboxEmpty>No framework found.</ComboboxEmpty>
                <ComboboxList>
                  {(item: string) => (
                    <ComboboxItem key={item} value={item}>
                      {item}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Examples
        </h2>

        <h3 className="text-lg font-medium">Clearable</h3>
        <p className="text-muted-foreground">
          showClear on ComboboxInput adds a × button to reset the value.
        </p>
        <ComponentPreview
          code={`<Combobox items={frameworks} defaultValue="React">
  <ComboboxInput showClear placeholder="Framework…" />
  <ComboboxContent>
    <ComboboxList>
      {(item) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
    </ComboboxList>
  </ComboboxContent>
</Combobox>`}
        >
          <div className="w-64">
            <Combobox items={frameworks} defaultValue="React">
              <ComboboxInput showClear placeholder="Framework…" />
              <ComboboxContent>
                <ComboboxList>
                  {(item: string) => (
                    <ComboboxItem key={item} value={item}>
                      {item}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        </ComponentPreview>

        <h3 className="text-lg font-medium">Multiple — chips</h3>
        <p className="text-muted-foreground">
          Pass multiple and render the selection with ComboboxChips +
          ComboboxChip. Each chip carries its own remove button.
        </p>
        <ComponentPreview
          code={`<Combobox items={labels} multiple>
  <ComboboxChips>
    <ComboboxChip />
    <ComboboxChipsInput placeholder="Add labels…" />
  </ComboboxChips>
  <ComboboxContent>
    <ComboboxList>
      {(item) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
    </ComboboxList>
  </ComboboxContent>
</Combobox>`}
        >
          <div className="w-72">
            <Combobox items={labels} multiple>
              <ComboboxChips>
                <ComboboxChip />
                <ComboboxChipsInput placeholder="Add labels…" />
              </ComboboxChips>
              <ComboboxContent>
                <ComboboxList>
                  {(item: string) => (
                    <ComboboxItem key={item} value={item}>
                      {item}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Props
        </h2>
        <PropsTable props={comboboxProps} />
        <p className="text-muted-foreground">
          The full slot list (ComboboxGroup, ComboboxLabel, ComboboxSeparator,
          ComboboxTrigger, …) is in the contract below.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          When to reach for which
        </h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>
            <strong>Combobox</strong> — type-to-filter; single value, or
            multiple as chips.
          </li>
          <li>
            <strong>Select</strong> — a short fixed list with no search.
          </li>
          <li>
            <strong>Command</strong> — command palettes and async lists.
          </li>
        </ul>
      </div>

      <SidecarBlock slug="combobox" />

      <ComponentNav currentHref="/components/combobox" />
    </div>
  );
}
