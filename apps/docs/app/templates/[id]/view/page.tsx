"use client";

import React, { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { Button } from "@/components/ui/button";
import { getTemplateById } from "@/lib/templates-list";
import { getTemplateCode } from "@/lib/template-code";
import { standardComponentFiles } from "@/components/code-editor";
import { ArrowLeft, Save, FolderOpen, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TemplateViewPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface SavedTemplate {
  id: string;
  name: string;
  code: string;
  templateId: string;
  createdAt: number;
}

const STORAGE_KEY = "rds-template-saves";

// Title bar component that uses Sandpack context
function EditorTitleBar({
  templateName,
  onSave,
  onSaveAsNew,
  activeEdit,
  onBack,
}: {
  templateName: string;
  onSave: (code: string) => void;
  onSaveAsNew: (code: string) => void;
  activeEdit: SavedTemplate | null;
  onBack: () => void;
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
    <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e1e] border-b border-[#333]">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-2 py-1 text-sm rounded hover:bg-[#333] text-gray-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <div className="h-4 w-px bg-[#333]" />
        {activeEdit ? (
          <>
            <span className="text-sm font-medium text-white">{activeEdit.name}</span>
            <span className="text-xs text-gray-500">
              Last saved {new Date(activeEdit.createdAt).toLocaleTimeString()}
            </span>
          </>
        ) : (
          <>
            <span className="text-sm font-medium text-white">{templateName}</span>
            <span className="text-xs text-gray-500">Unsaved changes</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Save className="h-3.5 w-3.5" />
          {activeEdit ? "Save" : "Save as..."}
        </button>
        {activeEdit && (
          <button
            onClick={handleSaveAsNew}
            className="flex items-center gap-1.5 px-3 py-1 text-sm rounded bg-[#333] text-gray-300 hover:bg-[#444] transition-colors"
          >
            Save as new
          </button>
        )}
      </div>
    </div>
  );
}

export default function TemplateViewPage({ params }: TemplateViewPageProps) {
  const { id } = React.use(params);
  const template = getTemplateById(id);

  if (!template) {
    notFound();
  }

  const templateCodeStr = getTemplateCode(id);

  const [currentCode, setCurrentCode] = useState(templateCodeStr);
  const [savedEdits, setSavedEdits] = useState<SavedTemplate[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDropdown, setShowLoadDropdown] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [sandpackKey, setSandpackKey] = useState(0);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [activeEdit, setActiveEdit] = useState<SavedTemplate | null>(null);

  // Load saved edits from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const allSaves = JSON.parse(saved);
        // Filter to only this template's saves
        setSavedEdits(allSaves.filter((s: SavedTemplate) => s.templateId === id));
      } catch (e) {
        console.error("Failed to load saved edits:", e);
      }
    }
  }, [id]);

  const handleSaveRequest = (code: string) => {
    if (activeEdit) {
      // Update existing save
      const allSaves = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const updated = allSaves.map((s: SavedTemplate) =>
        s.id === activeEdit.id ? { ...s, code, createdAt: Date.now() } : s
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSavedEdits(updated.filter((s: SavedTemplate) => s.templateId === id));
      setCurrentCode(code);
      setActiveEdit({ ...activeEdit, code, createdAt: Date.now() });
      toast.success("Changes saved!");
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

    const newEdit: SavedTemplate = {
      id: Date.now().toString(),
      name: saveName.trim(),
      code: pendingCode,
      templateId: id,
      createdAt: Date.now(),
    };

    const allSaves = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const updated = [...allSaves, newEdit];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSavedEdits(updated.filter((s: SavedTemplate) => s.templateId === id));
    setShowSaveDialog(false);
    setPendingCode(null);
    setActiveEdit(newEdit);
    toast.success("Template saved!");
  };

  const handleLoad = (edit: SavedTemplate) => {
    setCurrentCode(edit.code);
    setActiveEdit(edit);
    setSandpackKey((k) => k + 1);
    setShowLoadDropdown(false);
    toast.success(`Loaded "${edit.name}"`);
  };

  const handleDelete = (editId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const allSaves = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const updated = allSaves.filter((s: SavedTemplate) => s.id !== editId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSavedEdits(updated.filter((s: SavedTemplate) => s.templateId === id));
    if (activeEdit?.id === editId) {
      setActiveEdit(null);
      setCurrentCode(templateCodeStr);
      setSandpackKey((k) => k + 1);
    }
    toast.success("Save deleted");
  };

  const handleReset = () => {
    setCurrentCode(templateCodeStr);
    setActiveEdit(null);
    setSandpackKey((k) => k + 1);
    toast.success("Reset to original template");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-muted/30">
          <div className="max-w-[1800px] mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{template.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* Reset button */}
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 text-sm rounded-md bg-muted hover:bg-muted/80 transition-colors"
                >
                  Reset
                </button>

                {/* Load dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowLoadDropdown(!showLoadDropdown)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    My Saves
                    {savedEdits.length > 0 && (
                      <span className="ml-1 bg-primary/20 text-primary px-1.5 py-0.5 rounded text-xs">
                        {savedEdits.length}
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
                        {savedEdits.length === 0 ? (
                          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                            No saved edits yet
                          </div>
                        ) : (
                          <div className="max-h-64 overflow-y-auto">
                            {savedEdits.map((edit) => (
                              <div
                                key={edit.id}
                                onClick={() => handleLoad(edit)}
                                className="flex items-center justify-between px-3 py-2 hover:bg-muted cursor-pointer group"
                              >
                                <div className="truncate">
                                  <div className="text-sm font-medium truncate">
                                    {edit.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(edit.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => handleDelete(edit.id, e)}
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

        {/* Editor */}
        <div className="flex-1 flex flex-col">
          <SandpackProvider
            key={sandpackKey}
            template="react-ts"
            theme="dark"
            options={{
              externalResources: ["https://cdn.tailwindcss.com"],
            }}
            customSetup={{
              dependencies: {
                "class-variance-authority": "^0.7.0",
                "clsx": "^2.0.0",
                "tailwind-merge": "^2.0.0",
                "lucide-react": "^0.300.0",
              },
              entry: "/index.tsx",
            }}
            files={{
              "/App.tsx": currentCode,
              "/public/index.html": [
                '<!DOCTYPE html>',
                '<html lang="en">',
                '  <head>',
                '    <meta charset="UTF-8">',
                '    <meta name="viewport" content="width=device-width, initial-scale=1.0">',
                '    <title>Template Preview</title>',
                '    <script src="https://cdn.tailwindcss.com"></script>',
                '    <script>',
                '      tailwind.config = {',
                '        theme: {',
                '          extend: {',
                '            colors: {',
                '              border: "oklch(var(--border))",',
                '              input: "oklch(var(--input))",',
                '              ring: "oklch(var(--ring))",',
                '              background: "oklch(var(--background))",',
                '              foreground: "oklch(var(--foreground))",',
                '              primary: { DEFAULT: "oklch(var(--primary))", foreground: "oklch(var(--primary-foreground))" },',
                '              secondary: { DEFAULT: "oklch(var(--secondary))", foreground: "oklch(var(--secondary-foreground))" },',
                '              destructive: { DEFAULT: "oklch(var(--destructive))", foreground: "oklch(var(--destructive-foreground))" },',
                '              muted: { DEFAULT: "oklch(var(--muted))", foreground: "oklch(var(--muted-foreground))" },',
                '              accent: { DEFAULT: "oklch(var(--accent))", foreground: "oklch(var(--accent-foreground))" },',
                '              card: { DEFAULT: "oklch(var(--card))", foreground: "oklch(var(--card-foreground))" },',
                '            },',
                '            borderRadius: {',
                '              lg: "var(--radius)",',
                '              md: "calc(var(--radius) - 2px)",',
                '              sm: "calc(var(--radius) - 4px)",',
                '            },',
                '          },',
                '        },',
                '      }',
                '    </script>',
                '  </head>',
                '  <body>',
                '    <div id="root"></div>',
                '  </body>',
                '</html>',
              ].join('\n'),
              "/index.tsx": [
                'import React from "react";',
                'import ReactDOM from "react-dom/client";',
                'import App from "./App";',
                'import "./styles.css";',
                "",
                'ReactDOM.createRoot(document.getElementById("root")!).render(<App />);',
              ].join('\n'),
              "/styles.css": [
                ':root {',
                '  --background: 0 0% 100%;',
                '  --foreground: 240 10% 3.9%;',
                '  --card: 0 0% 100%;',
                '  --card-foreground: 240 10% 3.9%;',
                '  --primary: 175 84% 32%;',
                '  --primary-foreground: 0 0% 100%;',
                '  --secondary: 240 4.8% 95.9%;',
                '  --secondary-foreground: 240 5.9% 10%;',
                '  --muted: 240 4.8% 95.9%;',
                '  --muted-foreground: 240 3.8% 46.1%;',
                '  --accent: 175 40% 94%;',
                '  --accent-foreground: 240 5.9% 10%;',
                '  --destructive: 0 84.2% 60.2%;',
                '  --destructive-foreground: 0 0% 98%;',
                '  --border: 240 5.9% 90%;',
                '  --input: 240 5.9% 90%;',
                '  --ring: 175 84% 32%;',
                '  --radius: 0.5rem;',
                '}',
                '*, *::before, *::after { box-sizing: border-box; border-color: oklch(var(--border)); }',
                'body { background-color: oklch(var(--background)); color: oklch(var(--foreground)); font-family: system-ui, -apple-system, sans-serif; margin: 0; }',
                '.bg-primary { background-color: oklch(var(--primary)); }',
                '.text-primary { color: oklch(var(--primary)); }',
                '.text-primary-foreground { color: oklch(var(--primary-foreground)); }',
                '.bg-secondary { background-color: oklch(var(--secondary)); }',
                '.text-secondary-foreground { color: oklch(var(--secondary-foreground)); }',
                '.bg-destructive { background-color: oklch(var(--destructive)); }',
                '.text-destructive { color: oklch(var(--destructive)); }',
                '.text-destructive-foreground { color: oklch(var(--destructive-foreground)); }',
                '.bg-muted { background-color: oklch(var(--muted)); }',
                '.text-muted-foreground { color: oklch(var(--muted-foreground)); }',
                '.bg-accent { background-color: oklch(var(--accent)); }',
                '.text-accent-foreground { color: oklch(var(--accent-foreground)); }',
                '.bg-card { background-color: oklch(var(--card)); }',
                '.text-card-foreground { color: oklch(var(--card-foreground)); }',
                '.bg-background { background-color: oklch(var(--background)); }',
                '.text-foreground { color: oklch(var(--foreground)); }',
                '.border-input { border-color: oklch(var(--input)); }',
                '.ring-ring { --tw-ring-color: oklch(var(--ring)); }',
                '.rounded-lg { border-radius: var(--radius); }',
                '.rounded-md { border-radius: calc(var(--radius) - 2px); }',
                '.rounded-sm { border-radius: calc(var(--radius) - 4px); }',
              ].join('\n'),
              ...standardComponentFiles,
            }}
          >
            <EditorTitleBar
              templateName={template.name}
              onSave={handleSaveRequest}
              onSaveAsNew={handleSaveAsNew}
              activeEdit={activeEdit}
              onBack={() => window.history.back()}
            />
            <SandpackLayout style={{ height: "calc(100vh - 180px)", flex: 1 }}>
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
            <h2 className="text-lg font-semibold mb-4">Save Template Edit</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Name</label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="My customized version..."
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
