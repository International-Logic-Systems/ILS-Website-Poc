/**
 * The site's public origin, used for canonical URLs and the sitemap.
 *
 * Set NEXT_PUBLIC_SITE_URL per environment so a staging deployment does not
 * publish canonical links pointing at production.
 */
const FALLBACK = "https://intllogic.com";

export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return FALLBACK;
  return raw.replace(/\/+$/, "");
}
