import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

if (!existsSync('dist/client') || !existsSync('dist/server/entry.mjs')) {
  throw new Error('Expected Astro Cloudflare output at dist/client and dist/server/entry.mjs');
}

await rm('dist-pages', { recursive: true, force: true });
await mkdir('dist-pages', { recursive: true });
await cp('dist/client', 'dist-pages', { recursive: true });
await cp('dist/server', 'dist-pages/_worker', { recursive: true });
await rm('dist/server/wrangler.json', { force: true });
await rm('dist-pages/_worker/wrangler.json', { force: true });
await writeFile('dist-pages/_worker.js', "export { default } from './_worker/entry.mjs';\n");
