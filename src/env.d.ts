/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database;
  ADMIN_PASSWORD: string;
  BACKEND_ENTRY: string;
  AI_API_TOKEN: string;
}
