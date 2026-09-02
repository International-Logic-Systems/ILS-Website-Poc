/**
 * SAM.gov and USAspending client.
 *
 * The UI imports `samClient` and nothing else from this directory. Today it is
 * backed by fixtures; dropping in a real API key and live `fetch` calls is a
 * change to `fixture-client.ts` (or a sibling `live-client.ts` selected here)
 * and touches no component.
 *
 * The interface is deliberately narrow — three reads and a sync — because that
 * is all the dashboard needs, and a narrow interface is one a live client can
 * actually satisfy.
 */

import type { Award, EntityRegistration, SyncResult } from '../admin/types';
import { fixtureSamClient } from './fixture-client';

/** Re-exported so consumers have one import surface for the SAM domain. */
export type {
  Award,
  AwardStatus,
  EntityRegistration,
  NaicsCode,
  RegistrationStatus,
  SyncResult,
} from '../admin/types';

export interface SamClient {
  /** The entity's own SAM.gov registration record. */
  getEntityRegistration(): Promise<EntityRegistration>;
  /** Awarded contracts and vehicles, newest first. */
  getAwards(): Promise<Award[]>;
  /**
   * Refresh both from source and return them with the sync timestamp.
   * The UI shows a loading state for however long this takes.
   */
  sync(): Promise<SyncResult>;
  /** Whether this client is talking to the real APIs. Drives the demo ribbon. */
  readonly isLive: boolean;
}

/**
 * Selects the client implementation.
 *
 * A live implementation would be selected here on the presence of the
 * credentials, so the demo keeps working when they are absent:
 *
 *   const key = process.env.SAM_GOV_API_KEY;
 *   export const samClient: SamClient = key
 *     ? createLiveSamClient({ apiKey: key, uei: process.env.ILS_UEI! })
 *     : fixtureSamClient;
 *
 * It must stay server-side if it is ever live — an api.data.gov key in a
 * client bundle is a key you have published.
 */
export const samClient: SamClient = fixtureSamClient;
