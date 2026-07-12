---
name: Menubar
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/menubar"
subcomponents: [MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarCheckboxItem, MenubarRadioGroup, MenubarLabel, MenubarSeparator, MenubarShortcut, MenubarSub]
props:
  - defaultValue? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
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
