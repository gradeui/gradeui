"use client";

import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { SiteHeader } from "@/components/site-header";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Save, FolderOpen, Trash2, X } from "lucide-react";
import { useGradeTheme } from "@/components/grade-theme-provider";
import {
  buildSandpackFiles,
  PLAYGROUND_DEPENDENCIES,
  PLAYGROUND_EXTERNAL_RESOURCES,
} from "@/lib/chat-sandpack";

interface SavedPlayground {
  id: string;
  name: string;
  code: string;
  createdAt: number;
}

const STORAGE_KEY = "rds-playgrounds";

const examples = {
  all: {
    name: "All",
    code: `import { Button } from "./components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./components/ui/card"
import { Input } from "./components/ui/input"
import { Label } from "./components/ui/label"
import { Badge } from "./components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "./components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog"
import { CheckCircle2, AlertTriangle, Info } from "lucide-react"

export default function App() {
  return (
    <div className="p-8 space-y-8 max-w-4xl">
      {/* Buttons */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Buttons</h2>
        <div className="flex flex-wrap gap-2">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </section>

      {/* Badges */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Error</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="info">Info</Badge>
        </div>
      </section>

      {/* Cards & Forms */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Cards & Forms</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>Enter your credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="name@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Sign in</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Settings</CardTitle>
              <CardDescription>Manage your project configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input id="name" defaultValue="My Project" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Input id="desc" placeholder="Enter description..." />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Cancel</Button>
              <Button>Save</Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Alerts */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Alerts</h2>
        <div className="space-y-3">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>This is a default informational alert.</AlertDescription>
          </Alert>
          <Alert variant="success">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>Your changes have been saved.</AlertDescription>
          </Alert>
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>Your session will expire soon.</AlertDescription>
          </Alert>
        </div>
      </section>

      {/* Dialog */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Dialog</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>Make changes to your profile here.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="dialog-name">Name</Label>
                <Input id="dialog-name" defaultValue="John Doe" />
              </div>
            </div>
            <DialogFooter>
              <Button>Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  )
}`,
  },
  button: {
    name: "Button",
    code: `import { Button } from "./components/ui/button"

export default function App() {
  return (
    <div className="flex flex-wrap gap-4 p-8">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  )
}`,
  },
  card: {
    name: "Card",
    code: `import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./components/ui/card"
import { Button } from "./components/ui/button"

export default function App() {
  return (
    <div className="p-8">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Create project</CardTitle>
          <CardDescription>Deploy your new project in one-click.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your project will be deployed to our secure cloud infrastructure.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Cancel</Button>
          <Button>Deploy</Button>
        </CardFooter>
      </Card>
    </div>
  )
}`,
  },
  form: {
    name: "Form",
    code: `import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { Label } from "./components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./components/ui/card"

export default function App() {
  return (
    <div className="p-8">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="name@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Sign in</Button>
        </CardFooter>
      </Card>
    </div>
  )
}`,
  },
  alert: {
    name: "Alert",
    code: `import { Alert, AlertTitle, AlertDescription } from "./components/ui/alert"
import { AlertCircle, CheckCircle2, Info, AlertTriangle, Lightbulb, Sparkles } from "lucide-react"

export default function App() {
  return (
    <div className="p-8 space-y-4 max-w-lg">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Default</AlertTitle>
        <AlertDescription>
          Neutral alert surface for general-purpose messages.
        </AlertDescription>
      </Alert>

      <Alert variant="info">
        <Lightbulb className="h-4 w-4" />
        <AlertTitle>Heads up</AlertTitle>
        <AlertDescription>
          Informational tint — derived from the theme's info token.
        </AlertDescription>
      </Alert>

      <Alert variant="success">
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>
          Your changes have been saved successfully.
        </AlertDescription>
      </Alert>

      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          Your session will expire in 5 minutes.
        </AlertDescription>
      </Alert>

      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Something went wrong. Please try again.
        </AlertDescription>
      </Alert>

      <Alert variant="highlight">
        <Sparkles className="h-4 w-4" />
        <AlertTitle>Highlight</AlertTitle>
        <AlertDescription>
          Draws attention without the weight of a warning.
        </AlertDescription>
      </Alert>
    </div>
  )
}`,
  },
  badge: {
    name: "Badge",
    code: `import { Badge } from "./components/ui/badge"

export default function App() {
  return (
    <div className="p-8 space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="destructive">Destructive</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="success">Online</Badge>
        <Badge variant="warning">Pending</Badge>
        <Badge variant="info">New</Badge>
        <Badge variant="highlight">New</Badge>
      </div>
    </div>
  )
}`,
  },
  dialog: {
    name: "Dialog",
    code: `import { Button } from "./components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog"
import { Input } from "./components/ui/input"
import { Label } from "./components/ui/label"

export default function App() {
  return (
    <div className="p-8">
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open Dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" defaultValue="@johndoe" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}`,
  },
};

// Title bar component that uses Sandpack context
function EditorTitleBar({
  onSave,
  onSaveAsNew,
  activePlayground,
}: {
  onSave: (code: string) => void;
  onSaveAsNew: (code: string) => void;
  activePlayground: SavedPlayground | null;
}) {
  const { sandpack } = useSandpack();

  const handleSave = () => {
    const code = sandpack.files["/App.tsx"]?.code || "";
    onSave(code);
  };

  const handleSaveAsNew = () => {
    const code = sandpack.files["/App.tsx"]?.code || "";
    onSaveAsNew(code);
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
      <div className="flex items-center gap-2">
        {activePlayground ? (
          <>
            <span className="text-sm font-medium text-foreground">{activePlayground.name}</span>
            <span className="text-xs text-muted-foreground">
              Last saved {new Date(activePlayground.createdAt).toLocaleTimeString()}
            </span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Unsaved playground</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1 text-sm rounded-md bg-foreground text-background hover:opacity-90 transition-opacity"
        >
          <Save className="h-3.5 w-3.5" />
          {activePlayground ? "Save" : "Save as..."}
        </button>
        {activePlayground && (
          <button
            onClick={handleSaveAsNew}
            className="flex items-center gap-1.5 px-3 py-1 text-sm rounded-md border border-border bg-background text-foreground hover:bg-muted transition-colors"
          >
            Save as new
          </button>
        )}
      </div>
    </div>
  );
}

export default function PlaygroundPage() {
  const { theme: activeTheme, isDark } = useGradeTheme();
  const [activeExample, setActiveExample] = useState<keyof typeof examples>("all");
  const [currentCode, setCurrentCode] = useState(examples.all.code);
  const [savedPlaygrounds, setSavedPlaygrounds] = useState<SavedPlayground[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDropdown, setShowLoadDropdown] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [sandpackKey, setSandpackKey] = useState(0);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [activePlayground, setActivePlayground] = useState<SavedPlayground | null>(null);

  // Derive the complete Sandpack files object from the active theme so the
  // playground always mirrors whichever theme (and mode) the user picked in
  // the nav. Sandpack owns the editor state once mounted, so updating
  // `currentCode` here only takes effect on sandpackKey bumps (example
  // click, save/load, mode flip) — which is exactly what we want.
  const playgroundMode = isDark ? "dark" : "light";
  const sandpackFiles = useMemo(
    () =>
      buildSandpackFiles({
        appSource: currentCode,
        appSourceIsPrepared: true, // examples + saved code are already full modules
        theme: activeTheme,
        mode: playgroundMode,
      }),
    [activeTheme, playgroundMode, currentCode]
  );

  // Theme changes flow through the `files` prop (new styles.css content) and
  // Sandpack rebuilds without a remount — instant swap. Mode changes however
  // flip the <html class="dark"> in public/index.html, which Sandpack doesn't
  // hot-replace, so we force a re-mount on mode change only.
  useEffect(() => {
    setSandpackKey((k) => k + 1);
  }, [playgroundMode]);

  // Load saved playgrounds from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSavedPlaygrounds(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved playgrounds:", e);
      }
    }
  }, []);

  const handleExampleClick = (key: keyof typeof examples) => {
    setActiveExample(key);
    setCurrentCode(examples[key].code);
    setActivePlayground(null); // Clear active save when switching to example
    setSandpackKey((k) => k + 1);
  };

  const handleSaveRequest = (code: string) => {
    if (activePlayground) {
      // Update existing playground
      const updated = savedPlaygrounds.map((p) =>
        p.id === activePlayground.id
          ? { ...p, code, createdAt: Date.now() }
          : p
      );
      setSavedPlaygrounds(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      // Update current code so re-renders don't revert
      setCurrentCode(code);
      // Update active playground reference
      setActivePlayground({ ...activePlayground, code, createdAt: Date.now() });
    } else {
      // Show dialog for new save
      setPendingCode(code);
      setShowSaveDialog(true);
      setSaveName("");
    }
  };

  const handleSaveAsNew = (code: string) => {
    setPendingCode(code);
    setShowSaveDialog(true);
    setSaveName("");
  };

  const handleSaveConfirm = () => {
    if (!saveName.trim() || !pendingCode) return;

    const newPlayground: SavedPlayground = {
      id: Date.now().toString(),
      name: saveName.trim(),
      code: pendingCode,
      createdAt: Date.now(),
    };

    const updated = [...savedPlaygrounds, newPlayground];
    setSavedPlaygrounds(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setShowSaveDialog(false);
    setPendingCode(null);
    setActivePlayground(newPlayground); // Set as active after saving
  };

  const handleLoad = (playground: SavedPlayground) => {
    setCurrentCode(playground.code);
    setActivePlayground(playground); // Track which save is loaded
    setSandpackKey((k) => k + 1);
    setShowLoadDropdown(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedPlaygrounds.filter((p) => p.id !== id);
    setSavedPlaygrounds(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Clear active if we deleted the active playground
    if (activePlayground?.id === id) {
      setActivePlayground(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 flex flex-col">
        <div className="border-b bg-muted/30">
          <div className="max-w-[1800px] mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Playground</h1>
                <p className="text-sm text-muted-foreground">
                  Experiment with Grade Design System components in real-time
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* Example buttons */}
                <div className="flex gap-2">
                  {Object.entries(examples).map(([key, example]) => (
                    <button
                      key={key}
                      onClick={() => handleExampleClick(key as keyof typeof examples)}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-md transition-colors",
                        activeExample === key
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      {example.name}
                    </button>
                  ))}
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-border" />

                {/* Load dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowLoadDropdown(!showLoadDropdown)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    My Saves
                    {savedPlaygrounds.length > 0 && (
                      <span className="ml-1 bg-primary/20 text-primary px-1.5 py-0.5 rounded text-xs">
                        {savedPlaygrounds.length}
                      </span>
                    )}
                  </button>

                  {showLoadDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowLoadDropdown(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-64 bg-card border rounded-lg shadow-lg z-50 overflow-hidden">
                        {savedPlaygrounds.length === 0 ? (
                          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                            No saved playgrounds yet
                          </div>
                        ) : (
                          <div className="max-h-64 overflow-y-auto">
                            {savedPlaygrounds.map((p) => (
                              <div
                                key={p.id}
                                onClick={() => handleLoad(p)}
                                className="flex items-center justify-between px-3 py-2 hover:bg-muted cursor-pointer group"
                              >
                                <div className="truncate">
                                  <div className="text-sm font-medium truncate">
                                    {p.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(p.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => handleDelete(p.id, e)}
                                  className="p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive rounded transition-all"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <SandpackProvider
            key={sandpackKey}
            template="react-ts"
            theme={isDark ? "dark" : "light"}
            options={{
              externalResources: [...PLAYGROUND_EXTERNAL_RESOURCES],
              classes: {
                "sp-wrapper": "sp-ramp-wrapper",
                "sp-preview-container": "sp-ramp-preview",
              },
            }}
            customSetup={{
              dependencies: { ...PLAYGROUND_DEPENDENCIES },
              entry: "/index.tsx",
            }}
            files={sandpackFiles}
          >
            <EditorTitleBar
              onSave={handleSaveRequest}
              onSaveAsNew={handleSaveAsNew}
              activePlayground={activePlayground}
            />
            <SandpackLayout style={{ height: "calc(100vh - 220px)", flex: 1 }}>
              <SandpackCodeEditor
                showTabs
                showLineNumbers
                style={{ height: "100%" }}
              />
              <SandpackPreview
                showOpenInCodeSandbox
                showRefreshButton
                style={{ height: "100%" }}
              />
            </SandpackLayout>
          </SandpackProvider>
        </div>
      </main>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowSaveDialog(false)}
          />
          <div className="relative z-50 w-full max-w-md bg-card border rounded-lg p-6 shadow-lg">
            <button
              onClick={() => setShowSaveDialog(false)}
              className="absolute right-4 top-4 p-1 hover:bg-muted rounded"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-semibold mb-4">Save Playground</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Name</label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="My awesome component..."
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSaveConfirm()}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveConfirm}
                  disabled={!saveName.trim()}
                  className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
