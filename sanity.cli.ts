import { defineCliConfig } from 'sanity/cli';
import { loadEnv } from 'vite';

const { PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET } = loadEnv(
  process.env.NODE_ENV ?? 'development',
  process.cwd(),
  '',
);

export default defineCliConfig({
  api: {
    projectId: PUBLIC_SANITY_PROJECT_ID,
    dataset: PUBLIC_SANITY_DATASET,
  },
  // `npx sanity deploy` hosts Studio at https://srdjan-jovic-portfolio.sanity.studio
  // (the astro.config.mjs `/studio` redirect points here).
  studioHost: 'srdjan-jovic-portfolio',
  deployment: { autoUpdates: true, appId: 'oa68v3ecnieu840q2qg3jqre' },
});
