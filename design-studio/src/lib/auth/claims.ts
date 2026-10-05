/* Admin claim check START */
// Admin role lives in app_metadata, which users cannot edit themselves.
// Mirrors private.is_admin() in the database.
export function isAdminClaims(claims: Record<string, unknown> | null | undefined): boolean {
  const appMetadata = claims?.app_metadata;
  if (!appMetadata || typeof appMetadata !== "object") return false;
  return (appMetadata as Record<string, unknown>).role === "admin";
}
/* Admin claim check END */
