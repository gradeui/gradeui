import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, FileText, Image, Code, BarChart } from "lucide-react";

export default function SubagentsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
          Design System Subagents
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Automated quality checks and Figma sync for your design system.
        </p>
      </div>

      {/* Overview Alert */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Automated Design System Health</AlertTitle>
        <AlertDescription>
          These subagents maintain perfect sync between Figma designs, React code, and documentation.
          Run them locally or in CI/CD to catch drift early.
        </AlertDescription>
      </Alert>

      {/* What are Subagents */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          What are Subagents?
        </h2>
        <p className="leading-7">
          Subagents are specialized AI assistants that automate specific tasks in your design system workflow.
          Each subagent has a focused purpose and can be invoked via Claude Code CLI.
        </p>
        <p className="leading-7 text-muted-foreground">
          All subagent specifications are stored in <code className="bg-muted px-1.5 py-0.5 rounded text-sm">.claude/subagents/</code> as
          markdown files. They use Claude Code's built-in tools and require no special Skills or plugins.
        </p>
      </div>

      {/* Available Subagents */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Available Subagents
        </h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
          {/* Component Screenshot Generator */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-primary" />
                  <CardTitle>Component Screenshot Generator</CardTitle>
                </div>
                <Badge variant="success">Ready</Badge>
              </div>
              <CardDescription>
                Generates screenshots of all component variants for visual regression testing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-1">Usage:</p>
                <code className="block bg-muted px-3 py-2 rounded text-sm">
                  claude --subagent component-screenshot-generator --all
                </code>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">What it does:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Scans all components in <code className="bg-muted px-1 py-0.5 rounded text-xs">components/ui/</code></li>
                  <li>Extracts all variants (primary, secondary, disabled, etc.)</li>
                  <li>Generates standalone HTML for each variant</li>
                  <li>Captures screenshots at 1200x800px</li>
                  <li>Saves to <code className="bg-muted px-1 py-0.5 rounded text-xs">public/screenshots/code/</code></li>
                  <li>Creates manifest file with metadata</li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Requirements:</p>
                <code className="block bg-muted px-3 py-2 rounded text-sm">
                  npm install -D playwright
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Figma Drift Detection */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <CardTitle>Figma Drift Detection</CardTitle>
                </div>
                <Badge variant="warning">Needs Figma</Badge>
              </div>
              <CardDescription>
                Compares Figma designs against React implementations (visual + structural)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-1">Usage:</p>
                <code className="block bg-muted px-3 py-2 rounded text-sm">
                  claude --subagent figma-drift-check --all
                </code>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">What it does:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Exports component images from Figma at same size</li>
                  <li>Exports Figma component JSON with variables</li>
                  <li>Runs pixel-by-pixel visual comparison</li>
                  <li>Compares structural properties (spacing, colors, etc.)</li>
                  <li>Validates token usage consistency</li>
                  <li>Generates diff images and comprehensive report</li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Requirements:</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  <li>Figma API token</li>
                  <li>Figma MCP configured</li>
                  <li><code className="bg-muted px-1 py-0.5 rounded text-xs">npm install -D pixelmatch pngjs</code></li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Token Sync & Diff */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-primary" />
                  <CardTitle>Token Sync & Diff</CardTitle>
                </div>
                <Badge variant="warning">Needs Figma</Badge>
              </div>
              <CardDescription>
                Extracts and compares design tokens between Figma and code
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-1">Usage:</p>
                <code className="block bg-muted px-3 py-2 rounded text-sm">
                  claude --subagent token-sync --compare
                </code>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">What it does:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Extracts all Figma variables/collections</li>
                  <li>Parses code tokens (Tailwind config, CSS variables)</li>
                  <li>Compares with smart unit matching (px vs rem)</li>
                  <li>Checks for <code className="bg-muted px-1 py-0.5 rounded text-xs">@code-value</code> annotations in Figma</li>
                  <li>Generates detailed diff report</li>
                  <li>Optional auto-sync to update code</li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Token Categories:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Badge variant="secondary">Colors</Badge>
                  <Badge variant="secondary">Spacing</Badge>
                  <Badge variant="secondary">Typography</Badge>
                  <Badge variant="secondary">Border Radius</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dashboard Generator */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-success" />
                  <CardTitle>Dashboard Generator</CardTitle>
                </div>
                <Badge variant="success">Ready</Badge>
              </div>
              <CardDescription>
                Creates interactive health dashboard from all reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-1">Usage:</p>
                <code className="block bg-muted px-3 py-2 rounded text-sm">
                  claude --subagent dashboard-generator
                </code>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">What it does:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Reads all report JSON files</li>
                  <li>Calculates overall health score (0-100%)</li>
                  <li>Generates single-file HTML dashboard</li>
                  <li>Shows token sync, component drift, doc status</li>
                  <li>Provides prioritized recommendations</li>
                  <li>Includes trend analysis if historical data exists</li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Output:</p>
                <code className="block bg-muted px-3 py-2 rounded text-sm">
                  public/design-system-dashboard.html
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Documentation Validator */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle>Documentation Validator</CardTitle>
                </div>
                <Badge variant="success">Ready</Badge>
              </div>
              <CardDescription>
                Validates component docs against code and Figma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-1">Usage:</p>
                <code className="block bg-muted px-3 py-2 rounded text-sm">
                  claude --subagent doc-validator --all
                </code>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">What it does:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Scans existing component documentation</li>
                  <li>Extracts props, variants from TypeScript</li>
                  <li>Compares docs against actual code</li>
                  <li>Detects missing props, variants, examples</li>
                  <li>Generates update suggestions</li>
                  <li>Optional auto-update mode (preserves human content)</li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Great for CI:</p>
                <code className="block bg-muted px-3 py-2 rounded text-sm">
                  claude --subagent doc-validator --strict
                </code>
                <p className="text-xs text-muted-foreground mt-1">Fails if docs are out of date</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Workflows */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Recommended Workflows
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">Daily Development</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Run before committing changes to maintain visual history and doc quality:
            </p>
            <div className="rounded-lg bg-muted p-4 font-mono text-sm space-y-1">
              <code>claude --subagent component-screenshot-generator --all</code>
              <code>claude --subagent doc-validator --all --auto-update</code>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Weekly Figma Sync</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Full health check to catch any drift from designs:
            </p>
            <div className="rounded-lg bg-muted p-4 font-mono text-sm space-y-1">
              <code>claude --subagent token-sync --compare</code>
              <code>claude --subagent figma-drift-check --all --update-figma</code>
              <code>claude --subagent dashboard-generator</code>
              <code className="text-muted-foreground"># Then open: public/design-system-dashboard.html</code>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">CI/CD Pipeline</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Prevent regressions by validating on every pull request:
            </p>
            <div className="rounded-lg bg-muted p-4 font-mono text-sm space-y-1">
              <code>claude --subagent doc-validator --strict</code>
              <code>claude --subagent token-sync --compare</code>
            </div>
          </div>
        </div>
      </div>

      {/* Three Levels of Verification */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Three Levels of Verification
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">1. Token Level</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Are base design tokens aligned between Figma and code? Colors, spacing, typography, radius.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">2. Component Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Are properties and tokens used correctly? Proper spacing, correct color variables, matching layouts.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">3. Visual Level</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Does it actually look right? Pixel-perfect comparison between Figma exports and rendered components.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Getting Started */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Getting Started
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">1. Install Dependencies</h3>
            <div className="rounded-lg bg-muted p-4 font-mono text-sm space-y-1">
              <code>npm install -D playwright pixelmatch pngjs</code>
              <code>npx playwright install</code>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">2. Configure Figma Access (Optional)</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Only needed if you want Figma integration:
            </p>
            <div className="rounded-lg bg-muted p-4 font-mono text-sm space-y-1">
              <code>export FIGMA_ACCESS_TOKEN="your-token-here"</code>
              <code>export FIGMA_FILE_ID="your-file-id"</code>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">3. Try Your First Subagent</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Start with doc-validator (easiest, no external dependencies):
            </p>
            <div className="rounded-lg bg-muted p-4 font-mono text-sm">
              <code>claude --subagent doc-validator --component Button</code>
            </div>
          </div>
        </div>
      </div>

      {/* Resources */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Resources
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Subagent Specifications</CardTitle>
              <CardDescription>Detailed specs for each subagent</CardDescription>
            </CardHeader>
            <CardContent>
              <code className="text-sm bg-muted px-2 py-1 rounded">
                .claude/subagents/
              </code>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Start Guide</CardTitle>
              <CardDescription>Setup instructions and workflows</CardDescription>
            </CardHeader>
            <CardContent>
              <code className="text-sm bg-muted px-2 py-1 rounded">
                .claude/SETUP_COMPLETE.md
              </code>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Back Link */}
      <div className="pt-6 border-t">
        <Link
          href="/docs/claude-code"
          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
        >
          ← Back to Claude Code Setup
        </Link>
      </div>
    </div>
  );
}
