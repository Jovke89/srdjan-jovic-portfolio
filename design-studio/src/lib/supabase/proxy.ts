import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminClaims } from "@/lib/auth/claims";
import { supabasePublishableKey, supabaseUrl } from "./env";

/* Session refresh and admin guard START */
// Refreshes the Supabase session cookie on every matched request and
// redirects visitors without an admin session to /login.
// Pathnames here exclude the basePath (/design-studio).
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Keep getClaims directly after createServerClient, it refreshes the token
  const { data } = await supabase.auth.getClaims();
  const isAdmin = isAdminClaims(data?.claims);
  const isLoginPage = request.nextUrl.pathname === "/login";

  if (!isAdmin && !isLoginPage) {
    return redirectWithCookies(request, response, "/login");
  }

  if (isAdmin && isLoginPage) {
    return redirectWithCookies(request, response, "/");
  }

  return response;
}

// Redirect while keeping any refreshed session cookies
function redirectWithCookies(request: NextRequest, source: NextResponse, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const redirect = NextResponse.redirect(url);
  source.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
/* Session refresh and admin guard END */
