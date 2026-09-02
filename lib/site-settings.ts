import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Settings an operator can change without a developer.
 *
 * The analytics ids used to be `NEXT_PUBLIC_*` environment variables, which are
 * inlined at build time — so changing a container id meant editing a file and
 * redeploying. Reading them at request time instead is what makes them
 * manageable from the admin dashboard.
 *
 * Precedence, highest first:
 *
 *   1. `server/settings.json`, written by the admin — the operator's choice
 *      always wins, because they are the one who can see the effect;
 *   2. the environment variables, so an existing deployment keeps working and
 *      infrastructure can still pin a value;
 *   3. nothing configured, in which case no tag loads at all.
 */

export type AnalyticsSettings = {
  gtmId: string | null;
  gaId: string | null;
};

export type SiteSettings = {
  version: 1;
  updatedAt: string;
  analytics: AnalyticsSettings;
};

export const GTM_PATTERN = /^GTM-[A-Z0-9]{4,12}$/;
export const GA_PATTERN = /^G-[A-Z0-9]{6,14}$/;

const STORE = path.join(process.cwd(), "server", "settings.json");

const clean = (v: unknown, re: RegExp): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim().toUpperCase();
  return re.test(t) ? t : null;
};

/** What the admin has stored, or null when nothing has been saved yet. */
export async function readSettings(): Promise<SiteSettings | null> {
  try {
    const raw = JSON.parse(await readFile(STORE, "utf8")) as SiteSettings;
    if (!raw || typeof raw !== "object") return null;
    return {
      version: 1,
      updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : "",
      analytics: {
        gtmId: clean(raw.analytics?.gtmId, GTM_PATTERN),
        gaId: clean(raw.analytics?.gaId, GA_PATTERN),
      },
    };
  } catch {
    return null;
  }
}

export type ResolvedAnalytics = AnalyticsSettings & {
  /** Where each value came from, so the admin can show it honestly. */
  source: { gtm: "admin" | "env" | "none"; ga: "admin" | "env" | "none" };
  /**
   * True when a GA id is configured but suppressed because GTM is also on.
   * Running both counts every visit twice, so GTM wins and the admin says so.
   */
  gaSuppressedByGtm: boolean;
};

export async function getAnalytics(): Promise<ResolvedAnalytics> {
  const stored = await readSettings();
  const envGtm = clean(process.env.NEXT_PUBLIC_GTM_ID, GTM_PATTERN);
  const envGa = clean(process.env.NEXT_PUBLIC_GA_ID, GA_PATTERN);

  const gtmId = stored?.analytics.gtmId ?? envGtm;
  const gaId = stored?.analytics.gaId ?? envGa;

  return {
    gtmId,
    gaId,
    source: {
      gtm: stored?.analytics.gtmId ? "admin" : envGtm ? "env" : "none",
      ga: stored?.analytics.gaId ? "admin" : envGa ? "env" : "none",
    },
    gaSuppressedByGtm: Boolean(gtmId && gaId),
  };
}
