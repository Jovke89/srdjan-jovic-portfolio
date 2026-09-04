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
  // Old /case-study* paths kept working after the rename to /case-studies*.
  // /studio now points at the separately-hosted Sanity Studio (see sanity.cli.ts /
  // `npx sanity deploy`) instead of a redirect to the old Webflow-era slug shape —
  // bundling the full Studio React app into this build was silently OOM-killing the
  // Vercel (Hobby, 8GB) build machine.
  redirects: {
    '/case-study': '/case-studies',
    '/case-study/[slug]': '/case-studies/[slug]',
    '/studio': 'https://srdjan-jovic-portfolio.sanity.studio',
  },
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
      // No studioBasePath: the embedded-Studio build (a full React SPA bundled into
      // this Astro build) is what was OOM-killing the Vercel build machine. Studio
      // now lives at its own Sanity-hosted URL; `redirects['/studio']` above sends
      // visitors there. `sanity:client` (used by every page) still comes from this
      // integration regardless of studioBasePath.
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
