import type { APIRoute } from 'astro';
import { SITE } from '@/config';

type Post = {
  title: string;
  slug: string;
  content: string;
  description?: string;
  category?: string;
  tags?: string;
  createdAt: string | number;
  updatedAt?: string | number;
};

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function excerpt(post: Post) {
  return (post.description || post.content.replace(/[#>*_\[\]`-]/g, '').replace(/\s+/g, ' ').trim()).slice(0, 220);
}

export const GET: APIRoute = async ({ url }) => {
  let posts: Post[] = [];
  const siteUrl = SITE.website || url.origin;
  const channelUrl = new URL('/rss.xml', siteUrl).href;

  try {
    const response = await fetch(new URL('/api/posts?status=published&pageSize=50', url));
    const result = await response.json() as { success: boolean; data?: { posts: Post[] } };
    posts = result.data?.posts ?? [];
  } catch {
    posts = [];
  }

  const items = posts.map(post => {
    const link = new URL(`/posts/${post.slug}/`, siteUrl).href;
    const categories = [post.category, ...(post.tags || '').split(',')].map(item => item?.trim()).filter(Boolean);
    return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(excerpt(post))}</description>
      <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
      ${post.updatedAt ? `<lastBuildDate>${new Date(post.updatedAt).toUTCString()}</lastBuildDate>` : ''}
      ${categories.map(category => `<category>${escapeXml(category)}</category>`).join('')}
    </item>`;
  }).join('');

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE.title)}</title>
    <description>${escapeXml(SITE.desc)}</description>
    <link>${escapeXml(siteUrl)}</link>
    <atom:link href="${escapeXml(channelUrl)}" rel="self" type="application/rss+xml" />
    <language>${escapeXml(SITE.lang)}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>`, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' }
  });
};
