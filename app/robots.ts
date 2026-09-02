import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

/**
 * Crawl the public site, never the dashboard or the API.
 *
 * The admin already sends `noindex` in its own metadata and an `X-Robots-Tag`
 * header; this stops a crawler asking in the first place.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
