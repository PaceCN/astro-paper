#!/usr/bin/env node
/* eslint-disable no-console */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const defaultOutDir = "/home/pace/.openclaw/workspace/tmp/pace-notes-d1";
const outDir = process.argv[2] ? path.resolve(process.argv[2]) : defaultOutDir;
const blogDir = path.join(root, "src/data/blog");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() && entry.name.endsWith(".md") ? [full] : [];
  });
}

function frontmatterOf(text) {
  return text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
}

function field(fm, name) {
  return (
    fm.match(new RegExp(`^${name}:\\s*(.+)$`, "m"))?.[1]?.trim().replace(/^['\"]|['\"]$/g, "") ?? ""
  );
}

function arrayField(fm, name) {
  const lines = fm.split("\n");
  const startIndex = lines.findIndex(line => line.startsWith(`${name}:`));
  if (startIndex === -1) return [];

  const firstLine = lines[startIndex].replace(`${name}:`, "").trim();
  if (firstLine.startsWith("[") && firstLine.endsWith("]")) {
    return firstLine
      .slice(1, -1)
      .split(",")
      .map(item => item.trim().replace(/^['\"]|['\"]$/g, ""))
      .filter(Boolean);
  }
  if (firstLine) return [firstLine.replace(/^['\"]|['\"]$/g, "")];

  const values = [];
  for (const line of lines.slice(startIndex + 1)) {
    if (!line.startsWith("  - ") && !line.startsWith("- ")) break;
    values.push(line.replace(/^\s*-\s*/, "").trim().replace(/^['\"]|['\"]$/g, ""));
  }
  return values.filter(Boolean);
}

function slugFromRel(rel) {
  return rel
    .replace(/^src\/data\/blog\//, "")
    .replace(/\.md$/, "")
    .split("/")
    .map(part => part.toLowerCase())
    .join("/");
}

function sqlString(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

const rows = walk(blogDir).map(file => {
  const content = fs.readFileSync(file, "utf8");
  const fm = frontmatterOf(content);
  const rel = path.relative(root, file);
  const draft = field(fm, "draft") === "true";
  const tags = arrayField(fm, "tags");
  return {
    slug: slugFromRel(rel),
    source_path: rel,
    title: field(fm, "title"),
    status: draft ? "draft" : "published",
    draft,
    pub_datetime: field(fm, "pubDatetime"),
    mod_datetime: field(fm, "modDatetime") || null,
    tags,
    description: field(fm, "description"),
    checksum: crypto.createHash("sha256").update(content).digest("hex"),
  };
});

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "posts-index.json"), JSON.stringify(rows, null, 2));

const sql = [
  "DELETE FROM posts_index;",
  ...rows.map(row =>
    `INSERT INTO posts_index (slug, source_path, title, status, draft, pub_datetime, mod_datetime, tags, description, checksum) VALUES (${sqlString(row.slug)}, ${sqlString(row.source_path)}, ${sqlString(row.title)}, ${sqlString(row.status)}, ${row.draft ? 1 : 0}, ${sqlString(row.pub_datetime)}, ${sqlString(row.mod_datetime)}, ${sqlString(JSON.stringify(row.tags))}, ${sqlString(row.description)}, ${sqlString(row.checksum)});`
  ),
  "",
].join("\n");
fs.writeFileSync(path.join(outDir, "posts-index.sql"), sql);

console.log(`Exported ${rows.length} posts to ${outDir}`);
