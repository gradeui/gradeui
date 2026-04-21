import { Feed } from "feed";
import { parseChangelog, type ChangelogEntry, type Change } from "./changelog";

const SITE_URL = "https://gradeui.com";

function formatChangeAsHTML(change: Change): string {
  const typeLabel = change.type.charAt(0).toUpperCase() + change.type.slice(1);
  return `<li><strong>${typeLabel}</strong> [${change.category}]: ${change.description}</li>`;
}

function formatEntryAsHTML(entry: ChangelogEntry): string {
  const groupedChanges: Record<string, Change[]> = {};

  for (const change of entry.changes) {
    const type = change.type;
    if (!groupedChanges[type]) {
      groupedChanges[type] = [];
    }
    groupedChanges[type].push(change);
  }

  let html = "";

  const typeOrder = ["breaking", "added", "changed", "fixed", "deprecated", "removed"];

  for (const type of typeOrder) {
    const changes = groupedChanges[type];
    if (changes && changes.length > 0) {
      const typeLabel = type === "breaking" ? "Breaking Changes" : type.charAt(0).toUpperCase() + type.slice(1);
      html += `<h3>${typeLabel}</h3><ul>`;
      for (const change of changes) {
        html += formatChangeAsHTML(change);
      }
      html += "</ul>";
    }
  }

  return html;
}

export function generateRSSFeed(): string {
  const changelog = parseChangelog();

  const feed = new Feed({
    title: "Grade Design System Changelog",
    description: "Latest updates to @gradeui/ui - the official Grade Design System",
    id: `${SITE_URL}/changelog`,
    link: `${SITE_URL}/changelog`,
    language: "en",
    favicon: `${SITE_URL}/favicon.ico`,
    copyright: `Copyright ${new Date().getFullYear()} Grade`,
    feedLinks: {
      rss2: `${SITE_URL}/changelog.xml`,
    },
    author: {
      name: "Grade",
      link: "https://gradeui.com",
    },
  });

  for (const entry of changelog) {
    const entryDate = new Date(entry.date);

    feed.addItem({
      title: `v${entry.version}`,
      id: `${SITE_URL}/changelog#v${entry.version}`,
      link: `${SITE_URL}/changelog#v${entry.version}`,
      description: formatEntryAsHTML(entry),
      date: entryDate,
      published: entryDate,
    });
  }

  return feed.rss2();
}

export function generateAtomFeed(): string {
  const changelog = parseChangelog();

  const feed = new Feed({
    title: "Grade Design System Changelog",
    description: "Latest updates to @gradeui/ui - the official Grade Design System",
    id: `${SITE_URL}/changelog`,
    link: `${SITE_URL}/changelog`,
    language: "en",
    favicon: `${SITE_URL}/favicon.ico`,
    copyright: `Copyright ${new Date().getFullYear()} Grade`,
    feedLinks: {
      atom: `${SITE_URL}/changelog.atom`,
    },
    author: {
      name: "Grade",
      link: "https://gradeui.com",
    },
  });

  for (const entry of changelog) {
    const entryDate = new Date(entry.date);

    feed.addItem({
      title: `v${entry.version}`,
      id: `${SITE_URL}/changelog#v${entry.version}`,
      link: `${SITE_URL}/changelog#v${entry.version}`,
      description: formatEntryAsHTML(entry),
      date: entryDate,
      published: entryDate,
    });
  }

  return feed.atom1();
}
