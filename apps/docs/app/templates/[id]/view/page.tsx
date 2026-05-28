"use client";

import React, { useState, useEffect, useMemo } from "react";
import { notFound } from "next/navigation";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { getTemplateById } from "@/lib/templates-list";
import { getTemplateCode } from "@/lib/template-code";
import { ArrowLeft, Save, FolderOpen, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useGradeTheme } from "@/components/grade-theme-provider";
import {
  buildSandpackFiles,
  PLAYGROUND_DEPENDENCIES,
  PLAYGROUND_EXTERNAL_RESOURCES,
} from "@/lib/chat-sandpack";

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

const STORAGE_KEY = "gds-template-saves";

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

  // Drive the preview with the site-wide Grade theme — templates preview in
  // whichever theme the user picked in the nav, exactly like /play and
  // /studio. Previously this route had a hand-rolled styles.css with
  // HSL-formatted tokens wrapped in oklch(), which produced invalid colours
  // and rendered as unstyled black-on-white.
  const { theme: activeTheme, isDark } = useGradeTheme();
  const mode = isDark ? "dark" : "light";

  const sandpackFiles = useMemo(
    () =>
      buildSandpackFiles({
        appSource: currentCode,
        appSourceIsPrepared: true,
        theme: activeTheme,
        mode,
      }),
    [activeTheme, mode, currentCode]
  );

  // Rebuild the iframe when the user flips mode — Sandpack doesn't
  // hot-replace public/index.html, and that's where the html.dark class
  // comes from.
  useEffect(() => {
    setSandpackKey((k) => k + 1);
  }, [mode]);

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
              externalResources: [...PLAYGROUND_EXTERNAL_RESOURCES],
            }}
            customSetup={{
              dependencies: { ...PLAYGROUND_DEPENDENCIES },
              entry: "/index.tsx",
            }}
            files={sandpackFiles}
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
