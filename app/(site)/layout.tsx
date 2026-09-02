import type { Metadata } from "next";
import "@fontsource/inter-tight/600.css";
import "@fontsource/inter-tight/700.css";
import "@fontsource/inter-tight/800.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/courier-prime/400.css";
import "@fontsource/courier-prime/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Assistant from "@/components/Assistant";
import {
  GoogleTagManagerNoScript,
  GoogleTagManagerScript,
} from "@/components/GoogleTagManager";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { getAnalytics } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: {
    default: "International Logic Systems, Inc. — Mission-grade software and AI",
    template: "%s — International Logic Systems, Inc.",
  },
  description:
    "ILS is an ISO-certified government contractor in the Washington, DC area, appraised at CMMI Maturity Level 3, providing integrated IT services, AI solutions, and flexible delivery to federal and commercial customers.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Resolved per request, so a change in the admin takes effect without a build.
  const analytics = await getAnalytics();

  return (
    <html lang="en">
      <body className="grid-bg min-h-screen">
        {/* First inside <body>, per GTM's snippet. */}
        <GoogleTagManagerNoScript containerId={analytics.gtmId} />
        <Header />
        <main>{children}</main>
        <Footer />
        <Assistant />
        <GoogleTagManagerScript containerId={analytics.gtmId} />
        <GoogleAnalytics measurementId={analytics.gaSuppressedByGtm ? null : analytics.gaId} />
      </body>
    </html>
  );
}
