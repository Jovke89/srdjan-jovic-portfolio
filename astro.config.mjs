// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

import sanity from '@sanity/astro';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

const {
  PUBLIC_SANITY_PROJECT_ID,
  PUBLIC_SANITY_DATASET,
  SITE_URL,
} = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');

/* Ship Studio dev preview + Vercel both build statically; content is pulled at build time
   and the site is redeployed by a Sanity publish webhook. */
export default defineConfig({
  site: SITE_URL || 'https://srdjan-jovic.webflow.io',
  output: 'static',
  adapter: vercel({ imageService: false }),
  build: {
    // Emit /contact/index.html so routes match the original Webflow URL shape.
    format: 'directory',
  },
  integrations: [
    sanity({
      projectId: PUBLIC_SANITY_PROJECT_ID,
      dataset: PUBLIC_SANITY_DATASET,
      apiVersion: '2025-01-01',
      useCdn: true,
      studioBasePath: '/studio',
    }),
    react(),
    sitemap({
      filter: (page) =>
        !page.includes('/studio') &&
        !page.endsWith('/401/') &&
        !page.endsWith('/404/'),
    }),
  ],
});
