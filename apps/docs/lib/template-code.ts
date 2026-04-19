// Template code for each template
export const templateCode: Record<string, string> = {
  "usage-dashboard": `import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Badge } from "./components/ui/badge"
import { Zap, TrendingUp, ArrowDown, ArrowUp } from "lucide-react"

const energyData = [
  { time: "00:00", value: 20, height: 20 },
  { time: "03:00", value: 15, height: 15 },
  { time: "06:00", value: 45, height: 45 },
  { time: "09:00", value: 65, height: 65 },
  { time: "12:00", value: 80, height: 80 },
  { time: "15:00", value: 70, height: 70 },
  { time: "18:00", value: 35, height: 35 },
  { time: "21:00", value: 25, height: 25 },
  { time: "24:00", value: 15, height: 15 },
]

export default function EnergyDashboard() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Usage Dashboard</h1>
            <p className="text-sm text-muted-foreground">Real-time monitoring</p>
          </div>
        </div>
        <Badge variant="success">Live</Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2 kW</div>
            <p className="text-xs text-muted-foreground">+12% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">v2.4 deployed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grid</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.8 kW</div>
            <p className="text-xs text-muted-foreground">Importing</p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Activity (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-end justify-between gap-2 px-2">
            {energyData.map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-primary/20 rounded-t-sm relative group cursor-pointer hover:bg-primary/30 transition-colors"
                  style={{ height: \`\${item.height}%\` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-popover border rounded px-2 py-1 text-xs whitespace-nowrap">
                      {item.value}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Total Visits Today</span>
            <span className="font-medium">12,480</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Peak Power</span>
            <span className="font-medium">8.2 kW</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Efficiency</span>
            <span className="font-medium">94.2%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}`,

  "site-overview": `import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Badge } from "./components/ui/badge"
import { Button } from "./components/ui/button"
import { MapPin, Activity, Package } from "lucide-react"

export default function SiteOverview() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Central Office</h1>
            <p className="text-sm text-muted-foreground">Remote</p>
          </div>
        </div>
        <Button>Manage Site</Button>
      </div>

      {/* Map Placeholder */}
      <Card>
        <CardContent className="p-0">
          <div className="h-[300px] bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-2" />
              <p>Map View</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Devices */}
      <Card>
        <CardHeader>
          <CardTitle>Devices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5" />
              <div>
                <div className="font-medium">Marketing Site</div>
                <div className="text-sm text-muted-foreground">ID: 1001</div>
              </div>
            </div>
            <Badge variant="success">Online</Badge>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Battery className="h-5 w-5" />
              <div>
                <div className="font-medium">API Gateway</div>
                <div className="text-sm text-muted-foreground">ID: 1002</div>
              </div>
            </div>
            <Badge variant="success">Online</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}`,

  "analytics-dashboard": `import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Badge } from "./components/ui/badge"
import { TrendingUp, Users, DollarSign, Activity } from "lucide-react"

export default function AnalyticsDashboard() {
  const metrics = [
    { label: "Total Users", value: "2,543", change: "+12.5%", icon: Users },
    { label: "Revenue", value: "$45,231", change: "+8.2%", icon: DollarSign },
    { label: "Active Sessions", value: "573", change: "+23.1%", icon: Activity },
    { label: "Growth Rate", value: "12.5%", change: "+4.1%", icon: TrendingUp },
  ]

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Track your key performance metrics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, i) => {
          const Icon = metric.icon
          return (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {metric.change} from last month
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-2 w-2 bg-primary rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">User action {i}</p>
                  <p className="text-xs text-muted-foreground">{i} hours ago</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {["Alice Johnson", "Bob Smith", "Carol White", "David Brown"].map((name, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                    {name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <span className="text-sm font-medium">{name}</span>
                </div>
                <Badge variant="secondary">{95 - i * 2}%</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}`,

  "settings-page": `import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Input } from "./components/ui/input"
import { Label } from "./components/ui/label"
import { Button } from "./components/ui/button"
import { User, Bell, Shield } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Profile Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" defaultValue="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" defaultValue="Doe" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="john.doe@example.com" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {["Email notifications", "Push notifications", "SMS alerts"].map((item) => (
              <div key={item} className="flex items-center justify-between">
                <span className="text-sm">{item}</span>
                <div className="h-6 w-11 bg-primary rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline">Change Password</Button>
            <Button variant="outline">Enable Two-Factor Authentication</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}`,

  "user-profile": `import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Badge } from "./components/ui/badge"
import { Input } from "./components/ui/input"
import { Label } from "./components/ui/label"
import { Button } from "./components/ui/button"
import { Mail, MapPin, Calendar, Edit } from "lucide-react"

export default function UserProfile() {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center gap-4">
              <div className="h-32 w-32 rounded-full bg-primary/20 flex items-center justify-center text-4xl font-bold">
                JD
              </div>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Change Photo
              </Button>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold">John Doe</h2>
                <p className="text-muted-foreground">Product Designer</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge>Pro Member</Badge>
                <Badge variant="secondary">Verified</Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  john.doe@example.com
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  San Francisco, CA
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Joined March 2024
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input id="title" defaultValue="Product Designer" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Input id="bio" defaultValue="Passionate about creating beautiful user experiences" />
          </div>
          <Button>Update Profile</Button>
        </CardContent>
      </Card>
    </div>
  )
}`,

  "login-page": `import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./components/ui/card"
import { Input } from "./components/ui/input"
import { Label } from "./components/ui/label"
import { Button } from "./components/ui/button"
import { Zap } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="name@example.com" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a href="#" className="text-sm text-primary hover:underline">
                Forgot password?
              </a>
            </div>
            <Input id="password" type="password" />
          </div>
          <Button className="w-full">Sign In</Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline">Google</Button>
            <Button variant="outline">GitHub</Button>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <a href="#" className="text-primary hover:underline">
              Sign up
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}`,

  "signup-page": `import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./components/ui/card"
import { Input } from "./components/ui/input"
import { Label } from "./components/ui/label"
import { Button } from "./components/ui/button"
import { Zap } from "lucide-react"

export default function SignupPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>Enter your information to get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" placeholder="John" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" placeholder="Doe" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="name@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" />
          </div>
          <Button className="w-full">Create Account</Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="#" className="text-primary hover:underline">
              Sign in
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}`,

  "device-list": `import { Card, CardContent } from "./components/ui/card"
import { Input } from "./components/ui/input"
import { Badge } from "./components/ui/badge"
import { Button } from "./components/ui/button"
import { Search, Filter, MoreVertical, Power } from "lucide-react"

export default function DeviceList() {
  const devices = [
    { id: "DEV-001", name: "Marketing Site", type: "Web", status: "Online", power: "v2.4" },
    { id: "DEV-002", name: "API Gateway", type: "API", status: "Deploying", power: "85%" },
    { id: "DEV-003", name: "Docs Portal", type: "Web", status: "Online", power: "v1.9" },
    { id: "DEV-004", name: "Admin Dashboard", type: "Dashboard", status: "Online", power: "v3.1" },
    { id: "DEV-005", name: "Feature Flags", type: "Service", status: "Live", power: "v4.0" },
  ]

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Devices</h1>
          <p className="text-muted-foreground">Manage your connected devices</p>
        </div>
        <Button>Add Device</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search devices..." className="pl-9" />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {devices.map((device) => (
          <Card key={device.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Power className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{device.name}</p>
                    <p className="text-sm text-muted-foreground">{device.id} • {device.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">{device.power}</p>
                    <Badge variant={device.status === "Online" ? "success" : device.status === "Deploying" ? "default" : "destructive"}>
                      {device.status}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}`,

  "site-details": `import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Badge } from "./components/ui/badge"
import { Button } from "./components/ui/button"
import { MapPin, Zap, TrendingUp, Settings } from "lucide-react"

export default function SiteDetails() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-lg bg-primary/20 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Product Hub</h1>
                <p className="text-muted-foreground">ID: SITE-001 • Remote team</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="success">Online</Badge>
                  <Badge variant="secondary">Residential</Badge>
                </div>
              </div>
            </div>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Production</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.4 kW</div>
            <p className="text-xs text-muted-foreground">+18% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Latency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">8,240 requests/min</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grid Status</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Exporting</div>
            <p className="text-xs text-muted-foreground">1.2 kW to grid</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connected Devices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { name: "Marketing Site", status: "Online", value: "v2.4" },
            { name: "Docs Portal", status: "Online", value: "v2.4" },
            { name: "API Gateway", status: "Deploying", value: "92%" },
          ].map((device, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{device.name}</p>
                  <Badge variant="success" className="mt-1">{device.status}</Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">{device.value}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}`,

  "ai-assistant": `import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Input } from "./components/ui/input"
import { Button } from "./components/ui/button"
import { Send, Bot, User } from "lucide-react"

export default function AIAssistant() {
  const messages = [
    { role: "assistant", content: "Hello! I'm your DS assistant. How can I help you explore the design system today?" },
    { role: "user", content: "Show me the Card component examples" },
    { role: "assistant", content: "Sure — here are a few Card examples with different header, content, and footer layouts. Cards respect the active theme so they re-skin when you switch from Ramp to Paper." },
    { role: "user", content: "How do I define a custom theme?" },
    { role: "assistant", content: "A theme is a ThemeInput object — three hues plus a handful of typography, spacing, and radius presets. The generator turns those into a full OKLCH-based palette. You can save custom themes to localStorage from the theme builder." },
  ]

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Assistant
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, i) => (
            <div
              key={i}
              className={\`flex gap-3 \${message.role === "user" ? "flex-row-reverse" : ""}\`}
            >
              <div className={\`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 \${
                message.role === "user" ? "bg-primary/20" : "bg-secondary"
              }\`}>
                {message.role === "user" ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div className={\`rounded-lg p-3 max-w-[80%] \${
                message.role === "user"
                  ? "bg-primary text-primary-foreground ml-auto"
                  : "bg-muted"
              }\`}>
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
        </CardContent>

        <CardContent className="p-4 border-t">
          <div className="flex gap-2">
            <Input placeholder="Ask about components, tokens, or themes..." />
            <Button>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}`,

  "notifications-center": `import { Card, CardContent } from "./components/ui/card"
import { Badge } from "./components/ui/badge"
import { Button } from "./components/ui/button"
import { CheckCircle, AlertTriangle, Info, Trash2 } from "lucide-react"

export default function NotificationsCenter() {
  const notifications = [
    {
      type: "success",
      title: "Milestone reached",
      message: "Your project hit 10k monthly visits!",
      time: "2 hours ago",
      unread: true
    },
    {
      type: "warning",
      title: "Low disk alert",
      message: "Disk usage is above 80%. Consider archiving old data.",
      time: "5 hours ago",
      unread: true
    },
    {
      type: "info",
      title: "System update available",
      message: "A new version of @grade/ui is available for install.",
      time: "1 day ago",
      unread: false
    },
    {
      type: "success",
      title: "Deploy complete",
      message: "Successfully deployed to production.",
      time: "1 day ago",
      unread: false
    },
  ]

  const getIcon = (type: string) => {
    switch (type) {
      case "success": return CheckCircle
      case "warning": return AlertTriangle
      default: return Info
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your projects</p>
        </div>
        <Button variant="outline">Mark all as read</Button>
      </div>

      <div className="space-y-2">
        {notifications.map((notification, i) => {
          const Icon = getIcon(notification.type)
          return (
            <Card key={i} className={notification.unread ? "border-primary/50" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={\`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 \${
                    notification.type === "success" ? "bg-green-500/20" :
                    notification.type === "warning" ? "bg-yellow-500/20" : "bg-blue-500/20"
                  }\`}>
                    <Icon className={\`h-5 w-5 \${
                      notification.type === "success" ? "text-green-600" :
                      notification.type === "warning" ? "text-yellow-600" : "text-blue-600"
                    }\`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{notification.title}</p>
                          {notification.unread && (
                            <div className="h-2 w-2 bg-primary rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {notification.time}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}`,

  "product-landing": `import { SectionBlock } from "./components/ui/section-block"
import { CardBlock } from "./components/ui/card-block"
import { Zap, Shield, BarChart3, Globe2, Star, Quote } from "lucide-react"

export default function ProductLanding() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <SectionBlock
        padding="xl"
        background="gradient"
        alignment="center"
        titleSize="xl"
        fullBleed
        title="Ship Your Product Faster"
        subtitle="Monitor, build beautiful, accessible interfaces with our cutting-edge platform. Join thousands of businesses reducing costs and carbon footprint."
        cta1={{ text: "Start Free Trial", variant: "default", href: "#" }}
        cta2={{ text: "Watch Demo", variant: "outline", href: "#" }}
      />

      {/* Features Section */}
      <SectionBlock
        padding="lg"
        background="transparent"
        alignment="center"
        title="Everything you need to succeed"
        subtitle="Powerful features designed for teams shipping fast"
      >
        <CardBlock
          layout="grid"
          columns={3}
          items={[
            {
              icon: <Zap className="h-5 w-5 text-primary" />,
              title: "Beautiful by Default",
              description: "Track requests, deploys, and errors across all your projects in real-time.",
            },
            {
              icon: <BarChart3 className="h-5 w-5 text-primary" />,
              title: "Advanced Analytics",
              description: "Gain insights with powerful analytics and customizable reports.",
            },
            {
              icon: <Shield className="h-5 w-5 text-primary" />,
              title: "Enterprise Security",
              description: "Bank-level encryption and compliance with industry standards.",
            },
            {
              icon: <Globe2 className="h-5 w-5 text-primary" />,
              title: "Multi-site Management",
              description: "Manage unlimited sites and devices from a single dashboard.",
            },
            {
              icon: <Zap className="h-5 w-5 text-primary" />,
              title: "Smart Automation",
              description: "Automate your workflow with AI-powered suggestions.",
            },
            {
              icon: <BarChart3 className="h-5 w-5 text-primary" />,
              title: "Custom Integrations",
              description: "Connect with your existing tools via our comprehensive API.",
            },
          ]}
        />
      </SectionBlock>

      {/* Product Screenshot */}
      <SectionBlock
        padding="lg"
        background="muted"
        alignment="center"
        title="Beautiful, intuitive interface"
        subtitle="Designed for efficiency and ease of use"
      >
        <div className="max-w-5xl mx-auto">
          <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg shadow-2xl flex items-center justify-center border border-border">
            <div className="text-center space-y-2">
              <BarChart3 className="h-16 w-16 text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Product Screenshot</p>
            </div>
          </div>
        </div>
      </SectionBlock>

      {/* Testimonials Section */}
      <SectionBlock
        padding="lg"
        background="transparent"
        alignment="center"
        title="Trusted by industry leaders"
        subtitle="See what our customers have to say"
      >
        <CardBlock
          layout="grid"
          columns={3}
          items={[
            {
              icon: <Quote className="h-5 w-5 text-primary" />,
              title: "Game-changing platform",
              description: "\\"This design system has transformed how our team ships product. The generator is invaluable.\\"",
              footer: (
                <div className="space-y-1">
                  <p className="font-semibold text-sm">Sarah Johnson</p>
                  <p className="text-xs text-muted-foreground">Energy Manager, Tech Corp</p>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
              ),
            },
            {
              icon: <Quote className="h-5 w-5 text-primary" />,
              title: "Incredible ROI",
              description: "\\"We cut design-to-ship time by 40% in the first quarter. Ramp DS paid for itself immediately.\\"",
              footer: (
                <div className="space-y-1">
                  <p className="font-semibold text-sm">Michael Chen</p>
                  <p className="text-xs text-muted-foreground">CFO, Green Solutions</p>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
              ),
            },
            {
              icon: <Quote className="h-5 w-5 text-primary" />,
              title: "Outstanding support",
              description: "\\"The team's support has been exceptional. They helped us get up and running in days, not weeks.\\"",
              footer: (
                <div className="space-y-1">
                  <p className="font-semibold text-sm">Emma Williams</p>
                  <p className="text-xs text-muted-foreground">Operations Lead, EcoPlus</p>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
              ),
            },
          ]}
        />
      </SectionBlock>

      {/* Stats Section */}
      <SectionBlock
        padding="lg"
        background="card"
        alignment="center"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {[
            { value: "10k+", label: "Active Users" },
            { value: "500+", label: "Enterprise Clients" },
            { value: "99.9%", label: "Uptime SLA" },
            { value: "30%", label: "Avg. Cost Savings" },
          ].map((stat, i) => (
            <div key={i} className="text-center space-y-2">
              <div className="text-4xl font-bold text-primary">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </SectionBlock>

      {/* CTA Section */}
      <SectionBlock
        padding="xl"
        background="primary"
        alignment="center"
        fullBleed
        title="Ready to ship faster?"
        subtitle="Join thousands of businesses already saving costs and reducing their carbon footprint"
        cta1={{ text: "Start Free Trial", variant: "secondary", href: "#" }}
        cta2={{ text: "Contact Sales", variant: "outline", href: "#" }}
      />
    </div>
  )
}`,

  "pricing-page": `import { SectionBlock } from "./components/ui/section-block"
import { CardBlock } from "./components/ui/card-block"
import { FAQBlock } from "./components/ui/faq-block"
import { Button } from "./components/ui/button"
import { Badge } from "./components/ui/badge"
import { Check, Zap, Building2, Rocket } from "lucide-react"

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <SectionBlock
        padding="xl"
        background="gradient"
        alignment="center"
        titleSize="xl"
        fullBleed
        title="Simple, transparent pricing"
        subtitle="Choose the perfect plan for your business. No hidden fees, cancel anytime."
      />

      {/* Pricing Tiers */}
      <SectionBlock
        padding="lg"
        background="transparent"
        alignment="center"
      >
        <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
          {/* Starter Plan */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <h3 className="text-2xl font-bold">Starter</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Perfect for small businesses getting started
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">$49</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-xs text-muted-foreground">Billed monthly</p>
            </div>

            <Button className="w-full" variant="outline">
              Get Started
            </Button>

            <div className="space-y-3 pt-4 border-t border-border">
              <p className="text-sm font-semibold">Includes:</p>
              <ul className="space-y-2">
                {[
                  "Up to 3 sites",
                  "50 devices",
                  "Real-time monitoring",
                  "Basic analytics",
                  "Email support",
                  "7-day data retention",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Professional Plan */}
          <div className="bg-primary text-primary-foreground border-2 border-primary rounded-lg p-6 space-y-6 relative shadow-lg">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground">
              Most Popular
            </Badge>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <h3 className="text-2xl font-bold">Professional</h3>
              </div>
              <p className="text-sm opacity-90">
                For growing businesses with multiple sites
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">$149</span>
                <span className="opacity-90">/month</span>
              </div>
              <p className="text-xs opacity-75">Billed monthly or $1,428/year</p>
            </div>

            <Button className="w-full" variant="secondary">
              Start Free Trial
            </Button>

            <div className="space-y-3 pt-4 border-t border-primary-foreground/20">
              <p className="text-sm font-semibold">Everything in Starter, plus:</p>
              <ul className="space-y-2">
                {[
                  "Up to 20 sites",
                  "Unlimited devices",
                  "Advanced analytics",
                  "Custom reports",
                  "Priority support",
                  "90-day data retention",
                  "API access",
                  "Team collaboration",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary" />
                <h3 className="text-2xl font-bold">Enterprise</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                For large organizations with custom needs
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-4xl font-bold">Custom</div>
              <p className="text-xs text-muted-foreground">Tailored to your requirements</p>
            </div>

            <Button className="w-full" variant="default">
              Contact Sales
            </Button>

            <div className="space-y-3 pt-4 border-t border-border">
              <p className="text-sm font-semibold">Everything in Professional, plus:</p>
              <ul className="space-y-2">
                {[
                  "Unlimited sites",
                  "Unlimited devices",
                  "Custom integrations",
                  "Dedicated support",
                  "SLA guarantees",
                  "Unlimited data retention",
                  "White-label options",
                  "Custom training",
                  "On-premise deployment",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </SectionBlock>

      {/* Feature Comparison */}
      <SectionBlock
        padding="lg"
        background="muted"
        alignment="center"
        title="Compare plans"
        subtitle="Find the right fit for your organization"
      >
        <div className="max-w-4xl mx-auto overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-4 font-semibold">Feature</th>
                <th className="text-center py-4 px-4 font-semibold">Starter</th>
                <th className="text-center py-4 px-4 font-semibold bg-primary/5">Professional</th>
                <th className="text-center py-4 px-4 font-semibold">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: "Sites", starter: "3", pro: "20", enterprise: "Unlimited" },
                { feature: "Devices", starter: "50", pro: "Unlimited", enterprise: "Unlimited" },
                { feature: "Data Retention", starter: "7 days", pro: "90 days", enterprise: "Unlimited" },
                { feature: "API Access", starter: "—", pro: "✓", enterprise: "✓" },
                { feature: "Custom Reports", starter: "—", pro: "✓", enterprise: "✓" },
                { feature: "Priority Support", starter: "—", pro: "✓", enterprise: "✓" },
                { feature: "SLA", starter: "—", pro: "—", enterprise: "99.9%" },
                { feature: "White-label", starter: "—", pro: "—", enterprise: "✓" },
              ].map((row, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="py-3 px-4 text-sm">{row.feature}</td>
                  <td className="py-3 px-4 text-sm text-center text-muted-foreground">{row.starter}</td>
                  <td className="py-3 px-4 text-sm text-center bg-primary/5 font-medium">{row.pro}</td>
                  <td className="py-3 px-4 text-sm text-center text-muted-foreground">{row.enterprise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionBlock>

      {/* FAQs */}
      <SectionBlock
        padding="lg"
        background="transparent"
        alignment="center"
        title="Frequently asked questions"
        subtitle="Everything you need to know about our pricing"
      >
        <FAQBlock
          maxWidth="narrow"
          items={[
            {
              question: "Can I change plans later?",
              answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing adjustments.",
            },
            {
              question: "What payment methods do you accept?",
              answer: "We accept all major credit cards (Visa, MasterCard, American Express) and bank transfers for Enterprise plans. All payments are processed securely through Stripe.",
            },
            {
              question: "Is there a free trial?",
              answer: "Yes! We offer a 14-day free trial on all Professional and Enterprise plans. No credit card required to start.",
            },
            {
              question: "What happens to my data if I cancel?",
              answer: "You can export all your data before canceling. We retain your data for 30 days after cancellation in case you change your mind, then it's permanently deleted.",
            },
            {
              question: "Do you offer discounts for annual billing?",
              answer: "Yes! Save 20% by paying annually on Professional and Enterprise plans. That's like getting 2+ months free.",
            },
            {
              question: "Can I add more sites or devices to my plan?",
              answer: "For Starter and Professional plans, you can upgrade to the next tier. Enterprise customers can add sites and devices with custom pricing.",
            },
          ]}
        />
      </SectionBlock>

      {/* CTA Section */}
      <SectionBlock
        padding="xl"
        background="primary"
        alignment="center"
        fullBleed
        title="Start shipping faster today"
        subtitle="Join teams shipping with Ramp DS"
        cta1={{ text: "Start Free Trial", variant: "secondary", href: "#" }}
        cta2={{ text: "Contact Sales", variant: "outline", href: "#" }}
      />
    </div>
  )
}`,
};

export function getTemplateCode(templateId: string): string {
  return templateCode[templateId] || `import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"

export default function ComingSoon() {
  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The template code for "${templateId}" is coming soon. Check back later!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}`;
}
