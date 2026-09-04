/* Sanity project/dataset resolved from PUBLIC_ env vars.
   In .astro/component context import.meta.env works directly;
   sanity.cli.ts uses process.env instead. */
function assertValue<T>(value: T | undefined, message: string): T {
  if (value === undefined || value === '') throw new Error(message);
  return value;
}

export const projectId = assertValue(
  import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  'Missing environment variable: PUBLIC_SANITY_PROJECT_ID',
);

export const dataset = assertValue(
  import.meta.env.PUBLIC_SANITY_DATASET,
  'Missing environment variable: PUBLIC_SANITY_DATASET',
);

export const apiVersion = import.meta.env.PUBLIC_SANITY_API_VERSION || '2025-01-01';
