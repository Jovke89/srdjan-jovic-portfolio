"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isAdminClaims } from "@/lib/auth/claims";
import { createClient } from "@/lib/supabase/server";

/* Auth actions START */
export type SignInState = { error: string | null; email: string };

const signInSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(200),
});

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const parsed = signInSchema.safeParse({ email, password: formData.get("password") });

  if (!parsed.success) {
    return { error: "Enter a valid email and password.", email };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.session) {
    return { error: "Invalid email or password.", email };
  }

  // Only accounts flagged as admin may use the app
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!isAdminClaims(claimsData?.claims)) {
    await supabase.auth.signOut();
    return { error: "This account has no access to Design Studio.", email };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
/* Auth actions END */
