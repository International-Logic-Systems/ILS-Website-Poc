/**
 * Admin root layout.
 *
 * A second root layout, in its own route group, so the dashboard gets a clean
 * document: no marketing header, no marketing footer, and Tailwind's preflight
 * scoped to these routes only. The public site keeps its hand-written
 * stylesheet exactly as it was.
 *
 * Navigating between the two groups is a full page load rather than a client
 * transition. For a dashboard behind a sign-in that is the correct trade.
 */

import type { Metadata, Viewport } from 'next';
// Fonts come from npm rather than next/font/google: this project vendors its
// typefaces so neither the build nor the runtime needs network access.
import '@fontsource/inter-tight/600.css';
import '@fontsource/inter-tight/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './tailwind.css';

export const metadata: Metadata = {
  title: {
    default: 'ILS Admin',
    template: '%s — ILS Admin',
  },
  description: 'Content, approvals and registration management for International Logic Systems.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#0e1b12',
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="admin-fonts">
      <body>{children}</body>
    </html>
  );
}
