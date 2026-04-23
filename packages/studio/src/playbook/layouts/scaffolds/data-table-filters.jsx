import {
  AppShell, AppShellMain,
  Stack, Row,
  Button, Badge, Input,
  Select, SelectTrigger, SelectContent, SelectValue, SelectItem,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Avatar, AvatarFallback,
  Checkbox,
} from "@gradeui/ui";
import {
  Search, Plus, Download, ChevronLeft, ChevronRight,
  ArrowUpDown, MoreHorizontal,
} from "lucide-react";

export default function App() {
  const customers = [
    { name: "Elena Okafor", email: "elena@acme.co", plan: "Pro", status: "Active", joined: "Mar 2025", initials: "EO" },
    { name: "Marcus Li", email: "marcus@acme.co", plan: "Starter", status: "Active", joined: "Jan 2025", initials: "ML" },
    { name: "Priya Devi", email: "priya@kite.io", plan: "Enterprise", status: "Paused", joined: "Dec 2024", initials: "PD" },
    { name: "Samir Khan", email: "samir@acme.co", plan: "Pro", status: "Active", joined: "Nov 2024", initials: "SK" },
    { name: "Zoe Chen", email: "zoe@zen.so", plan: "Starter", status: "Trial", joined: "Feb 2025", initials: "ZC" },
    { name: "Noah Park", email: "noah@anvil.dev", plan: "Pro", status: "Active", joined: "Oct 2024", initials: "NP" },
    { name: "Ruth Adler", email: "ruth@folio.app", plan: "Enterprise", status: "Active", joined: "Aug 2024", initials: "RA" },
    { name: "Jonas Weber", email: "jonas@weber.de", plan: "Starter", status: "Cancelled", joined: "Jul 2024", initials: "JW" },
  ];
  const statusVariant = (s) =>
    s === "Active" ? "default"
    : s === "Paused" ? "secondary"
    : s === "Trial" ? "outline"
    : "destructive";
  return (
    <AppShell nav="none" className="min-h-screen bg-background">
      <AppShellMain className="p-6">
        <Stack gap="lg">
          <Row justify="between" align="center">
            <Stack gap="xs">
              <h1 className="text-2xl font-semibold">Customers</h1>
              <span className="text-sm text-muted-foreground">48 customers · updated 2 minutes ago</span>
            </Stack>
            <Row gap="sm">
              <Button variant="outline" size="sm">
                <Download className="h-3.5 w-3.5 mr-1.5" /> Export
              </Button>
              <Button size="sm">
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Add customer
              </Button>
            </Row>
          </Row>
          <Row gap="sm" align="center" wrap>
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search by name or email" className="pl-7" />
            </div>
            <Select>
              <SelectTrigger className="w-36"><SelectValue placeholder="All plans" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All plans</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-36"><SelectValue placeholder="Any status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </Row>
          <Row gap="xs" align="center" wrap>
            <span className="text-xs text-muted-foreground">Filters:</span>
            {["Plan: Pro", "Status: Active", "Joined ≥ Jan 2025"].map((f) => (
              <Badge key={f} variant="outline">{f} ×</Badge>
            ))}
            <Button variant="ghost" size="sm" className="text-xs">Clear all</Button>
          </Row>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"><Checkbox /></TableHead>
                  <TableHead>
                    <Row gap="xs" align="center">Name <ArrowUpDown className="h-3 w-3 text-muted-foreground" /></Row>
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <Row gap="xs" align="center">Joined <ArrowUpDown className="h-3 w-3 text-muted-foreground" /></Row>
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.email}>
                    <TableCell><Checkbox /></TableCell>
                    <TableCell>
                      <Row gap="sm" align="center">
                        <Avatar className="h-7 w-7"><AvatarFallback>{c.initials}</AvatarFallback></Avatar>
                        <span className="font-medium">{c.name}</span>
                      </Row>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.email}</TableCell>
                    <TableCell>{c.plan}</TableCell>
                    <TableCell><Badge variant={statusVariant(c.status)}>{c.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{c.joined}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Row justify="between" align="center">
            <span className="text-xs text-muted-foreground">Showing 1–8 of 48</span>
            <Row gap="xs">
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Row>
          </Row>
        </Stack>
      </AppShellMain>
    </AppShell>
  );
}
