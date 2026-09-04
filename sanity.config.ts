import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';

import { schemaTypes } from './src/sanity/schemaTypes';
import { structure } from './src/sanity/structure';

// Works both in the Studio (Vite: import.meta.env) and the Sanity CLI (Node: process.env).
// Same fallback as astro.config.mjs: these aren't secrets (public Sanity dataset
// identifiers), and env-var resolution at Studio build/deploy time proved unreliable
// ("Configuration must contain `projectId`" on the deployed Studio), so hardcode them.
const viteEnv = (import.meta as unknown as { env?: Record<string, string> }).env ?? {};
const projectId =
  viteEnv.PUBLIC_SANITY_PROJECT_ID || process.env.PUBLIC_SANITY_PROJECT_ID || 'jhuyq5eb';
const dataset =
  viteEnv.PUBLIC_SANITY_DATASET || process.env.PUBLIC_SANITY_DATASET || 'cms-data-base';

const singletonTypes = new Set(['siteSettings']);
const singletonActions = new Set(['publish', 'discardChanges', 'restore']);

export default defineConfig({
  name: 'default',
  title: 'Srdjan Jovic Portfolio',
  projectId,
  dataset,
  plugins: [structureTool({ structure }), visionTool()],
  schema: {
    types: schemaTypes,
    templates: (templates) =>
      templates.filter(({ schemaType }) => !singletonTypes.has(schemaType)),
  },
  document: {
    actions: (input, context) =>
      singletonTypes.has(context.schemaType)
        ? input.filter(({ action }) => action && singletonActions.has(action))
        : input,
    newDocumentOptions: (prev, { creationContext }) =>
      creationContext.type === 'global'
        ? prev.filter((templateItem) => !singletonTypes.has(templateItem.templateId))
        : prev,
  },
});
