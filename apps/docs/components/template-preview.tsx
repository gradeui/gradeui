"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar } from "@/components/ui/avatar";
import { SideMenu } from "@/components/ui/side-menu";
import { TopMenu } from "@/components/ui/top-menu";
import { SimpleTabs, SimpleTabsPanel } from "@/components/ui/simple-tabs";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import {
  LayoutDashboard,
  Zap,
  Battery,
  Home,
  Settings,
  User,
  MapPin,
  Calendar,
  TrendingUp,
  Bell,
  Star,
  Check
} from "lucide-react";

const chartData = [
  { time: "00:00", value: 20 },
  { time: "06:00", value: 45 },
  { time: "12:00", value: 80 },
  { time: "18:00", value: 35 },
  { time: "24:00", value: 15 },
];

const chartConfig = {
  value: {
    label: "Energy",
    color: "oklch(var(--primary))",
  },
};

export function TemplatePreview({ templateId }: { templateId: string }) {
  const previews: Record<string, React.ReactNode> = {
    "energy-dashboard": (
      <div className="w-full h-full bg-background p-4 space-y-3 overflow-hidden">
        {/* Mini header */}
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary/20 flex items-center justify-center">
              <Zap className="h-3 w-3 text-primary" />
            </div>
            <span className="text-xs font-medium">Energy Dashboard</span>
          </div>
          <Badge variant="success" className="text-xs px-2 py-0">Live</Badge>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-2">
            <div className="text-xs text-muted-foreground">Production</div>
            <div className="text-lg font-bold">4.2 kW</div>
          </Card>
          <Card className="p-2">
            <div className="text-xs text-muted-foreground">Storage</div>
            <div className="text-lg font-bold">85%</div>
          </Card>
          <Card className="p-2">
            <div className="text-xs text-muted-foreground">Grid</div>
            <div className="text-lg font-bold">0.8 kW</div>
          </Card>
        </div>

        {/* Chart */}
        <Card className="p-3">
          <div className="text-xs font-medium mb-2">Energy Flow (24h)</div>
          <div className="h-20">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="fillEnergy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis hide />
                <Area
                  dataKey="value"
                  type="monotone"
                  fill="url(#fillEnergy)"
                  fillOpacity={0.4}
                  stroke="var(--color-value)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </Card>
      </div>
    ),

    "site-overview": (
      <div className="w-full h-full bg-background p-4 space-y-3 overflow-hidden">
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium">Central Office</span>
          </div>
        </div>

        {/* Map placeholder */}
        <div className="h-24 bg-muted rounded-lg flex items-center justify-center border">
          <MapPin className="h-6 w-6 text-muted-foreground" />
        </div>

        {/* Device list */}
        <Card className="p-3 space-y-2">
          <div className="text-xs font-medium">Devices</div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3" />
              <span>Solar Inverter</span>
            </div>
            <Badge variant="success" className="text-xs px-1.5 py-0">Online</Badge>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Battery className="h-3 w-3" />
              <span>Battery</span>
            </div>
            <Badge variant="success" className="text-xs px-1.5 py-0">Online</Badge>
          </div>
        </Card>
      </div>
    ),

    "analytics-dashboard": (
      <div className="w-full h-full bg-background p-4 space-y-3 overflow-hidden">
        <div className="flex items-center justify-between pb-2 border-b">
          <span className="text-xs font-medium">Analytics</span>
          <Button size="sm" variant="outline" className="h-6 text-xs px-2">
            Filter
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Card className="p-3">
            <div className="text-xs text-muted-foreground mb-2">Bar Chart</div>
            <div className="h-16">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart data={chartData.slice(0, 4)}>
                  <XAxis dataKey="time" hide />
                  <YAxis hide />
                  <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground mb-2">Area Chart</div>
            <div className="h-16">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <AreaChart data={chartData.slice(0, 4)}>
                  <XAxis dataKey="time" hide />
                  <YAxis hide />
                  <Area dataKey="value" type="monotone" fill="var(--color-value)" stroke="var(--color-value)" />
                </AreaChart>
              </ChartContainer>
            </div>
          </Card>
        </div>

        <Card className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Metrics</span>
            <TrendingUp className="h-3 w-3 text-success" />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Energy</span>
              <span className="font-medium">124.5 kWh</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Peak Power</span>
              <span className="font-medium">8.2 kW</span>
            </div>
          </div>
        </Card>
      </div>
    ),

    "settings-page": (
      <div className="w-full h-full bg-background p-4 space-y-3 overflow-hidden">
        <div className="pb-2 border-b">
          <span className="text-xs font-medium">Settings</span>
        </div>

        <div className="flex gap-1 text-xs border-b">
          <button className="px-2 py-1 border-b-2 border-primary">Account</button>
          <button className="px-2 py-1 text-muted-foreground">Notifications</button>
          <button className="px-2 py-1 text-muted-foreground">Security</button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Full Name</Label>
            <Input className="h-7 text-xs" placeholder="John Doe" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Email</Label>
            <Input className="h-7 text-xs" placeholder="john@example.com" />
          </div>
          <Separator />
          <Button size="sm" className="w-full h-7 text-xs">
            Save Changes
          </Button>
        </div>
      </div>
    ),

    "user-profile": (
      <div className="w-full h-full bg-background p-4 space-y-3 overflow-hidden">
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground text-sm">
                JD
              </div>
            </Avatar>
            <div>
              <div className="text-sm font-medium">John Doe</div>
              <div className="text-xs text-muted-foreground">john@example.com</div>
            </div>
          </div>
        </Card>

        <Card className="p-3 space-y-2">
          <div className="text-xs font-medium">Profile Information</div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role</span>
              <span>Admin</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member since</span>
              <span>Jan 2024</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Location</span>
              <span>Remote</span>
            </div>
          </div>
        </Card>
      </div>
    ),

    "login-page": (
      <div className="w-full h-full bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-[200px] p-4 space-y-3">
          <div className="text-center">
            <div className="text-sm font-bold">Sign In</div>
            <div className="text-xs text-muted-foreground">Welcome back</div>
          </div>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input className="h-7 text-xs" placeholder="email@example.com" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Password</Label>
              <Input className="h-7 text-xs" type="password" placeholder="••••••••" />
            </div>
            <Button size="sm" className="w-full h-7 text-xs">
              Sign In
            </Button>
          </div>
        </Card>
      </div>
    ),

    "signup-page": (
      <div className="w-full h-full bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-[200px] p-4 space-y-3">
          <div className="text-center">
            <div className="text-sm font-bold">Create Account</div>
            <div className="text-xs text-muted-foreground">Get started today</div>
          </div>
          <div className="space-y-2">
            <Input className="h-7 text-xs" placeholder="Full name" />
            <Input className="h-7 text-xs" placeholder="Email" />
            <Input className="h-7 text-xs" type="password" placeholder="Password" />
            <Button size="sm" className="w-full h-7 text-xs">
              Sign Up
            </Button>
          </div>
        </Card>
      </div>
    ),

    "device-list": (
      <div className="w-full h-full bg-background p-4 space-y-3 overflow-hidden">
        <div className="flex items-center justify-between pb-2 border-b">
          <span className="text-xs font-medium">Devices</span>
          <Button size="sm" variant="outline" className="h-6 text-xs px-2">
            Add Device
          </Button>
        </div>

        <div className="space-y-2">
          {[
            { name: "Solar Inverter", status: "Online", icon: Zap },
            { name: "Battery Storage", status: "Online", icon: Battery },
            { name: "Smart Meter", status: "Offline", icon: Home },
          ].map((device, i) => (
            <Card key={i} className="p-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <device.icon className="h-4 w-4" />
                <div>
                  <div className="text-xs font-medium">{device.name}</div>
                  <div className="text-xs text-muted-foreground">ID: {1000 + i}</div>
                </div>
              </div>
              <Badge
                variant={device.status === "Online" ? "success" : "secondary"}
                className="text-xs px-1.5 py-0"
              >
                {device.status}
              </Badge>
            </Card>
          ))}
        </div>
      </div>
    ),

    "site-details": (
      <div className="w-full h-full bg-background p-4 space-y-3 overflow-hidden">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Home className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium">Central Office</span>
        </div>

        <div className="flex gap-1 text-xs border-b">
          <button className="px-2 py-1 border-b-2 border-primary">Overview</button>
          <button className="px-2 py-1 text-muted-foreground">Devices</button>
          <button className="px-2 py-1 text-muted-foreground">History</button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Card className="p-2">
            <div className="text-xs text-muted-foreground">Location</div>
            <div className="text-xs font-medium">Remote</div>
          </Card>
          <Card className="p-2">
            <div className="text-xs text-muted-foreground">Capacity</div>
            <div className="text-xs font-medium">10 kW</div>
          </Card>
        </div>

        <Card className="p-3">
          <div className="text-xs font-medium mb-2">Performance</div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Today</span>
                <span>32.4 kWh</span>
              </div>
              <Progress value={75} className="h-1" />
            </div>
          </div>
        </Card>
      </div>
    ),

    "ai-assistant": (
      <div className="w-full h-full bg-background p-4 flex flex-col">
        <div className="flex items-center gap-2 pb-2 border-b mb-3">
          <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs">AI</span>
          </div>
          <span className="text-xs font-medium">Energy Assistant</span>
        </div>

        <div className="flex-1 space-y-2 overflow-hidden">
          <div className="bg-primary/10 rounded-lg p-2 text-xs">
            Hello! How can I help with your energy system today?
          </div>
          <div className="bg-muted rounded-lg p-2 text-xs ml-8">
            Show me today's production
          </div>
          <div className="bg-primary/10 rounded-lg p-2 text-xs">
            Your system produced 28.4 kWh today, which is 12% above average.
          </div>
        </div>

        <div className="mt-3 pt-3 border-t">
          <Input className="h-7 text-xs" placeholder="Ask a question..." />
        </div>
      </div>
    ),

    "notifications-center": (
      <div className="w-full h-full bg-background p-4 space-y-3 overflow-hidden">
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="text-xs font-medium">Notifications</span>
          </div>
          <Badge variant="secondary" className="text-xs px-1.5 py-0">3</Badge>
        </div>

        <div className="space-y-2">
          {[
            { title: "System Update", time: "5m ago", type: "info" },
            { title: "High Production", time: "1h ago", type: "success" },
            { title: "Battery Low", time: "2h ago", type: "warning" },
          ].map((notif, i) => (
            <Card key={i} className="p-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-xs font-medium">{notif.title}</div>
                  <div className="text-xs text-muted-foreground">{notif.time}</div>
                </div>
                <Badge
                  variant={notif.type as any}
                  className="text-xs px-1.5 py-0"
                >
                  {notif.type}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>
    ),

    "product-landing": (
      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 p-4 space-y-3 overflow-hidden">
        {/* Hero */}
        <div className="text-center space-y-2 pb-3 border-b">
          <div className="text-sm font-bold">Transform Your Energy</div>
          <div className="text-xs text-muted-foreground">Modern design system</div>
          <div className="flex gap-2 justify-center">
            <Button size="sm" className="h-6 text-xs px-3">Get Started</Button>
            <Button size="sm" variant="outline" className="h-6 text-xs px-3">Learn More</Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Zap, title: "Real-time" },
            { icon: BarChart, title: "Analytics" },
            { icon: Bell, title: "Alerts" },
          ].map((feature, i) => (
            <Card key={i} className="p-2 text-center">
              <feature.icon className="h-4 w-4 text-primary mx-auto mb-1" />
              <div className="text-xs font-medium">{feature.title}</div>
            </Card>
          ))}
        </div>

        {/* Testimonial */}
        <Card className="p-2">
          <div className="flex gap-0.5 mb-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-2 w-2 fill-primary text-primary" />
            ))}
          </div>
          <div className="text-xs">
            "Game-changing platform for energy management"
          </div>
          <div className="text-xs text-muted-foreground mt-1">- Sarah J.</div>
        </Card>
      </div>
    ),

    "pricing-page": (
      <div className="w-full h-full bg-background p-4 space-y-3 overflow-hidden">
        {/* Header */}
        <div className="text-center pb-2 border-b">
          <div className="text-sm font-bold">Simple Pricing</div>
          <div className="text-xs text-muted-foreground">Choose your plan</div>
        </div>

        {/* Pricing tiers */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { name: "Starter", price: "$49", highlight: false },
            { name: "Pro", price: "$149", highlight: true },
            { name: "Enterprise", price: "Custom", highlight: false },
          ].map((plan, i) => (
            <Card
              key={i}
              className={`p-2 text-center ${plan.highlight ? "border-primary bg-primary/5" : ""}`}
            >
              <div className="text-xs font-medium">{plan.name}</div>
              <div className="text-sm font-bold my-1">{plan.price}</div>
              <div className="space-y-1 text-xs">
                <div className="flex items-start gap-1">
                  <Check className="h-3 w-3 text-primary flex-shrink-0" />
                  <span className="text-left">Feature 1</span>
                </div>
                <div className="flex items-start gap-1">
                  <Check className="h-3 w-3 text-primary flex-shrink-0" />
                  <span className="text-left">Feature 2</span>
                </div>
              </div>
              <Button
                size="sm"
                variant={plan.highlight ? "default" : "outline"}
                className="w-full h-6 text-xs mt-2"
              >
                Select
              </Button>
            </Card>
          ))}
        </div>

        {/* FAQ preview */}
        <div className="text-xs">
          <div className="font-medium mb-1">FAQs</div>
          <div className="text-muted-foreground">Can I change plans later?</div>
        </div>
      </div>
    ),
  };

  return (
    <div className="w-full h-[300px] border border-border rounded-lg overflow-hidden bg-muted/20">
      {previews[templateId] || (
        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
          Preview coming soon
        </div>
      )}
    </div>
  );
}
