import type { APIRoute } from 'astro';
import { SITE } from '@/config';

type Post = {
  title: string;
  slug: string;
  content: string;
  createdAt: string | number;
};

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function excerpt(content: string) {
  return content.replace(/[#>*_\[\]`-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 180);
}

export const GET: APIRoute = async ({ url, site }) => {
  let posts: Post[] = [];
  const siteUrl = site?.href ?? SITE.website;

  try {
    const response = await fetch(new URL('/api/posts?status=published&pageSize=50', url));
    const result = await response.json() as { success: boolean; data?: { posts: Post[] } };
    posts = result.data?.posts ?? [];
  } catch {
    posts = [];
  }

  const items = posts.map(post => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(new URL(`/posts/${post.slug}/`, siteUrl).href)}</link>
      <guid>${escapeXml(new URL(`/posts/${post.slug}/`, siteUrl).href)}</guid>
      <description>${escapeXml(excerpt(post.content))}</description>
      <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
    </item>`).join('');

  return new Response(`<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(SITE.title)}</title>
    <description>${escapeXml(SITE.desc)}</description>
    <link>${escapeXml(siteUrl)}</link>${items}
  </channel>
</rss>`, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' }
  });
};
