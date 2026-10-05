import type { NextConfig } from "next";

/* Security headers START */
// Applied to every route. The app is private, so it must never be indexed.
const securityHeaders = [
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // SAMEORIGIN in dev so the app can be framed for responsive checks on localhost
  { key: "X-Frame-Options", value: process.env.NODE_ENV === "production" ? "DENY" : "SAMEORIGIN" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];
/* Security headers END */

const nextConfig: NextConfig = {
  // Served at srdjan-jovic.com/design-studio through a rewrite on the main site
  basePath: "/design-studio",
  typedRoutes: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
