import Script from "next/script";

/**
 * Google Tag Manager, loaded only when a container is configured.
 *
 * The container id arrives as a prop, resolved per request from the admin
 * settings (see lib/site-settings.ts). It is deliberately not read from a
 * `NEXT_PUBLIC_*` variable here: those are inlined at build time, which is
 * exactly what stops a non-developer changing the container.
 *
 * With no container configured these render nothing at all — no stray script
 * tag, no request to Google.
 *
 * The tag is on the public site only. The admin dashboard is behind a sign-in
 * and shows contract, approval and audit data; sending its page paths and
 * titles to an analytics container would leak internal structure and would
 * skew the numbers with staff traffic.
 *
 * Two parts, as GTM's own snippet specifies: the loader, and a `<noscript>`
 * iframe immediately inside `<body>` for clients without JavaScript.
 */

/** Loader. Rendered inside <body>; `afterInteractive` keeps it off the critical path. */
export function GoogleTagManagerScript({ containerId }: { containerId: string | null }) {
  if (!containerId) return null;

  return (
    <Script
      id="gtm-loader"
      strategy="afterInteractive"
      // GTM's standard snippet, with the container id interpolated. It is
      // Google's code verbatim rather than a paraphrase, so tag assistant and
      // preview mode behave exactly as documented.
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${containerId}');`,
      }}
    />
  );
}

/** Fallback for clients without JavaScript. Must be the first thing in <body>. */
export function GoogleTagManagerNoScript({ containerId }: { containerId: string | null }) {
  if (!containerId) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${containerId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
