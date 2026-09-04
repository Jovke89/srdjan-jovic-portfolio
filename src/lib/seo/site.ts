/* SITE_URL drives canonical, absolute og:image and every JSON-LD url/@id.
   Set via the SITE_URL env var; falls back to the live custom domain. */
export const SITE_URL = (
  import.meta.env.SITE_URL || 'https://www.srdjan-jovic.com'
).replace(/\/$/, '');

/** Absolute URL for a path, with NO trailing slash (matches the Webflow canonicals). */
export function absUrl(path: string): string {
  if (!path || path === '/') return SITE_URL;
  const clean = ('/' + path).replace(/\/{2,}/g, '/').replace(/\/$/, '');
  return SITE_URL + clean;
}

/** Canonical for the current page. Root -> bare origin, otherwise origin + path (no trailing slash). */
export function canonicalFor(pathname: string): string {
  return absUrl(pathname);
}
