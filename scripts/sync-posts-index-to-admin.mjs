#!/usr/bin/env node
/* eslint-disable no-console */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = "/home/pace/.openclaw/workspace/tmp/pace-notes-d1-sync";
const baseUrl = process.env.PACE_NOTES_ADMIN_URL;
const password = process.env.PACE_NOTES_ADMIN_PASSWORD;

if (!baseUrl || !password) {
  console.error("Set PACE_NOTES_ADMIN_URL and PACE_NOTES_ADMIN_PASSWORD before syncing.");
  process.exit(1);
}

const exportResult = spawnSync(process.execPath, ["scripts/export-posts-index.mjs", outDir], {
  cwd: root,
  stdio: "inherit",
});
if (exportResult.status !== 0) process.exit(exportResult.status ?? 1);

const posts = JSON.parse(fs.readFileSync(path.join(outDir, "posts-index.json"), "utf8"));
const cookieJar = path.join(outDir, "cookies.txt");

function curl(args) {
  const result = spawnSync("curl", args, { encoding: "utf8" });
  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }
  return result.stdout;
}

const adminUrl = baseUrl.replace(/\/$/, "");
const loginPayload = JSON.stringify({ password });
curl([
  "-fsS",
  "-c",
  cookieJar,
  "-H",
  "content-type: application/json",
  "-X",
  "POST",
  "--data-binary",
  loginPayload,
  `${adminUrl}/api/admin/login`,
]);

const payloadPath = path.join(outDir, "sync-payload.json");
fs.writeFileSync(payloadPath, JSON.stringify({ replace: true, posts }));
const response = curl([
  "-fsS",
  "-b",
  cookieJar,
  "-H",
  "content-type: application/json",
  "-X",
  "POST",
  "--data-binary",
  `@${payloadPath}`,
  `${adminUrl}/api/admin/posts/import`,
]);
console.log(response);
