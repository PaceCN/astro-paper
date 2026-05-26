import type { APIRoute } from 'astro';
import { SITE } from '@/config';

export const GET: APIRoute = ({ site }) => {
  const baseURL = site?.href ?? SITE.website;
  const sitemapURL = new URL('sitemap.xml', baseURL);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${sitemapURL.href}</loc>
  </sitemap>
</sitemapindex>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
};
