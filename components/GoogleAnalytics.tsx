import Script from "next/script";
import { GaPageViews } from "./GaPageViews";

/**
 * Google Analytics 4, loaded directly via gtag.js.
 *
 * Only one of two routes should ever be live:
 *
 *   1. GA4 configured as a tag inside Google Tag Manager — no code, and the
 *      preferred route when GTM is already on the site;
 *   2. this component, which loads gtag.js itself.
 *
 * Running both double-counts every session, so the caller passes null when GTM
 * is active — see `gaSuppressedByGtm` in lib/site-settings.ts. That is the
 * mistake worth designing out: duplicate pageviews are invisible in the markup
 * and only show up later as inflated traffic nobody can explain.
 */

export function GoogleAnalytics({ measurementId }: { measurementId: string | null }) {
  const enabled = measurementId;
  if (!enabled) return null;

  return (
    <>
      <Script
        id="ga-loader"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${enabled}`}
      />
      <Script
        id="ga-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${enabled}');`,
        }}
      />
      {/* Client-side routing means gtag only ever sees the landing page unless
          something reports the rest. */}
      <GaPageViews measurementId={enabled} />
    </>
  );
}
