// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

import sanity from '@sanity/astro';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// `loadEnv` reads `.env` files off disk (for local dev). On Vercel there is no `.env`
// file at all (gitignored) — real values only ever exist in `process.env`, injected
// from the dashboard, but for reasons never fully pinned down (a Node stdout-flush
// race on process.exit() was making the build log itself unreliable to debug by),
// `PUBLIC_SANITY_PROJECT_ID`/`PUBLIC_SANITY_DATASET` kept resolving empty specifically
// during Vercel's build, breaking `sanity:client` ("Configuration must contain
// `projectId`") every time. These two values are not secrets — they're the public
// identifiers of a public Sanity dataset, already visible in every API response this
// site makes from the browser — so they're hardcoded as the fallback here instead of
// depending on env-var propagation working correctly on every platform this builds on.
const env = {
  ...loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), ''),
  ...process.env,
};
const PUBLIC_SANITY_PROJECT_ID = env.PUBLIC_SANITY_PROJECT_ID || 'jhuyq5eb';
const PUBLIC_SANITY_DATASET = env.PUBLIC_SANITY_DATASET || 'cms-data-base';
const SITE_URL = env.SITE_URL;

/* Ship Studio dev preview + Vercel both build statically; content is pulled at build time
   and the site is redeployed by a Sanity publish webhook. */
export default defineConfig({
  site: SITE_URL || 'https://www.srdjan-jovic.com',
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
    // Default page-render concurrency was pushing peak memory over the Vercel
    // Hobby build machine's 8GB ceiling (silent OOM kill, no error output) once
    // enough /resources/[slug] pages render concurrently, each doing its own
    // Sanity fetches. Trade some build time for a lower, steadier memory peak.
    concurrency: 2,
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
      // Thin, near-duplicate taxonomy stubs (one list, no unique copy) are set to
      // noindex in their page templates, so they must also stay out of the sitemap
      // to avoid sending Google conflicting signals. /resource-category/* is kept:
      // those are real topic hubs for the resource center.
      filter: (page) =>
        !page.includes('/studio') &&
        !page.endsWith('/401/') &&
        !page.endsWith('/404/') &&
        !page.includes('/industry/') &&
        !page.includes('/tech-stack/') &&
        !page.includes('/authors/') &&
        !page.includes('/testimonials/'),
    }),
  ],
});
