// DrawerForm — A slide-in drawer/sheet containing a form with header, fields, and action buttons.
// keywords: drawer form, sheet form, slide-in form, side panel form, edit drawer, form panel
// components: sheet, field, input, button
// Harvested from BrightLocal's DS MCP (get_composition_recipe "DrawerForm") —
// hand-edit freely; re-running the harvester OVERWRITES this file.

<Sheet>
  <SheetTrigger asChild>
    <Button dataHook="open-drawer">Edit Profile</Button>
  </SheetTrigger>
  <SheetContent dataHook="profile-drawer">
    <SheetHeader>
      <SheetTitle>Edit Profile</SheetTitle>
      <SheetDescription>Make changes to your profile.</SheetDescription>
    </SheetHeader>
    <div className="grid gap-4 py-4">
      <Field>
        <FieldLabel htmlFor="name">Name</FieldLabel>
        <Input id="name" dataHook="profile-name" />
      </Field>
      <Field>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input id="email" dataHook="profile-email" type="email" />
      </Field>
    </div>
    <SheetFooter>
      <Button dataHook="save-profile">Save Changes</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
