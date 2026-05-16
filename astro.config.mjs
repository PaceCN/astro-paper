// @ts-check
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, envField, sessionDrivers } from 'astro/config';
import { SITE } from './src/config.ts';

export default defineConfig({
  site: SITE.website,
  output: 'server',
  devToolbar: {
    enabled: false
  },
  adapter: cloudflare({
    imageService: 'passthrough'
  }),
  session: {
    driver: sessionDrivers.lruCache()
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ['drizzle-orm', 'drizzle-orm/d1']
    }
  },
  image: {
    responsiveStyles: true,
    layout: 'constrained'
  },
  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: 'public',
        context: 'client',
        optional: true
      })
    }
  }
});
