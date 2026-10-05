import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/* Proxy START */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Skip static assets, the public client link (/p/...) and API routes,
  // which validate their own token or bearer key.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|p/|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2)$).*)",
  ],
};
/* Proxy END */
