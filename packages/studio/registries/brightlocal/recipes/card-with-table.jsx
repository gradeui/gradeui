// CardWithTable — A card containing a data table with proper spacing overrides for multi-section layout.
// keywords: card with table, table in card, admin panel, data panel, card table layout
// components: card, table
// Harvested from BrightLocal's DS MCP (get_composition_recipe "CardWithTable") —
// hand-edit freely; re-running the harvester OVERWRITES this file.

<Card dataHook="users-panel" className="py-0 gap-0">
  <CardHeader className="py-4">
    <CardTitle>Users</CardTitle>
    <CardDescription>Manage your team members.</CardDescription>
  </CardHeader>
  <CardContent className="py-0 px-0">
    <Table dataHook="users-table">
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {/* rows */}
      </TableBody>
    </Table>
  </CardContent>
  <CardFooter className="py-4 justify-end">
    {/* pagination */}
  </CardFooter>
</Card>
