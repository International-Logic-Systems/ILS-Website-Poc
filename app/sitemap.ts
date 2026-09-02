import type { MetadataRoute } from "next";
import { nav } from "@/lib/content";
import { vehicles } from "@/lib/vehicles";
import { siteUrl } from "@/lib/site-url";

/**
 * Generated from the same nav and vehicle data the pages render from, so a new
 * page or contract vehicle cannot be left out of the sitemap by hand.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...nav.map((n) => ({
      url: `${base}${n.href}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...vehicles.map((v) => ({
      url: `${base}/contracts/${v.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
