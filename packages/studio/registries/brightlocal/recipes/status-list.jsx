// StatusList — A list of items with avatars, descriptions, and status badges.
// keywords: status list, user list, member list, item list with status, list with avatars, contact list
// components: avatar, badge, separator
// Harvested from BrightLocal's DS MCP (get_composition_recipe "StatusList") —
// hand-edit freely; re-running the harvester OVERWRITES this file.

<div className="divide-y divide-border">
  {items.map((item) => (
    <div key={item.id} className="flex items-center gap-4 py-3">
      <Avatar dataHook={`avatar-${item.id}`}>
        <AvatarImage src={item.avatar} />
        <AvatarFallback>{item.initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.name}</p>
        <p className="text-xs text-muted-foreground">{item.email}</p>
      </div>
      <Badge dataHook={`status-${item.id}`} variant={item.active ? "default" : "secondary"}>
        {item.active ? "Active" : "Inactive"}
      </Badge>
    </div>
  ))}
</div>
