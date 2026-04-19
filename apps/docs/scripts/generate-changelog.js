#!/usr/bin/env node

/**
 * Generates changelog entries from conventional commits
 *
 * Usage: node scripts/generate-changelog.js
 *
 * This script:
 * 1. Reads the current version from package.json
 * 2. Gets commits since the last tag
 * 3. Parses conventional commit messages
 * 4. Prepends a new entry to CHANGELOG.md
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Read current version from package.json
const pkgPath = path.join(__dirname, "../package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const version = pkg.version;

// Get the last tag
function getLastTag() {
  try {
    return execSync("git describe --tags --abbrev=0 2>/dev/null", {
      encoding: "utf8",
    }).trim();
  } catch {
    return null;
  }
}

// Get commits since last tag (or all commits if no tag)
function getCommits(since) {
  const range = since ? `${since}..HEAD` : "HEAD";
  try {
    const output = execSync(`git log ${range} --pretty=format:"%s"`, {
      encoding: "utf8",
    });
    return output.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

// Parse a conventional commit message
function parseCommit(message) {
  // Match: type(scope): description or type: description
  const match = message.match(
    /^(feat|fix|docs|style|refactor|perf|test|chore|breaking)(\(([^)]+)\))?: (.+)$/i
  );

  if (!match) {
    return null;
  }

  const type = match[1].toLowerCase();
  const scope = match[3]?.toLowerCase();
  const description = match[4];

  // Map commit type to changelog type
  let changeType;
  switch (type) {
    case "feat":
      changeType = "added";
      break;
    case "fix":
      changeType = "fixed";
      break;
    case "breaking":
      changeType = "breaking";
      break;
    case "docs":
      changeType = "changed";
      break;
    case "refactor":
    case "style":
    case "perf":
      changeType = "changed";
      break;
    default:
      return null; // Skip chore, test, etc.
  }

  // Map scope to category
  let category = "component";
  if (scope) {
    if (scope.includes("token") || scope.includes("css") || scope.includes("style")) {
      category = "token";
    } else if (scope.includes("brand") || scope.includes("logo")) {
      category = "brand";
    } else if (scope.includes("doc") || type === "docs") {
      category = "docs";
    }
  } else if (type === "docs") {
    category = "docs";
  }

  return {
    type: changeType,
    category,
    description,
  };
}

// Group changes by type
function groupChanges(changes) {
  const groups = {
    breaking: [],
    added: [],
    changed: [],
    fixed: [],
    deprecated: [],
    removed: [],
  };

  for (const change of changes) {
    if (groups[change.type]) {
      groups[change.type].push(change);
    }
  }

  return groups;
}

// Generate markdown for a version entry
function generateMarkdown(version, date, groupedChanges) {
  let md = `## [${version}] - ${date}\n\n`;

  const typeLabels = {
    breaking: "Breaking Changes",
    added: "Added",
    changed: "Changed",
    fixed: "Fixed",
    deprecated: "Deprecated",
    removed: "Removed",
  };

  for (const [type, label] of Object.entries(typeLabels)) {
    const changes = groupedChanges[type];
    if (changes && changes.length > 0) {
      md += `### ${label}\n`;
      for (const change of changes) {
        md += `- **${change.category}**: ${change.description}\n`;
      }
      md += "\n";
    }
  }

  return md;
}

// Main function
function main() {
  const lastTag = getLastTag();
  const commits = getCommits(lastTag);

  if (commits.length === 0) {
    console.log("No new commits since last tag");
    return;
  }

  // Parse commits
  const changes = commits.map(parseCommit).filter(Boolean);

  if (changes.length === 0) {
    console.log("No conventional commits found");
    return;
  }

  // Group changes
  const groupedChanges = groupChanges(changes);

  // Generate markdown
  const date = new Date().toISOString().split("T")[0];
  const entry = generateMarkdown(version, date, groupedChanges);

  // Read existing changelog
  const changelogPath = path.join(__dirname, "../content/changelog/CHANGELOG.md");
  let existing = "";

  if (fs.existsSync(changelogPath)) {
    existing = fs.readFileSync(changelogPath, "utf8");
  }

  // Check if this version already exists
  if (existing.includes(`## [${version}]`)) {
    console.log(`Version ${version} already exists in changelog`);
    return;
  }

  // Find where to insert (after header, before first ## entry)
  const headerEnd = existing.indexOf("\n## ");
  let header, rest;

  if (headerEnd > 0) {
    header = existing.slice(0, headerEnd);
    rest = existing.slice(headerEnd);
  } else {
    header = `# Changelog

All notable changes to the Grade Design System (\`@gradeui/ui\`) are documented here.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).`;
    rest = "";
  }

  // Write updated changelog
  const newChangelog = `${header}\n\n${entry}${rest}`;
  fs.writeFileSync(changelogPath, newChangelog);

  console.log(`Generated changelog entry for v${version}`);
  console.log(`- ${changes.length} changes recorded`);
}

main();
