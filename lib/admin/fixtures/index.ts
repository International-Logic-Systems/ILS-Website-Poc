/**
 * The seed.
 *
 * `createSeedState()` returns a fresh deep copy every time it is called, so
 * "Reset demo data" in Settings genuinely restores the opening state rather
 * than handing back objects a previous session has already mutated.
 */

import { seededSyncedAt } from '../../sam/fixture-client';
import type {
  AuditEvent,
  Award,
  ChangeRequest,
  ContentItem,
  EntityRegistration,
  GovRecord,
  Opportunity,
} from '../types';
import { changeRequests } from './approvals';
import { auditLog } from './audit';
import { content } from './content';
import { opportunities } from './opportunities';
import { records } from './records';
import { awards, entityRegistration } from './registration';

export type SeedState = {
  content: ContentItem[];
  records: GovRecord[];
  changeRequests: ChangeRequest[];
  auditLog: AuditEvent[];
  entity: EntityRegistration;
  awards: Award[];
  opportunities: Opportunity[];
  lastSyncedAt: string;
};

/** structuredClone is available in every runtime this app targets. */
function clone<T>(value: T): T {
  return structuredClone(value);
}

export function createSeedState(): SeedState {
  return {
    content: clone(content),
    records: clone(records),
    changeRequests: clone(changeRequests),
    auditLog: clone(auditLog),
    entity: clone(entityRegistration),
    awards: clone(awards),
    opportunities: clone(opportunities),
    lastSyncedAt: seededSyncedAt,
  };
}

export { captureBriefFor, captureBriefs, rankedOpportunities } from './opportunities';
export { recordTypeByKind, recordTypes } from './records';
export { approvers, CURRENT_USER_ID, userById, userName, users } from './users';
