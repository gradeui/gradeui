"use client";

/**
 * RulesPage — the project's Rules screen (full-canvas, like Assets).
 *
 * Two sections, Magic Patterns-style (files list left, editor right):
 *
 *   1. Design system rules — the active registry's rules/*.md files
 *      (registry.prompt.ruleFiles). Read-only content with a per-file
 *      on/off switch. A file toggled OFF is recorded as a
 *      `kind: "registry"` record in project.rulesFiles
 *      (id "registry:<fileId>", enabled: false); absence = on. No
 *      schema migration — it rides the existing rules_files jsonb.
 *
 *   2. Project rules — the project's own named .md files
 *      (project.rulesFiles, kind !== "registry"): add / rename / edit /
 *      delete / toggle. "Add file" seeds canonical presets (Company,
 *      Tone of voice, Glossary, UX rules) so vocabulary stays
 *      consistent across projects.
 *
 * Every ENABLED file rides into the generation prompt on every turn —
 * the header says so; keep files terse.
 */

import * as React from "react";
import { FileText, Plus, Trash2 } from "lucide-react";
import { Badge, Button, Input, Switch, Textarea } from "@gradeui/ui";
import { cn } from "@/lib/utils";
import type { Project, ProjectRulesFile } from "@/lib/studio-storage";
import type { RegistryRuleFile } from "@gradeui/studio/registry";

/** Prefix for registry-toggle records inside project.rulesFiles. */
export const REGISTRY_RULE_PREFIX = "registry:";

/** Canonical starter files — Ali's "specific named .md files". Seeded
 *  with a scaffold so the person knows what belongs in each. */
const PRESETS: { name: string; content: string }[] = [
  {
    name: "company.md",
    content:
      "About the company:\n- What the product does, for whom.\n- Key product areas / verticals.\n- Anything the AI should always know when designing for us.",
  },
  {
    name: "tone-of-voice.md",
    content:
      "Tone of voice:\n- Reading age / plain-English level.\n- Casing rules (headings, buttons, labels).\n- Words we use / words we avoid.",
  },
  {
    name: "glossary.md",
    content:
      "Glossary (expand on first use in UI copy):\n- ACRONYM = expansion — one line on what it means here.",
  },
  {
    name: "ux-rules.md",
    content:
      "UX rules:\n- Navigation / layout conventions.\n- Form and validation behaviour.\n- Empty-state and error conventions.",
  },
];

function mintId() {
  return `rf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

interface RulesPageProps {
  project: Project;
  /** The active registry's per-file rules (prompt.ruleFiles); empty on
   *  registries that only ship the concatenated string. */
  registryRuleFiles: readonly RegistryRuleFile[];
  registryName: string;
  /** Persist a rulesFiles patch (page's handleUpdateProject). */
  onUpdateRulesFiles: (id: string, rulesFiles: ProjectRulesFile[]) => void;
}

export function RulesPage({
  project,
  registryRuleFiles,
  registryName,
  onUpdateRulesFiles,
}: RulesPageProps) {
  const all = React.useMemo(
    () => project.rulesFiles ?? [],
    [project.rulesFiles],
  );
  const projectFiles = all.filter((f) => f.kind !== "registry");
  const registryToggles = all.filter((f) => f.kind === "registry");

  const registryEnabled = React.useCallback(
    (fileId: string) =>
      registryToggles.find((t) => t.id === `${REGISTRY_RULE_PREFIX}${fileId}`)
        ?.enabled !== false,
    [registryToggles],
  );

  // Selection: "registry:<id>" or a project file id. Default = first
  // registry file, else first project file.
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const effectiveSelected =
    selectedId ??
    (registryRuleFiles[0]
      ? `${REGISTRY_RULE_PREFIX}${registryRuleFiles[0].id}`
      : projectFiles[0]?.id ?? null);

  const selectedRegistry = registryRuleFiles.find(
    (f) => `${REGISTRY_RULE_PREFIX}${f.id}` === effectiveSelected,
  );
  const selectedProject = projectFiles.find((f) => f.id === effectiveSelected);

  const commit = (next: ProjectRulesFile[]) =>
    onUpdateRulesFiles(project.id, next);

  const toggleRegistry = (fileId: string, on: boolean) => {
    const recId = `${REGISTRY_RULE_PREFIX}${fileId}`;
    const rest = all.filter((f) => f.id !== recId);
    // On = drop the record (absence = enabled); off = store the toggle.
    commit(
      on
        ? rest
        : [
            ...rest,
            {
              id: recId,
              name: registryRuleFiles.find((f) => f.id === fileId)?.name ?? fileId,
              content: "",
              kind: "registry",
              enabled: false,
            },
          ],
    );
  };

  const patchProjectFile = (id: string, patch: Partial<ProjectRulesFile>) =>
    commit(all.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const addFile = (preset?: { name: string; content: string }) => {
    const id = mintId();
    commit([
      ...all,
      {
        id,
        name: preset?.name ?? "untitled.md",
        content: preset?.content ?? "",
        enabled: true,
      },
    ]);
    setSelectedId(id);
  };

  const deleteFile = (id: string) => {
    commit(all.filter((f) => f.id !== id));
    if (effectiveSelected === id) setSelectedId(null);
  };

  const [addOpen, setAddOpen] = React.useState(false);
  const usedNames = new Set(projectFiles.map((f) => f.name));

  const fileRow = (opts: {
    key: string;
    name: string;
    enabled: boolean;
    active: boolean;
    onSelect: () => void;
    onToggle: (on: boolean) => void;
    badge?: string;
  }) => (
    <div
      key={opts.key}
      className={cn(
        "group flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer",
        opts.active ? "bg-muted" : "hover:bg-muted/60",
        !opts.enabled && "opacity-50",
      )}
      onClick={opts.onSelect}
    >
      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
        {opts.name}
      </span>
      {opts.badge && (
        <Badge variant="secondary" className="text-[10px]">
          {opts.badge}
        </Badge>
      )}
      <span onClick={(e) => e.stopPropagation()}>
        <Switch
          checked={opts.enabled}
          onCheckedChange={opts.onToggle}
          aria-label={`${opts.enabled ? "Disable" : "Enable"} ${opts.name}`}
        />
      </span>
    </div>
  );

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Rules</h2>
        <p className="text-sm text-muted-foreground">
          Every file that&apos;s switched on rides into the AI&apos;s prompt on
          every turn for this project — keep them short. Design-system rules
          come from {registryName}; project rules are yours.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        {/* Files list */}
        <div className="flex w-64 shrink-0 flex-col gap-4 overflow-y-auto rounded-lg border border-border bg-background p-3">
          {registryRuleFiles.length > 0 && (
            <div className="flex flex-col gap-1">
              <div className="px-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Design system
              </div>
              {registryRuleFiles.map((f) =>
                fileRow({
                  key: `${REGISTRY_RULE_PREFIX}${f.id}`,
                  name: f.name,
                  enabled: registryEnabled(f.id),
                  active:
                    effectiveSelected === `${REGISTRY_RULE_PREFIX}${f.id}`,
                  onSelect: () =>
                    setSelectedId(`${REGISTRY_RULE_PREFIX}${f.id}`),
                  onToggle: (on) => toggleRegistry(f.id, on),
                }),
              )}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Project
              </span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAddOpen((v) => !v)}
                  aria-label="Add rules file"
                  title="Add rules file"
                  className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground [&_svg]:size-3"
                >
                  <Plus />
                </button>
                {addOpen && (
                  <div className="absolute right-0 top-6 z-20 w-44 rounded-md border border-border bg-popover p-1 shadow-md">
                    {PRESETS.filter((p) => !usedNames.has(p.name)).map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                        onClick={() => {
                          addFile(p);
                          setAddOpen(false);
                        }}
                      >
                        {p.name}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="block w-full rounded px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted"
                      onClick={() => {
                        addFile();
                        setAddOpen(false);
                      }}
                    >
                      Blank file…
                    </button>
                  </div>
                )}
              </div>
            </div>
            {projectFiles.length === 0 && (
              <p className="px-2 py-1 text-xs text-muted-foreground">
                No project rules yet. Add company context, tone of voice, a
                glossary…
              </p>
            )}
            {projectFiles.map((f) =>
              fileRow({
                key: f.id,
                name: f.name,
                enabled: f.enabled !== false,
                active: effectiveSelected === f.id,
                onSelect: () => setSelectedId(f.id),
                onToggle: (on) => patchProjectFile(f.id, { enabled: on }),
              }),
            )}
          </div>
        </div>

        {/* Editor / viewer */}
        <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-lg border border-border bg-background p-4">
          {selectedRegistry ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {selectedRegistry.name}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {registryName}
                  </Badge>
                </div>
                <Switch
                  checked={registryEnabled(selectedRegistry.id)}
                  onCheckedChange={(on) =>
                    toggleRegistry(selectedRegistry.id, on)
                  }
                  aria-label="Include in prompt"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Shipped with the design system — read-only here. Switch it off
                to stop it riding into this project&apos;s prompts.
              </p>
              <pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap rounded-md bg-muted/40 p-3 font-mono text-xs leading-relaxed text-foreground">
                {selectedRegistry.content}
              </pre>
            </>
          ) : selectedProject ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <Input
                  value={selectedProject.name}
                  onChange={(e) =>
                    patchProjectFile(selectedProject.id, {
                      name: e.target.value,
                    })
                  }
                  className="h-8 max-w-64 font-mono text-sm"
                  aria-label="File name"
                />
                <div className="flex items-center gap-2">
                  <Switch
                    checked={selectedProject.enabled !== false}
                    onCheckedChange={(on) =>
                      patchProjectFile(selectedProject.id, { enabled: on })
                    }
                    aria-label="Include in prompt"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteFile(selectedProject.id)}
                    aria-label={`Delete ${selectedProject.name}`}
                    title="Delete file"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Textarea
                value={selectedProject.content}
                onChange={(e) =>
                  patchProjectFile(selectedProject.id, {
                    content: e.target.value,
                  })
                }
                placeholder="Rules ride verbatim into the AI prompt — keep them short and specific."
                className="min-h-0 flex-1 resize-none font-mono text-xs leading-relaxed"
              />
              <p className="text-[10px] text-muted-foreground">
                {selectedProject.content.length} chars — every char is prompt
                tokens on every turn.
              </p>
            </>
          ) : (
            <p className="m-auto text-sm text-muted-foreground">
              Select a file, or add one with the + button.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
