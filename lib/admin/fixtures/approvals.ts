/**
 * The approvals queue as the demo opens.
 *
 * Four pending change requests, chosen so the queue tells a story rather than
 * showing four variations of the same edit:
 *
 *   1. An expiring CMMI appraisal — routine, correct, and urgent.
 *   2. A published GSA MAS number that no longer resolves — a live error that
 *      is costing ILS credibility right now.
 *   3. A brand-new case study naming a federal customer on verbal permission
 *      only — the one that should be rejected on stage.
 *   4. A leadership bio expansion — mild, to show the gate is not reserved for
 *      emergencies.
 *
 * `proposed` is always the *complete* value set, built by spreading `previous`.
 * The diff view derives changed fields by comparison, so a field that was not
 * touched can never render as a change.
 *
 * `previous` is the snapshot of the live values at proposal time. For the four
 * pending requests it equals the live record. For the decided ones it is the
 * only surviving record of what the field used to say, which is what makes a
 * decided request's diff still readable months later.
 */

import { daysAgo, monthsAgo, monthsAhead } from '../clock';
import type { ChangeRequest } from '../types';
import { records } from './records';

/** Live values for a record, so a proposal can only differ where intended. */
function live(id: string): Record<string, string> {
  const record = records.find((r) => r.id === id);
  if (!record) throw new Error(`Cannot base a change request on unknown record: ${id}`);
  return record.values;
}

export const changeRequests: ChangeRequest[] = [
  {
    id: 'cr-cmmi-reappraisal',
    recordId: 'cert-cmmi',
    recordKind: 'certification',
    recordName: 'CMMI-DEV/SVC Maturity Level 3',
    isNew: false,
    previous: live('cert-cmmi'),
    proposed: {
      ...live('cert-cmmi'),
      identifier: '78312',
      issuedDate: daysAgo(24, 12, 0),
      expirationDate: monthsAhead(34),
      scope:
        'Development and services constellations, appraised against CMMI V3.0. Sampled projects covered federal application modernization (EXIM ELMS), cloud and legacy migration (USDA Farm Production and Conservation), and IT service delivery management.',
    },
    proposedBy: 'u-vasquez',
    proposedAt: daysAgo(2, 14, 20),
    rationale:
      'Benchmark re-appraisal completed and the result is now published in the CMMI Institute PARS directory under appraisal 78312. The identifier currently on the site, 64877, belongs to the previous appraisal, which expires in under ten weeks. Dates below are taken from the appraisal disclosure statement, not from the draft report.',
    exposure:
      'The appraisal identifier on the ILS capability statement is checked in a public directory. Leaving 64877 published past its expiration date means an evaluator verifying our CMMI claim finds a lapsed appraisal.',
    status: 'pending',
    decidedBy: null,
    decidedAt: null,
    decisionComment: null,
  },
  {
    id: 'cr-gsa-mas-number',
    recordId: 'vehicle-gsa-mas',
    recordKind: 'vehicle',
    recordName: 'GSA Multiple Award Schedule',
    isNew: false,
    previous: live('vehicle-gsa-mas'),
    proposed: {
      ...live('vehicle-gsa-mas'),
      contractNumber: '47QTCA22D008N',
      periodOfPerformance: '12 Aug 2022 – 11 Aug 2027 (base period)',
      scope:
        'SIN 54151S Information Technology Professional Services. SIN 54151HACS Highly Adaptive Cybersecurity Services, high value asset assessment and risk and vulnerability assessment subcategories.',
      orderingNote:
        'ILS holds a consolidated GSA Multiple Award Schedule contract under the Information Technology large category. Ordering activities can place task orders directly against the awarded SINs. The legacy GS-35F number was superseded at schedule consolidation and no longer resolves in GSA eLibrary.',
    },
    proposedBy: 'u-okafor',
    proposedAt: daysAgo(4, 10, 45),
    rationale:
      'The number published on the site is the pre-consolidation schedule number. A contracting officer searching GSA eLibrary for GS-35F-397DA gets no result. The current contract number, period of performance and awarded SINs below are taken from the GSA eLibrary record and match the USAspending award now showing in the Contracts panel.',
    exposure:
      'This is a live error, not a pending improvement. Every day it stays published, a contracting officer who looks ILS up finds nothing and moves to the next vendor on the list.',
    status: 'pending',
    decidedBy: null,
    decidedAt: null,
    decisionComment: null,
  },
  {
    id: 'cr-usda-fpac-case-study',
    recordId: 'ref-usda-fpac',
    recordKind: 'reference',
    recordName: 'USDA Farm Production and Conservation — cloud migration',
    isNew: true,
    previous: null,
    proposed: {
      customer: 'U.S. Department of Agriculture, Farm Production and Conservation Business Center',
      programme: 'Farm loan and conservation programme application cloud migration',
      contractNumber: '12FPC824F0135',
      periodOfPerformance: '04 Mar 2024 – 03 Mar 2027',
      permissionToName:
        'Verbal approval given by the FPAC Contracting Officer Representative during the phase II readiness review. Written confirmation requested by email, not yet received.',
      referenceContact: 'Released on request to a contracting officer, not published',
      outcome: 'Eleven applications cleared phase II readiness with no conditional findings',
      summary: `The USDA Farm Production and Conservation Business Center consolidated programme support functions and inherited a portfolio of applications running on end-of-life infrastructure.

**The problem.** Eleven programme applications supporting farm loan and conservation delivery could not be patched to a supported baseline in place. Several had interfaces that existed in production but in no interface control document.

**What ILS delivered.** A phased migration into a FedRAMP-authorised environment, with readiness criteria agreed with the customer before phase I: validated data lineage, a rehearsed rollback, an accepted control inheritance model, and a named government owner for every interface.

**Where it stands.** All eleven applications cleared the phase II readiness review without a conditional finding. Two interfaces were re-scoped after lineage review surfaced an undocumented downstream consumer that would have failed silently after cutover.`,
    },
    proposedBy: 'u-brennan',
    proposedAt: daysAgo(1, 9, 15),
    rationale:
      'Drafted from the phase II readiness review readout so we have a current federal migration reference to point at. The COR was enthusiastic about it in the room. I have asked for the written release by email and expect it this week — flagging that it is not in hand yet.',
    exposure:
      'Publishing this names a federal customer, a contract number and a performance claim. The permission field records verbal approval only. Most CORs give permission to be named under terms that require it in writing, and a customer who finds themselves named without it does not raise it with communications — they raise it with the contracting officer.',
    status: 'pending',
    decidedBy: null,
    decidedAt: null,
    decisionComment: null,
  },
  {
    id: 'cr-shah-bio',
    recordId: 'bio-shah',
    recordKind: 'bio',
    recordName: 'Nikki Shah — Chief Executive Officer',
    isNew: false,
    previous: live('bio-shah'),
    proposed: {
      ...live('bio-shah'),
      credentials: 'Founder and owner, International Logic Systems · federal IT delivery since 1998',
      bio: `Founder, owner and chief executive of International Logic Systems, which she established in Fairfax, Virginia in 1998 as a woman-owned small business.

Accountable for delivery across the federal portfolio, and the named point of contact for teaming and subcontracting arrangements. She represents ILS in industry policy discussions on the federal small business market, most recently on a Women Impacting Public Policy panel on capital access for woman-owned federal contractors.`,
    },
    proposedBy: 'u-brennan',
    proposedAt: daysAgo(6, 15, 30),
    rationale:
      'The current bio has read "biography detail to be supplied" since the site launched, which looks worse than saying nothing. Every claim in the replacement is already published elsewhere on the ILS site or in the WIPP panel announcement. No credentials, degrees or figures have been added that are not already public.',
    exposure:
      'Key-personnel biographies are lifted verbatim into proposal volumes. Anything stated here becomes a representation to the government in a bid, so it needs the same review as a technical claim.',
    status: 'pending',
    decidedBy: null,
    decidedAt: null,
    decisionComment: null,
  },

  /* ------------------------------------------------------------------- */
  /* Decided requests. These populate each record's audit trail and the   */
  /* recent-activity feed, so the demo does not open on an empty history. */
  /* ------------------------------------------------------------------- */
  {
    id: 'cr-iso-27001-surveillance',
    recordId: 'cert-iso-27001',
    recordKind: 'certification',
    recordName: 'ISO/IEC 27001:2022',
    isNew: false,
    previous: {
      ...live('cert-iso-27001'),
      scope:
        'The information security management system covering the Fairfax corporate network and corporate IT operations.',
    },
    proposed: { ...live('cert-iso-27001') },
    proposedBy: 'u-vasquez',
    proposedAt: daysAgo(8, 14, 10),
    rationale:
      'Second surveillance audit closed with two minor observations, both remediated inside the audit window. The audit also confirmed the scope extension to the federal programme delivery environments and the personnel security processes, so the published scope statement needs to widen to match the certificate.',
    exposure:
      'A published ISO scope narrower than the certificate undersells the ISMS; one wider than the certificate is a misrepresentation an evaluator can verify with one email to the certification body.',
    status: 'approved',
    decidedBy: 'u-shah',
    decidedAt: daysAgo(6, 11, 0),
    decisionComment:
      'Verified word for word against the certificate PDF from NQA. The scope statement now matches the certificate exactly.',
  },
  {
    id: 'cr-cio-sp3-winddown',
    recordId: 'vehicle-cio-sp3',
    recordKind: 'vehicle',
    recordName: 'NITAAC CIO-SP3 Small Business',
    isNew: false,
    previous: {
      ...live('vehicle-cio-sp3'),
      periodOfPerformance: 'end date to be confirmed',
      orderingNote:
        'ILS holds a place on the NITAAC CIO-SP3 Small Business government-wide acquisition contract. Agencies can order IT services, outsourcing, and IT operations and maintenance directly through the vehicle.',
    },
    proposed: { ...live('vehicle-cio-sp3') },
    proposedBy: 'u-connelly',
    proposedAt: monthsAgo(4, 11, 0),
    rationale:
      'NITAAC has confirmed the ordering deadline. Adding the honest note about wind-down rather than leaving the vehicle listed as though it were freely orderable.',
    exposure:
      'Listing a vehicle as available when new task orders can no longer be placed wastes a contracting officer’s time and is the kind of thing they remember.',
    status: 'approved',
    decidedBy: 'u-shah',
    decidedAt: monthsAgo(4, 15, 20),
    decisionComment: 'Agreed. Better to say it plainly than have a CO discover it themselves.',
  },
  {
    id: 'cr-exim-figure',
    recordId: 'ref-exim-elms',
    recordKind: 'reference',
    recordName: 'EXIM Bank — Loan Management System (ELMS)',
    isNew: false,
    previous: live('ref-exim-elms'),
    proposed: {
      ...live('ref-exim-elms'),
      outcome: '68% reduction in loan disbursement processing time',
    },
    proposedBy: 'u-brennan',
    proposedAt: monthsAgo(3, 10, 30),
    rationale:
      'Adding the processing-time figure from the internal release readout so the case study leads with a number.',
    exposure:
      'A performance figure attributed to a federal customer that the customer will not confirm is worse than publishing no figure at all.',
    status: 'rejected',
    decidedBy: 'u-shah',
    decidedAt: monthsAgo(3, 16, 45),
    decisionComment:
      'The 68% figure comes from our own release readout, not from EXIM. We cannot attribute a performance claim to a customer who has not confirmed it. Ask the COR to confirm a figure in writing, or publish the zero-authorisation-lapse outcome, which they have already confirmed.',
  },
];

export const pendingChangeRequests = changeRequests.filter((cr) => cr.status === 'pending');
