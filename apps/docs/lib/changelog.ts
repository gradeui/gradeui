import fs from "fs";
import path from "path";

export type ChangeType = "added" | "changed" | "fixed" | "deprecated" | "removed" | "breaking";
export type ChangeCategory = "component" | "token" | "brand" | "docs";

export interface Change {
  type: ChangeType;
  category: ChangeCategory;
  description: string;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: Change[];
}

const typeMap: Record<string, ChangeType> = {
  added: "added",
  changed: "changed",
  fixed: "fixed",
  deprecated: "deprecated",
  removed: "removed",
  "breaking change": "breaking",
  breaking: "breaking",
};

const categoryMap: Record<string, ChangeCategory> = {
  component: "component",
  components: "component",
  token: "token",
  tokens: "token",
  brand: "brand",
  docs: "docs",
  documentation: "docs",
};

export function parseChangelog(): ChangelogEntry[] {
  const changelogPath = path.join(process.cwd(), "content/changelog/CHANGELOG.md");

  if (!fs.existsSync(changelogPath)) {
    return [];
  }

  const content = fs.readFileSync(changelogPath, "utf8");
  const entries: ChangelogEntry[] = [];

  // Split by version headers
  const versionRegex = /^## \[([^\]]+)\] - (\d{4}-\d{2}-\d{2})/gm;
  const sections = content.split(versionRegex);

  // Skip the first section (header before first version)
  for (let i = 1; i < sections.length; i += 3) {
    const version = sections[i];
    const date = sections[i + 1];
    const body = sections[i + 2] || "";

    const changes = parseChanges(body);

    entries.push({
      version,
      date,
      changes,
    });
  }

  return entries;
}

function parseChanges(body: string): Change[] {
  const changes: Change[] = [];
  const lines = body.split("\n");

  let currentType: ChangeType | null = null;

  for (const line of lines) {
    // Check for type headers (### Added, ### Fixed, etc.)
    const typeMatch = line.match(/^### (.+)$/);
    if (typeMatch) {
      const typeName = typeMatch[1].toLowerCase();
      currentType = typeMap[typeName] || null;
      continue;
    }

    // Check for change entries (- **category**: description)
    const changeMatch = line.match(/^- \*\*([^*]+)\*\*: (.+)$/);
    if (changeMatch && currentType) {
      const categoryRaw = changeMatch[1].toLowerCase();
      const description = changeMatch[2];

      const category = categoryMap[categoryRaw] || "component";

      changes.push({
        type: currentType,
        category,
        description,
      });
    }
  }

  return changes;
}

export function getChangesByVersion(version: string): ChangelogEntry | null {
  const entries = parseChangelog();
  return entries.find((e) => e.version === version) || null;
}

export function getLatestVersion(): ChangelogEntry | null {
  const entries = parseChangelog();
  return entries[0] || null;
}

export function filterChangelog(
  entries: ChangelogEntry[],
  options: {
    type?: ChangeType | "all";
    category?: ChangeCategory | "all";
    search?: string;
  }
): ChangelogEntry[] {
  const { type = "all", category = "all", search = "" } = options;

  return entries
    .map((entry) => {
      let filteredChanges = entry.changes;

      if (type !== "all") {
        filteredChanges = filteredChanges.filter((c) => c.type === type);
      }

      if (category !== "all") {
        filteredChanges = filteredChanges.filter((c) => c.category === category);
      }

      if (search) {
        const searchLower = search.toLowerCase();
        filteredChanges = filteredChanges.filter((c) =>
          c.description.toLowerCase().includes(searchLower)
        );
      }

      return {
        ...entry,
        changes: filteredChanges,
      };
    })
    .filter((entry) => entry.changes.length > 0);
}
