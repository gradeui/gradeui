---
name: Menubar
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/menubar"
subcomponents: [MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarCheckboxItem, MenubarRadioGroup, MenubarLabel, MenubarSeparator, MenubarShortcut, MenubarSub]
props:
  - value?: string
  - defaultValue?: string — The value of the menu that should be open when initially rendered (uncontrolled)
  - onValueChange?
  - loop?: boolean
  - dir?
  - key?
  - asChild?: boolean
  - ref? — Allows getting a ref to the component instance. Once the component unmounts, React will set `ref.current` to `null` (or call the ref with `null` if you passed a callback ref). @see {@link https://react.dev/learn/referencing-values-with-refs#refs-and-the-dom React Docs}
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - checked?: boolean — MenubarCheckboxItem:
  - closeOnSelect?: boolean — MenubarCheckboxItem:
  - onCheckedChange? — MenubarCheckboxItem:
  - disabled?: boolean — MenubarItem:
  - inset?: boolean — MenubarItem:
---

```jsx
<Menubar dataHook="app-menu">
  <MenubarMenu>
    <MenubarTrigger>File</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>
        New Tab <MenubarShortcut>⌘T</MenubarShortcut>
      </MenubarItem>
      <MenubarSeparator />
      <MenubarItem>Close</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>
```
```jsx
<Menubar
  dataHook="menubar-checkbox"
  defaultValue="view"
>
  <MenubarMenu>
    <MenubarTrigger>
      File
    </MenubarTrigger>
    <MenubarContent>
      <MenubarItem>
        New Tab{' '}
        <MenubarShortcut>
          ⌘T
        </MenubarShortcut>
      </MenubarItem>
      <MenubarItem>
        New Window{' '}
        <MenubarShortcut>
          ⌘N
        </MenubarShortcut>
      </MenubarItem>
      <MenubarItem disabled>
        New Incognito Window
      </MenubarItem>
      <MenubarSeparator />
      <MenubarSub>
        <MenubarSubTrigger>
          Share
        </MenubarSubTrigger>
        <MenubarSubContent>
          <MenubarItem>
            Email link
          </MenubarItem>
          <MenubarItem>
            Messages
          </MenubarItem>
          <MenubarItem>
            Notes
          </MenubarItem>
        </MenubarSubContent>
      </MenubarSub>
      <MenubarSeparator />
      <MenubarItem>
        Print{' '}
        <MenubarShortcut>
          ⌘P
        </MenubarShortcut>
      </MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu>
    <MenubarTrigger>
      Edit
    </MenubarTrigger>
    <MenubarContent>
      <MenubarItem>

/* …truncated */
```
```jsx
<Menubar
  dataHook="menubar-radio"
  defaultValue="profiles"
>
  <MenubarMenu>
    <MenubarTrigger>
      File
    </MenubarTrigger>
  </MenubarMenu>
  <MenubarMenu>
    <MenubarTrigger>
      Edit
    </MenubarTrigger>
  </MenubarMenu>
  <MenubarMenu value="profiles">
    <MenubarTrigger>
      Profiles
    </MenubarTrigger>
    <MenubarContent>
      <MenubarRadioGroup
        onValueChange={function z0e(){}}
        value="work"
      >
        <MenubarRadioItem
          value="personal"
        >
          Personal
        </MenubarRadioItem>
        <MenubarRadioItem
          value="work"
        >
          Work
        </MenubarRadioItem>
        <MenubarRadioItem
          value="guest"
        >
          Guest
        </MenubarRadioItem>
      </MenubarRadioGroup>
    </MenubarContent>
  </MenubarMenu>
</Menubar>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-menubar--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
