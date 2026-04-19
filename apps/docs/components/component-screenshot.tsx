"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AlertCircle, Bold, Italic, Underline } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis } from "recharts";
import { AIChat } from "@/components/ui/ai-chat";

const chartData = [
  { month: "Jan", value: 186 },
  { month: "Feb", value: 305 },
  { month: "Mar", value: 237 },
];

const chartConfig = {
  value: {
    label: "Value",
    color: "oklch(var(--primary))",
  },
};

export function ComponentScreenshot({ name }: { name: string }) {
  const screenshots: Record<string, React.ReactNode> = {
    Button: (
      <div className="flex items-center gap-2">
        <Button size="sm">Button</Button>
        <Button size="sm" variant="outline">
          Outline
        </Button>
      </div>
    ),
    Input: (
      <div className="w-full max-w-[200px]">
        <Input placeholder="Email address" />
      </div>
    ),
    Textarea: (
      <div className="w-full max-w-[200px]">
        <Textarea placeholder="Type your message..." rows={3} />
      </div>
    ),
    Label: (
      <div className="space-y-1">
        <Label>Email address</Label>
        <Input placeholder="name@example.com" className="w-[200px]" />
      </div>
    ),
    Select: (
      <Select defaultValue="option1">
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    ),
    Checkbox: (
      <div className="flex items-center space-x-2">
        <Checkbox id="terms" checked />
        <Label htmlFor="terms" className="text-sm">
          Accept terms
        </Label>
      </div>
    ),
    "Radio Group": (
      <RadioGroup defaultValue="option-one">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option-one" id="option-one" />
          <Label htmlFor="option-one" className="text-sm">
            Option 1
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option-two" id="option-two" />
          <Label htmlFor="option-two" className="text-sm">
            Option 2
          </Label>
        </div>
      </RadioGroup>
    ),
    Switch: (
      <div className="flex items-center space-x-2">
        <Switch id="switch" defaultChecked />
        <Label htmlFor="switch" className="text-sm">
          Enable
        </Label>
      </div>
    ),
    Slider: (
      <div className="w-[200px]">
        <Slider defaultValue={[50]} max={100} step={1} />
      </div>
    ),
    Toggle: (
      <div className="flex gap-2">
        <Toggle aria-label="Toggle bold" pressed>
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle aria-label="Toggle italic">
          <Italic className="h-4 w-4" />
        </Toggle>
      </div>
    ),
    "Toggle Group": (
      <ToggleGroup type="multiple" defaultValue={["bold"]}>
        <ToggleGroupItem value="bold" aria-label="Toggle bold">
          <Bold className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Toggle italic">
          <Italic className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="underline" aria-label="Toggle underline">
          <Underline className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    ),
    Calendar: (
      <Calendar
        mode="single"
        selected={new Date(2024, 0, 15)}
        className="rounded-md border scale-75 origin-top-left"
      />
    ),
    "Date Picker": (
      <div className="w-[200px]">
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          <span>Jan 15, 2024</span>
        </Button>
      </div>
    ),
    Avatar: (
      <div className="flex items-center gap-2">
        <Avatar className="h-10 w-10">
          <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground text-xs">
            JD
          </div>
        </Avatar>
        <Avatar className="h-10 w-10">
          <div className="flex h-full w-full items-center justify-center bg-secondary text-secondary-foreground text-xs">
            AB
          </div>
        </Avatar>
      </div>
    ),
    Badge: (
      <div className="flex items-center gap-2">
        <Badge>Default</Badge>
        <Badge variant="secondary">New</Badge>
        <Badge variant="success">Active</Badge>
      </div>
    ),
    Card: (
      <Card className="w-[240px]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Card Title</CardTitle>
          <CardDescription className="text-xs">Card description goes here</CardDescription>
        </CardHeader>
        <CardContent className="text-xs">Content area</CardContent>
      </Card>
    ),
    Chart: (
      <div className="h-[120px] w-[240px]">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" hide />
            <YAxis hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Area
              dataKey="value"
              type="monotone"
              fill="url(#fillValue)"
              fillOpacity={0.4}
              stroke="var(--color-value)"
            />
          </AreaChart>
        </ChartContainer>
      </div>
    ),
    Table: (
      <div className="w-[240px] text-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-8 text-xs">Name</TableHead>
              <TableHead className="h-8 text-xs">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="py-2 text-xs">Item 1</TableCell>
              <TableCell className="py-2 text-xs">Active</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="py-2 text-xs">Item 2</TableCell>
              <TableCell className="py-2 text-xs">Pending</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    ),
    Skeleton: (
      <div className="space-y-2 w-[200px]">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    ),
    Separator: (
      <div className="w-[200px] space-y-2">
        <div className="text-xs">Section 1</div>
        <Separator />
        <div className="text-xs">Section 2</div>
      </div>
    ),
    "Hover Card": (
      <Button variant="link" className="text-sm">
        @username
      </Button>
    ),
    Alert: (
      <Alert className="w-[240px]">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="text-sm">Alert Title</AlertTitle>
        <AlertDescription className="text-xs">Alert description here</AlertDescription>
      </Alert>
    ),
    Dialog: (
      <Button size="sm">Open Dialog</Button>
    ),
    Popover: (
      <Button size="sm" variant="outline">
        Open Popover
      </Button>
    ),
    Toast: (
      <div className="rounded-lg border bg-background p-3 shadow-lg w-[240px]">
        <div className="text-sm font-semibold">Notification</div>
        <div className="text-xs text-muted-foreground mt-1">Your changes have been saved.</div>
      </div>
    ),
    Tooltip: (
      <Button size="sm" variant="outline">
        Hover me
      </Button>
    ),
    Progress: (
      <div className="w-[200px] space-y-2">
        <Progress value={66} />
      </div>
    ),
    Command: (
      <div className="w-[240px] border rounded-lg p-2 text-xs">
        <Input placeholder="Type a command..." className="h-8 mb-2" />
        <div className="space-y-1">
          <div className="px-2 py-1 hover:bg-accent rounded-sm">Calendar</div>
          <div className="px-2 py-1 hover:bg-accent rounded-sm">Settings</div>
        </div>
      </div>
    ),
    "Dropdown Menu": (
      <Button size="sm" variant="outline">
        Open Menu
      </Button>
    ),
    Tabs: (
      <Tabs defaultValue="tab1" className="w-[240px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tab1" className="text-xs">
            Tab 1
          </TabsTrigger>
          <TabsTrigger value="tab2" className="text-xs">
            Tab 2
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" className="text-xs p-3 border rounded-lg mt-2">
          Content 1
        </TabsContent>
      </Tabs>
    ),
    Accordion: (
      <Accordion type="single" collapsible className="w-[240px]">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-sm py-3">Section 1</AccordionTrigger>
          <AccordionContent className="text-xs">Content here</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger className="text-sm py-3">Section 2</AccordionTrigger>
          <AccordionContent className="text-xs">Content here</AccordionContent>
        </AccordionItem>
      </Accordion>
    ),
    Collapsible: (
      <div className="w-[240px] space-y-2">
        <Button size="sm" variant="outline" className="w-full justify-between">
          <span>Toggle Section</span>
          <span className="text-xs">▼</span>
        </Button>
        <div className="border rounded-lg p-3 text-xs">Collapsible content</div>
      </div>
    ),
    Sheet: (
      <Button size="sm">Open Sheet</Button>
    ),
    "Scroll Area": (
      <ScrollArea className="h-[100px] w-[200px] rounded-md border p-3">
        <div className="space-y-2 text-xs">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i}>Item {i + 1}</div>
          ))}
        </div>
      </ScrollArea>
    ),
    "AI Chat": (
      <div className="w-[240px] h-[160px] border rounded-lg p-3 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="bg-primary/10 rounded-lg p-2 text-xs">Hi, how can I help?</div>
          <div className="bg-muted rounded-lg p-2 text-xs ml-6">Show me the Card component</div>
        </div>
        <Input placeholder="Type a message..." className="h-8 text-xs" />
      </div>
    ),
  };

  return (
    <div className="flex items-center justify-center min-h-[180px] p-6 bg-gradient-to-br from-background to-muted/20">
      {screenshots[name] || (
        <div className="text-sm text-muted-foreground">Preview not available</div>
      )}
    </div>
  );
}
