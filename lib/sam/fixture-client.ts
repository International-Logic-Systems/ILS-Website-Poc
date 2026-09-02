/**
 * Fixture-backed implementation of {@link SamClient}.
 *
 * ------------------------------------------------------------------------
 * WHERE THE REAL ENDPOINTS PLUG IN
 * ------------------------------------------------------------------------
 *
 * 1. Entity registration — SAM.gov Entity Management API v4
 *
 *      GET https://api.sam.gov/entity-information/v4/entities
 *          ?ueiSAM={uei}
 *          &includeSections=entityRegistration,coreData,assertions
 *          &api_key={SAM_GOV_API_KEY}
 *
 *    A standard api.data.gov key returns the public record, which carries
 *    everything this dashboard renders: legal business name, UEI, CAGE,
 *    registration status, expiration date, NAICS with size determinations,
 *    and PSC codes. Non-public fields (points of contact, banking) need a
 *    SAM.gov System Account with FOUO authorisation, and this dashboard
 *    deliberately renders none of them.
 *
 *    Map `entityRegistration.registrationExpirationDate` to
 *    `EntityRegistration.expirationDate` — it is the field the ninety-day
 *    callout keys off.
 *
 * 2. Awarded contracts — USAspending Award Search API v2
 *
 *      POST https://api.usaspending.gov/api/v2/search/spending_by_award/
 *      {
 *        "filters": {
 *          "recipient_search_text": ["{uei}"],
 *          "award_type_codes": ["A","B","C","D","IDV_A","IDV_B","IDV_C","IDV_E"]
 *        },
 *        "fields": ["Award ID","Recipient Name","Awarding Agency",
 *                   "Awarding Sub Agency","Start Date","End Date",
 *                   "Award Amount","NAICS","Set Aside Type"],
 *        "limit": 100
 *      }
 *
 *    No API key required, but it is rate limited, so cache the response.
 *    Award detail is at /api/v2/awards/{generated_unique_award_id}/.
 *
 *    USAspending only holds appropriated federal awards. Amtrak and USPS are
 *    not appropriated, so those rows carry `source: 'customer'` and must be
 *    merged in rather than overwritten — a naive replace-all sync deletes
 *    them every night.
 *
 * 3. Open solicitations — SAM.gov Get Opportunities API v2
 *
 *      GET https://api.sam.gov/opportunities/v2/search
 *          ?ncode={naics}&ptype=o,k,r&postedFrom={mm/dd/yyyy}
 *          &postedTo={mm/dd/yyyy}&limit=100&api_key={SAM_GOV_API_KEY}
 *
 *    Feeds the Opportunity Scorer. Not part of this interface yet because the
 *    scorer reads its own fixtures; add a `searchOpportunities()` method here
 *    when it goes live, and keep the scoring in the route handler.
 *
 * ------------------------------------------------------------------------
 */

import { awards, entityRegistration, lastSyncedAt } from '../admin/fixtures/registration';
import type { Award, EntityRegistration, SyncResult } from '../admin/types';
import type { SamClient } from './index';

/**
 * The live client's latency, stood in for.
 *
 * A real Entity Management call plus a USAspending search runs to a couple of
 * seconds, which is long enough that the UI needs a loading state either way.
 * Simulating it here rather than in the component means the component does not
 * change when the client becomes real.
 */
const SIMULATED_SYNC_MS = 1_900;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * A fresh timestamp for each sync.
 *
 * Unlike the seeded fixture dates this is genuinely `now`, because it is
 * produced by a user action in the browser rather than at module load, so it
 * cannot cause a hydration mismatch.
 */
function now(): string {
  return new Date().toISOString();
}

export const fixtureSamClient: SamClient = {
  isLive: false,

  async getEntityRegistration(): Promise<EntityRegistration> {
    return entityRegistration;
  },

  async getAwards(): Promise<Award[]> {
    return awards;
  },

  async sync(): Promise<SyncResult> {
    await delay(SIMULATED_SYNC_MS);
    /* A live sync would refetch both, merge `customer` rows over the
       USAspending result, and return the merged set. The fixture returns the
       same data with a new timestamp — the point being demonstrated is that
       the site cannot go stale, not that the numbers moved. */
    return {
      syncedAt: now(),
      entity: entityRegistration,
      awards,
    };
  },
};

/** The sync that ran before the dashboard was opened. Seeds the store. */
export const seededSyncedAt = lastSyncedAt;
