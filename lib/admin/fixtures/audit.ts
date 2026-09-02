/**
 * The seeded audit trail.
 *
 * Two thirds of it is derived rather than written: every published Tier 1 item
 * and every change request already carries the facts an audit line needs, so
 * deriving them means the trail can never contradict the records it describes.
 *
 * Only the history that predates the seeded change requests is hand-written —
 * the original approvals that put each Tier 2 record on the site, and the
 * SAM.gov syncs.
 *
 * The same log backs three surfaces: the recent-activity feed on Overview, the
 * per-record trail on every Tier 2 record, and the full log in Settings.
 */

import { daysAgo, monthsAgo, todayAt } from '../clock';
import type { AuditEvent, ContentItem } from '../types';
import { changeRequests } from './approvals';
import { content } from './content';
import { recordTypeByKind } from './records';

const KIND_NOUN: Record<ContentItem['kind'], string> = {
  news: 'news post',
  job: 'job opening',
  event: 'event notice',
};

/* --------------------------------------------- derived: tier 1 publishes */

const contentEvents: AuditEvent[] = content
  .filter((item) => item.publishedAt !== null)
  .map((item) => ({
    id: `au-content-${item.id}`,
    at: item.publishedAt as string,
    actorId: item.authorId,
    action: 'published' as const,
    recordId: null,
    recordKind: null,
    changeRequestId: null,
    summary: `Published ${KIND_NOUN[item.kind]} “${item.title}”`,
    detail: null,
  }));

/* ------------------------------------------ derived: tier 2 change requests */

const changeEvents: AuditEvent[] = changeRequests.flatMap((cr) => {
  const typeLabel = recordTypeByKind.get(cr.recordKind)?.singular ?? 'record';
  const verb = cr.isNew ? 'creation of' : 'a change to';

  const proposed: AuditEvent = {
    id: `au-cr-${cr.id}-proposed`,
    at: cr.proposedAt,
    actorId: cr.proposedBy,
    action: 'proposed',
    recordId: cr.recordId,
    recordKind: cr.recordKind,
    changeRequestId: cr.id,
    summary: `Proposed ${verb} ${typeLabel.toLowerCase()} “${cr.recordName}”`,
    detail: cr.rationale,
  };

  if (cr.status === 'pending' || cr.decidedAt === null || cr.decidedBy === null) {
    return [proposed];
  }

  const decided: AuditEvent = {
    id: `au-cr-${cr.id}-decided`,
    at: cr.decidedAt,
    actorId: cr.decidedBy,
    action: cr.status === 'approved' ? 'approved' : 'rejected',
    recordId: cr.recordId,
    recordKind: cr.recordKind,
    changeRequestId: cr.id,
    summary:
      cr.status === 'approved'
        ? `Approved and applied the change to “${cr.recordName}”`
        : `Rejected the proposed change to “${cr.recordName}”`,
    detail: cr.decisionComment,
  };

  return [proposed, decided];
});

/* ------------------------------------------------ hand-written: the history */

const historyEvents: AuditEvent[] = [
  {
    id: 'au-sync-today',
    at: todayAt(6, 12),
    actorId: 'u-mekuriya',
    action: 'synced',
    recordId: null,
    recordKind: null,
    changeRequestId: null,
    summary: 'Synced entity registration and awards from SAM.gov and USAspending',
    detail:
      'Scheduled overnight sync. One difference detected: the awarded GSA schedule number does not match the number published on the site.',
  },
  {
    id: 'au-sync-yesterday',
    at: daysAgo(1, 6, 12),
    actorId: 'u-mekuriya',
    action: 'synced',
    recordId: null,
    recordKind: null,
    changeRequestId: null,
    summary: 'Synced entity registration and awards from SAM.gov and USAspending',
    detail: 'Scheduled overnight sync. Registration expiry now inside the ninety-day window.',
  },
  {
    id: 'au-sync-2',
    at: daysAgo(2, 6, 12),
    actorId: 'u-mekuriya',
    action: 'synced',
    recordId: null,
    recordKind: null,
    changeRequestId: null,
    summary: 'Synced entity registration and awards from SAM.gov and USAspending',
    detail: 'Scheduled overnight sync. No differences detected.',
  },
  {
    id: 'au-efast-approved',
    at: monthsAgo(7, 14, 0),
    actorId: 'u-shah',
    action: 'approved',
    recordId: 'vehicle-efast',
    recordKind: 'vehicle',
    changeRequestId: null,
    summary: 'Approved the eFAST period of performance extension to 30 Sep 2029',
    detail: 'Confirmed against the modification issued by the FAA contracting officer.',
  },
  {
    id: 'au-gsa-mas-approved',
    at: monthsAgo(14, 11, 30),
    actorId: 'u-shah',
    action: 'approved',
    recordId: 'vehicle-gsa-mas',
    recordKind: 'vehicle',
    changeRequestId: null,
    summary: 'Approved publishing the GSA schedule number with the period of performance withheld',
    detail:
      'Period of performance and SINs could not be confirmed against the GSA record at the time. Published the number alone rather than guessing the terms.',
  },
  {
    id: 'au-cmmi-created',
    at: monthsAgo(34, 10, 0),
    actorId: 'u-shah',
    action: 'approved',
    recordId: 'cert-cmmi',
    recordKind: 'certification',
    changeRequestId: null,
    summary: 'Approved the CMMI-DEV/SVC Maturity Level 3 appraisal record',
    detail: 'Appraisal 64877, verified in the CMMI Institute PARS directory.',
  },
  {
    id: 'au-iso-9001-created',
    at: monthsAgo(19, 9, 45),
    actorId: 'u-shah',
    action: 'approved',
    recordId: 'cert-iso-9001',
    recordKind: 'certification',
    changeRequestId: null,
    summary: 'Approved the ISO 9001:2015 certification record',
    detail: 'Certificate verified against the NQA issue.',
  },
  {
    id: 'au-iso-27001-created',
    at: monthsAgo(19, 9, 50),
    actorId: 'u-shah',
    action: 'approved',
    recordId: 'cert-iso-27001',
    recordKind: 'certification',
    changeRequestId: null,
    summary: 'Approved the ISO/IEC 27001:2022 certification record',
    detail: 'Transition audit from the 2013 standard completed. Certificate verified.',
  },
  {
    id: 'au-identifiers-created',
    at: monthsAgo(11, 8, 30),
    actorId: 'u-mekuriya',
    action: 'approved',
    recordId: 'cert-entity-identifiers',
    recordKind: 'certification',
    changeRequestId: null,
    summary: 'Approved publishing the entity identifiers (UEI, CAGE, primary NAICS)',
    detail: 'Reconciled field by field against the SAM.gov entity record.',
  },
  {
    id: 'au-wosb-created',
    at: monthsAgo(16, 13, 0),
    actorId: 'u-shah',
    action: 'approved',
    recordId: 'desig-wosb',
    recordKind: 'designation',
    changeRequestId: null,
    summary: 'Approved the Woman-Owned Small Business designation record',
    detail: 'SBA certification verified. Recertification date recorded.',
  },
  {
    id: 'au-small-business-created',
    at: monthsAgo(11, 8, 40),
    actorId: 'u-mekuriya',
    action: 'approved',
    recordId: 'desig-small-business',
    recordKind: 'designation',
    changeRequestId: null,
    summary: 'Approved the small business size representation record',
    detail: 'Tied to the annual SAM.gov renewal so the two cannot drift apart.',
  },
  {
    id: 'au-mpp-created',
    at: monthsAgo(11, 8, 50),
    actorId: 'u-shah',
    action: 'approved',
    recordId: 'desig-mentor-protege',
    recordKind: 'designation',
    changeRequestId: null,
    summary: 'Approved publishing the Mentor-Protégé position as a stated negative',
    detail: 'Agencies evaluating a joint venture ask. Better answered before they do.',
  },
  {
    id: 'au-interior-approved',
    at: monthsAgo(15, 14, 15),
    actorId: 'u-shah',
    action: 'approved',
    recordId: 'ref-interior-records',
    recordKind: 'reference',
    changeRequestId: null,
    summary: 'Approved the Department of the Interior case study',
    detail: 'Written release from the Interior Business Center contracting officer held on file.',
  },
  {
    id: 'au-amtrak-approved',
    at: monthsAgo(9, 10, 20),
    actorId: 'u-shah',
    action: 'approved',
    recordId: 'ref-amtrak-reporting',
    recordKind: 'reference',
    changeRequestId: null,
    summary: 'Approved the Amtrak operational reporting reference',
    detail: 'Written permission from the Amtrak contract manager held on file.',
  },
  {
    id: 'au-exim-created',
    at: monthsAgo(22, 11, 0),
    actorId: 'u-shah',
    action: 'approved',
    recordId: 'ref-exim-elms',
    recordKind: 'reference',
    changeRequestId: null,
    summary: 'Approved the EXIM Bank ELMS case study',
    detail:
      'Written permission from the EXIM contracting officer representative covers naming the agency and the system.',
  },
  {
    id: 'au-bio-shah-created',
    at: monthsAgo(11, 9, 0),
    actorId: 'u-mekuriya',
    action: 'approved',
    recordId: 'bio-shah',
    recordKind: 'bio',
    changeRequestId: null,
    summary: 'Approved the chief executive leadership bio placeholder',
    detail: 'Published with detail withheld rather than invented.',
  },
  {
    id: 'au-bio-connelly-created',
    at: monthsAgo(11, 9, 5),
    actorId: 'u-mekuriya',
    action: 'approved',
    recordId: 'bio-connelly',
    recordKind: 'bio',
    changeRequestId: null,
    summary: 'Approved the business development leadership bio placeholder',
    detail: 'Published with detail withheld rather than invented.',
  },
];

/** Newest first. The order the feed, the trail and the log all render in. */
export const auditLog: AuditEvent[] = [...contentEvents, ...changeEvents, ...historyEvents].sort(
  (a, b) => b.at.localeCompare(a.at),
);
