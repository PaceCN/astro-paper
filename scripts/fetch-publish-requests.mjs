#!/usr/bin/env node
/* eslint-disable no-console */
const baseUrl = process.env.PACE_NOTES_ADMIN_URL;
const token = process.env.PACE_NOTES_ADMIN_API_TOKEN;
const status = process.argv[2] || "queued";

if (!baseUrl || !token) {
  console.error("Set PACE_NOTES_ADMIN_URL and PACE_NOTES_ADMIN_API_TOKEN.");
  process.exit(1);
}

const response = await fetch(
  `${baseUrl.replace(/\/$/, "")}/api/admin/publish-requests?status=${encodeURIComponent(status)}`,
  { headers: { authorization: `Bearer ${token}` } }
);
const data = await response.json();
if (!response.ok) {
  console.error(data.error || `API failed: ${response.status}`);
  process.exit(1);
}
console.log(JSON.stringify(data, null, 2));
