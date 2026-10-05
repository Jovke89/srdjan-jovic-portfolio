import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabasePublishableKey, supabaseUrl } from "./env";

/* Server Supabase client START */
// Cookie based client for Server Components, Server Actions and Route Handlers.
// Runs as the signed in admin, so RLS applies.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read only.
          // Safe to ignore because the proxy refreshes the session.
        }
      },
    },
  });
}
/* Server Supabase client END */
