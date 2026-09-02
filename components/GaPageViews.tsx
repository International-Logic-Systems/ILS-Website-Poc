"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Reports page views for client-side navigations.
 *
 * `gtag('config', …)` sends one page_view for the page the visitor landed on.
 * Every navigation after that is handled by the router without a document
 * load, so gtag never hears about it — without this, GA4 would report the
 * landing page and nothing else, and every internal journey would look like a
 * single-page session.
 *
 * The first render is skipped so the landing page is not counted twice.
 *
 * `usePathname` rather than `useSearchParams`: reading search params in a
 * component this high up opts the whole tree into dynamic rendering, so the
 * query string is read from `location` at the moment it is needed instead.
 */
export function GaPageViews({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();
  const landed = useRef(false);

  useEffect(() => {
    if (!landed.current) {
      landed.current = true; // the config call already reported this one
      return;
    }
    if (typeof window.gtag !== "function") return;

    // No `send_to`: with a single configured property gtag drops the event
    // rather than routing it, so the page_view reaches the dataLayer and never
    // leaves the browser. Verified by watching for the /g/collect beacon.
    window.gtag("event", "page_view", {
      page_path: `${pathname}${window.location.search}`,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, measurementId]);

  return null;
}
