/**
 * Security headers, applied to every response.
 *
 * No Content-Security-Policy yet, deliberately: the site injects Google Tag
 * Manager and gtag inline, and GTM loads whatever tags the marketing team adds
 * later. A CSP written now would either be broken by the next tag added in the
 * GTM console or so permissive it proves nothing. It belongs in the same piece
 * of work as consent handling, once the tag inventory is settled.
 *
 * `standalone` output builds a self-contained server bundle, which is what a
 * container image or an App Runner deployment needs. It is harmless elsewhere.
 */

const securityHeaders = [
  // The site is never meant to be framed. Also covered by CSP frame-ancestors
  // when that lands, but this works in every browser today.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nothing on the site uses these, so refuse them rather than leave them open.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Two years, matching the HSTS preload requirement. Only sent over HTTPS.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // The dashboard must never be cached by a proxy or listed by a crawler.
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, private" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
