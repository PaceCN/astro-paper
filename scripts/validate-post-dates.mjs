/* eslint-disable no-console */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const blogDir = join(root, "src/data/blog");
const now = Date.now();
const day = 24 * 60 * 60 * 1000;
const maxFutureDays = Number(process.env.POST_DATE_MAX_FUTURE_DAYS ?? 2);
const errors = [];
const warnings = [];
const modDatetimeCounts = new Map();

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : path.endsWith(".md") ? [path] : [];
  });
}

function frontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  return match?.[1] ?? "";
}

function field(fm, name) {
  const match = fm.match(new RegExp(`^${name}:\\s*(.+)$`, "m"));
  return match?.[1]?.trim().replace(/^["']|["']$/g, "");
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const posts = walk(blogDir);

for (const file of posts) {
  const rel = relative(root, file);
  const fm = frontmatter(readFileSync(file, "utf8"));
  const pubRaw = field(fm, "pubDatetime");
  const modRaw = field(fm, "modDatetime");
  const pub = parseDate(pubRaw);
  const mod = parseDate(modRaw);

  if (!pubRaw) {
    errors.push(`${rel}: missing pubDatetime`);
    continue;
  }
  if (!pub) {
    errors.push(`${rel}: invalid pubDatetime "${pubRaw}"`);
    continue;
  }
  if (modRaw && !mod) {
    errors.push(`${rel}: invalid modDatetime "${modRaw}"`);
  }
  if (mod && mod.getTime() < pub.getTime()) {
    errors.push(`${rel}: modDatetime is earlier than pubDatetime`);
  }
  if (modRaw) {
    const list = modDatetimeCounts.get(modRaw) ?? [];
    list.push(rel);
    modDatetimeCounts.set(modRaw, list);
  }

  const futureDays = (pub.getTime() - now) / day;
  if (futureDays > maxFutureDays) {
    errors.push(`${rel}: pubDatetime is ${futureDays.toFixed(1)} days in the future`);
  } else if (futureDays > 0) {
    warnings.push(`${rel}: pubDatetime is ${futureDays.toFixed(1)} days in the future`);
  }

  const filenameDate = rel.match(/(\d{4}-\d{2}-\d{2})/)?.[1];
  if (filenameDate) {
    const fileDate = new Date(`${filenameDate}T00:00:00Z`);
    const pubDate = new Date(Date.UTC(pub.getUTCFullYear(), pub.getUTCMonth(), pub.getUTCDate()));
    const diffDays = Math.abs(pubDate.getTime() - fileDate.getTime()) / day;
    if (diffDays > 2) {
      warnings.push(`${rel}: filename date ${filenameDate} differs from pubDatetime by ${diffDays.toFixed(0)} days`);
    }
  }
}

for (const [value, files] of modDatetimeCounts) {
  if (files.length >= 3) {
    warnings.push(`modDatetime ${value} appears in ${files.length} posts; verify this is intentional`);
  }
}

console.log(`Date validation checked ${posts.length} posts.`);
if (warnings.length) {
  console.warn(`\nWarnings (${warnings.length}):`);
  for (const warning of warnings) console.warn(`- ${warning}`);
}
if (errors.length) {
  console.error(`\nErrors (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log("No date errors found.");
