import type { APIRoute } from 'astro';
import { SITE } from '@/config';

type Post = {
  slug: string;
  updatedAt?: string | number | null;
  createdAt: string | number;
};

function xmlEscape(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function urlEntry(loc: URL, lastmod?: Date) {
  return `  <url>
    <loc>${xmlEscape(loc.href)}</loc>${lastmod ? `
    <lastmod>${lastmod.toISOString()}</lastmod>` : ''}
  </url>`;
}

export const GET: APIRoute = async ({ site, url }) => {
  const baseURL = site?.href ?? SITE.website;
  let posts: Post[] = [];

  try {
    const response = await fetch(new URL('/api/posts?status=published&pageSize=50', url));
    const result = await response.json() as { success: boolean; data?: { posts: Post[] } };
    posts = result.data?.posts ?? [];
  } catch {
    posts = [];
  }

  const entries = [
    urlEntry(new URL('/', baseURL)),
    urlEntry(new URL('/about/', baseURL)),
    urlEntry(new URL('/archive/', baseURL)),
    urlEntry(new URL('/contact/', baseURL)),
    urlEntry(new URL('/privacy/', baseURL)),
    urlEntry(new URL('/terms/', baseURL)),
    ...posts.map(post => urlEntry(new URL(`/posts/${post.slug}/`, baseURL), new Date(post.updatedAt ?? post.createdAt))),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
};
