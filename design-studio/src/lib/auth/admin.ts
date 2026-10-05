import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminClaims } from "./claims";

/* Admin guard START */
// Call at the top of every admin page and Server Action.
// The proxy also guards routes, but Server Actions must verify on their own.
export async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!isAdminClaims(data?.claims)) redirect("/login");

  return { supabase, claims: data!.claims };
}
/* Admin guard END */
