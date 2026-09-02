/**
 * Tier 2 records — a second approver is required before anything here changes.
 *
 * The test for this tier is not "is it important", it is "could a contracting
 * officer rely on this to make an award decision, and what happens to ILS if
 * it is wrong". A contract number a CO cannot find, an expired appraisal
 * quoted as current, a federal customer named without written permission, and
 * a socio-economic claim that invites a size protest are all in that class.
 *
 * `values` on each record is the *live* value — what the public site renders.
 * Proposals never touch it. They sit in a ChangeRequest until approved.
 *
 * The field schema drives the form, the detail view and the side-by-side diff,
 * so a new record type needs no new UI.
 */

import { daysAgo, monthsAgo, monthsAhead } from '../clock';
import type { GovRecord, RecordKind, RecordTypeDef } from '../types';

/* ------------------------------------------------------------- schemas */

export const recordTypes: RecordTypeDef[] = [
  {
    kind: 'vehicle',
    label: 'Contract vehicles',
    singular: 'Contract vehicle',
    exposure:
      'A contracting officer searches SAM.gov and GSA eLibrary for the number printed here. If it does not resolve, ILS looks unqualified at exactly the moment it is being evaluated.',
    fields: [
      { key: 'name', label: 'Vehicle name', type: 'text' },
      {
        key: 'contractNumber',
        label: 'Contract number',
        type: 'code',
        help: 'Exactly as a contracting officer would search for it. Verify against the SAM.gov award record before proposing a change.',
      },
      { key: 'agency', label: 'Awarding agency', type: 'text' },
      { key: 'vehicleType', label: 'Vehicle type', type: 'text' },
      {
        key: 'periodOfPerformance',
        label: 'Period of performance',
        type: 'text',
        help: 'Include option periods only where they have been exercised.',
      },
      { key: 'setAside', label: 'Set-aside', type: 'text' },
      { key: 'scope', label: 'Scope / functional areas', type: 'textarea' },
      { key: 'orderingNote', label: 'Ordering note', type: 'markdown' },
      { key: 'pointOfContact', label: 'Point of contact', type: 'text' },
    ],
  },
  {
    kind: 'certification',
    label: 'Certifications & identifiers',
    singular: 'Certification',
    exposure:
      'Appraisal and certificate identifiers are verifiable in public directories. Publishing one that has lapsed, or that does not resolve, is a misrepresentation an evaluator can check in under a minute.',
    fields: [
      { key: 'name', label: 'Certification', type: 'text' },
      {
        key: 'identifier',
        label: 'Identifier',
        type: 'code',
        help: 'The appraisal or certificate number a third party would look up.',
      },
      { key: 'issuingBody', label: 'Issuing body', type: 'text' },
      { key: 'issuedDate', label: 'Issued / appraised', type: 'date' },
      {
        key: 'expirationDate',
        label: 'Expires',
        type: 'date',
        help: 'Drives the registration-health indicator on the Overview page.',
      },
      { key: 'scope', label: 'Scope of certification', type: 'textarea' },
      { key: 'verificationUrl', label: 'Public verification', type: 'text' },
    ],
  },
  {
    kind: 'designation',
    label: 'Socio-economic designations',
    singular: 'Designation',
    exposure:
      'Set-aside eligibility. A designation published without a current basis invites a size or status protest, and a false certification carries civil exposure well beyond the contract.',
    fields: [
      { key: 'name', label: 'Designation', type: 'text' },
      {
        key: 'basis',
        label: 'Basis',
        type: 'text',
        help: 'SBA certification, or the specific FAR representation relied on.',
      },
      { key: 'identifier', label: 'Certification / representation ID', type: 'code' },
      { key: 'effectiveDate', label: 'Effective', type: 'date' },
      { key: 'expirationDate', label: 'Expires / recertify by', type: 'date' },
      { key: 'naicsBasis', label: 'Size basis', type: 'text' },
      { key: 'statement', label: 'Published statement', type: 'textarea' },
    ],
  },
  {
    kind: 'reference',
    label: 'Client references & case studies',
    singular: 'Client reference',
    exposure:
      'Naming a federal customer without written permission breaches the terms most CORs give it under, and a performance figure the customer will not confirm is worse than no figure at all.',
    fields: [
      { key: 'customer', label: 'Customer', type: 'text' },
      { key: 'programme', label: 'Programme / system', type: 'text' },
      { key: 'contractNumber', label: 'Contract number', type: 'code' },
      { key: 'periodOfPerformance', label: 'Period of performance', type: 'text' },
      {
        key: 'permissionToName',
        label: 'Permission to name the customer',
        type: 'textarea',
        help: 'Written permission, from whom, and when. Verbal approval from a COR is not sufficient to publish.',
      },
      { key: 'referenceContact', label: 'Reference contact', type: 'text' },
      { key: 'outcome', label: 'Stated outcome', type: 'text' },
      { key: 'summary', label: 'Case study', type: 'markdown' },
    ],
  },
  {
    kind: 'bio',
    label: 'Leadership bios',
    singular: 'Leadership bio',
    exposure:
      'Key-personnel biographies are lifted verbatim into proposals. A credential or a year of experience stated here becomes a representation to the government in a bid.',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'credentials', label: 'Credentials', type: 'text' },
      { key: 'email', label: 'Published contact', type: 'text' },
      { key: 'bio', label: 'Biography', type: 'markdown' },
    ],
  },
];

export const recordTypeByKind = new Map<RecordKind, RecordTypeDef>(
  recordTypes.map((t) => [t.kind, t]),
);

/* --------------------------------------------------------- live records */

export const records: GovRecord[] = [
  /* -------------------------------------------------- contract vehicles */
  {
    id: 'vehicle-efast',
    kind: 'vehicle',
    name: 'FAA eFAST',
    values: {
      name: 'FAA eFAST — electronic Federal Aviation Simplified Acquisition Tool',
      contractNumber: '693KA9-18-A-00102',
      agency: 'Federal Aviation Administration',
      vehicleType: 'Master Ordering Agreement',
      periodOfPerformance: '23 Jan 2018 – 30 Sep 2029',
      setAside: 'Woman-owned small business',
      scope: 'Functional area: information technology services.',
      orderingNote:
        'ILS holds an eFAST Master Ordering Agreement, so FAA contracting officers can issue task orders directly through the vehicle without running a new competition outside it.',
      pointOfContact: 'Stephen Connelly, Program Manager, Business Development',
    },
    createdAt: monthsAgo(102),
    updatedAt: monthsAgo(7),
    lastApprovedBy: 'u-shah',
    lastApprovedAt: monthsAgo(7),
  },
  {
    id: 'vehicle-gsa-mas',
    kind: 'vehicle',
    name: 'GSA Multiple Award Schedule',
    values: {
      name: 'GSA Multiple Award Schedule — information technology services',
      contractNumber: 'GS-35F-397DA',
      agency: 'General Services Administration',
      vehicleType: 'Multiple Award Schedule contract',
      periodOfPerformance: 'to be confirmed',
      setAside: 'Woman-owned small business',
      scope: 'SINs to be supplied.',
      orderingNote:
        'The schedule number is published here so a contracting officer can look it up, but the period of performance and awarded SINs are still being confirmed against the GSA record. Ask and we will send the current terms rather than guess in public.',
      pointOfContact: 'Stephen Connelly, Program Manager, Business Development',
    },
    createdAt: monthsAgo(84),
    updatedAt: monthsAgo(14),
    lastApprovedBy: 'u-shah',
    lastApprovedAt: monthsAgo(14),
  },
  {
    id: 'vehicle-cio-sp3',
    kind: 'vehicle',
    name: 'NITAAC CIO-SP3 Small Business',
    values: {
      name: 'NITAAC CIO-SP3 Small Business',
      contractNumber: '75N98120D00167',
      agency: 'NITAAC, National Institutes of Health',
      vehicleType: 'Government-wide acquisition contract (GWAC)',
      periodOfPerformance: '15 Jun 2020 – 30 Apr 2027',
      setAside: 'Small business track',
      scope: 'IT services, outsourcing, IT operations and maintenance.',
      orderingNote:
        'CIO-SP3 is winding down. New task orders may no longer be available depending on your agency ordering deadline. If CIO-SP3 was your intended route, contact us and we will confirm what is still orderable and propose an alternative vehicle.',
      pointOfContact: 'Stephen Connelly, Program Manager, Business Development',
    },
    createdAt: monthsAgo(74),
    updatedAt: monthsAgo(4),
    lastApprovedBy: 'u-shah',
    lastApprovedAt: monthsAgo(4),
  },

  /* ------------------------------------- certifications and identifiers */
  {
    id: 'cert-cmmi',
    kind: 'certification',
    name: 'CMMI-DEV/SVC Maturity Level 3',
    values: {
      name: 'CMMI-DEV/SVC Maturity Level 3',
      identifier: '64877',
      issuingBody: 'CMMI Institute, appraised by a certified Lead Appraiser',
      issuedDate: monthsAgo(34),
      expirationDate: monthsAhead(2),
      scope:
        'Development and services constellations, covering federal application modernization, cloud and legacy migration, and IT service delivery.',
      verificationUrl: 'https://cmmiinstitute.com/pars',
    },
    createdAt: monthsAgo(34),
    updatedAt: monthsAgo(34),
    lastApprovedBy: 'u-shah',
    lastApprovedAt: monthsAgo(34),
  },
  {
    id: 'cert-iso-27001',
    kind: 'certification',
    name: 'ISO/IEC 27001:2022',
    values: {
      name: 'ISO/IEC 27001:2022 — Information Security Management System',
      identifier: 'GB24/ISMS/00918203',
      issuingBody: 'NQA Certification Ltd, accredited by UKAS',
      issuedDate: monthsAgo(19),
      expirationDate: monthsAhead(17),
      scope:
        'The information security management system covering the Fairfax corporate network, federal programme delivery environments, and personnel security processes for cleared and Public Trust positions.',
      verificationUrl: 'Certificate released on request through the contracts inbox',
    },
    createdAt: monthsAgo(19),
    updatedAt: daysAgo(6, 11, 0),
    lastApprovedBy: 'u-shah',
    lastApprovedAt: daysAgo(6, 11, 0),
  },
  {
    id: 'cert-iso-9001',
    kind: 'certification',
    name: 'ISO 9001:2015',
    values: {
      name: 'ISO 9001:2015 — Quality Management System',
      identifier: 'GB24/QMS/00918147',
      issuingBody: 'NQA Certification Ltd, accredited by UKAS',
      issuedDate: monthsAgo(19),
      expirationDate: monthsAhead(17),
      scope:
        'Quality management system for the provision of information technology services to federal customers.',
      verificationUrl: 'Certificate released on request through the contracts inbox',
    },
    createdAt: monthsAgo(19),
    updatedAt: monthsAgo(19),
    lastApprovedBy: 'u-shah',
    lastApprovedAt: monthsAgo(19),
  },
  {
    id: 'cert-entity-identifiers',
    kind: 'certification',
    name: 'Entity identifiers (UEI · CAGE · NAICS)',
    values: {
      name: 'Entity identifiers published on the capability statement',
      identifier: 'UEI K9TFMDLQ3XB7 · CAGE 4HRJ8',
      issuingBody: 'System for Award Management (SAM.gov)',
      issuedDate: monthsAgo(11),
      expirationDate: monthsAhead(2),
      scope:
        'Primary NAICS 541512 Computer Systems Design Services. Additional codes 541511, 541513, 541519, 541618 and 518210. Values mirror the SAM.gov entity record and must be reconciled against it before publication.',
      verificationUrl: 'https://sam.gov/entity/K9TFMDLQ3XB7',
    },
    createdAt: monthsAgo(11),
    updatedAt: monthsAgo(11),
    lastApprovedBy: 'u-mekuriya',
    lastApprovedAt: monthsAgo(11),
  },

  /* --------------------------------------- socio-economic designations */
  {
    id: 'desig-wosb',
    kind: 'designation',
    name: 'Woman-Owned Small Business (WOSB)',
    values: {
      name: 'Woman-Owned Small Business (WOSB)',
      basis: 'SBA certification under 13 CFR part 127',
      identifier: 'WOSB-2025-0148873',
      effectiveDate: monthsAgo(16),
      expirationDate: monthsAhead(20),
      naicsBasis: 'Small under NAICS 541512 — $34.0M average annual receipts size standard',
      statement:
        'International Logic Systems, Inc. is a woman-owned small business, certified by the U.S. Small Business Administration and founded in 1998 by its current chief executive.',
    },
    createdAt: monthsAgo(16),
    updatedAt: monthsAgo(16),
    lastApprovedBy: 'u-shah',
    lastApprovedAt: monthsAgo(16),
  },
  {
    id: 'desig-small-business',
    kind: 'designation',
    name: 'Small business size status',
    values: {
      name: 'Small business size status',
      basis: 'Annual representation in SAM.gov under FAR 52.219-1',
      identifier: 'FAR 52.219-1 representation',
      effectiveDate: monthsAgo(11),
      expirationDate: monthsAhead(2),
      naicsBasis:
        'Small under all registered NAICS codes: 541511, 541512, 541513, 541519, 541618, 518210',
      statement:
        'ILS represents as a small business under every NAICS code in its SAM.gov registration. The representation is renewed annually with the registration and is only as current as that renewal.',
    },
    createdAt: monthsAgo(11),
    updatedAt: monthsAgo(11),
    lastApprovedBy: 'u-mekuriya',
    lastApprovedAt: monthsAgo(11),
  },
  {
    id: 'desig-mentor-protege',
    kind: 'designation',
    name: 'SBA Mentor-Protégé Program',
    values: {
      name: 'SBA Mentor-Protégé Program',
      basis: 'No agreement currently in force',
      identifier: 'Not applicable',
      effectiveDate: '',
      expirationDate: '',
      naicsBasis: 'Not applicable',
      statement:
        'ILS has no active SBA Mentor-Protégé agreement. It is published as a negative rather than omitted, because an agency evaluating a joint venture will otherwise ask.',
    },
    createdAt: monthsAgo(11),
    updatedAt: monthsAgo(11),
    lastApprovedBy: 'u-shah',
    lastApprovedAt: monthsAgo(11),
  },

  /* -------------------------------- client references and case studies */
  {
    id: 'ref-exim-elms',
    kind: 'reference',
    name: 'EXIM Bank — Loan Management System (ELMS)',
    values: {
      customer: 'Export-Import Bank of the United States',
      programme: 'EXIM Loan Management System (ELMS)',
      contractNumber: '83000324F0071',
      periodOfPerformance: '01 Oct 2024 – 30 Sep 2027',
      permissionToName:
        'Written permission granted by the EXIM Contracting Officer Representative by email, renewed at option year exercise. Covers naming the agency and the system, and the zero-authorisation-lapse statement. Does not cover naming individual government staff.',
      referenceContact: 'Released on request to a contracting officer, not published',
      outcome: 'Zero authorisation lapses across the continuous monitoring cycle',
      summary: `The EXIM Loan Management System replaced legacy loan servicing for trade finance officers at the Export-Import Bank of the United States.

**The problem.** Loan servicing ran on a platform whose vendor support had ended. Every change carried an unbounded regression risk, and the authorisation package was reconstructed by hand before each assessment.

**What ILS delivered.** A service-based rebuild, cut over portfolio by portfolio so servicing never paused. Control evidence is emitted by the pipeline on merge rather than assembled at audit time, which is why the system has run its full continuous monitoring cycle without an authorisation lapse.

**Where it stands.** Release 4.2 added automated disbursement reconciliation against Treasury payment files, retiring a monthly two-person spreadsheet process.`,
    },
    createdAt: monthsAgo(22),
    updatedAt: monthsAgo(3),
    lastApprovedBy: 'u-shah',
    lastApprovedAt: monthsAgo(3),
  },
  {
    id: 'ref-interior-records',
    kind: 'reference',
    name: 'Department of the Interior — records system migration',
    values: {
      customer: 'U.S. Department of the Interior',
      programme: 'Records system migration with preserved data lineage',
      contractNumber: '140D0422F0083',
      periodOfPerformance: '12 Apr 2022 – 11 Apr 2025',
      permissionToName:
        'Written permission granted by the Interior Business Center Contracting Officer at contract closeout. Covers naming the department and describing the migration. Does not cover naming the specific records system.',
      referenceContact: 'Released on request to a contracting officer, not published',
      outcome: 'Migration completed with data lineage preserved for audit',
      summary: `Migration of Department of the Interior records systems off end-of-life infrastructure, with the data lineage preserved end to end for audit.

**The constraint.** A records system carries a retention obligation that outlives the platform holding it. A migration that loses provenance does not just lose metadata; it breaks the chain an auditor needs.

**What ILS delivered.** Lineage was captured before the move, validated after it, and reconciled against the source of record. Two undocumented downstream consumers surfaced during lineage review and were re-scoped before cutover rather than discovered as silent failures after it.`,
    },
    createdAt: monthsAgo(40),
    updatedAt: monthsAgo(15),
    lastApprovedBy: 'u-shah',
    lastApprovedAt: monthsAgo(15),
  },
  {
    id: 'ref-amtrak-reporting',
    kind: 'reference',
    name: 'Amtrak — operational reporting sustainment',
    values: {
      customer: 'National Railroad Passenger Corporation (Amtrak)',
      programme: 'Operational reporting development and sustainment',
      contractNumber: '2023-CIS-0417',
      periodOfPerformance: '01 Jul 2024 – 30 Jun 2027',
      permissionToName:
        'Written permission granted by the Amtrak contract manager. Commercial reference — Amtrak is not an appropriated agency and this award does not appear in USAspending.',
      referenceContact: 'Released on request, not published',
      outcome: 'Reporting sustained across the passenger rail network',
      summary: `Development and sustainment of the operational reporting used across the Amtrak passenger rail network.

**Why it matters.** Operational reporting is the least glamorous system in any transportation organisation and the first one anyone notices when it is wrong. The work is sustainment: releases that do not break the numbers people plan against.

**What ILS delivered.** A regular release cadence against a reporting platform with real data quality checks, replacing extracts that failed quietly.`,
    },
    createdAt: monthsAgo(26),
    updatedAt: monthsAgo(9),
    lastApprovedBy: 'u-shah',
    lastApprovedAt: monthsAgo(9),
  },

  /* --------------------------------------------------- leadership bios */
  {
    id: 'bio-shah',
    kind: 'bio',
    name: 'Nikki Shah — Chief Executive Officer',
    values: {
      name: 'Nikki Shah',
      role: 'Chief Executive Officer',
      credentials: 'Credentials to be supplied',
      email: 'teaming@intllogic.com',
      bio: 'Owner and chief executive of ILS. Accountable for delivery across the federal portfolio and the point of contact for teaming and subcontracting. Biography detail to be supplied.',
    },
    createdAt: monthsAgo(11),
    updatedAt: monthsAgo(11),
    lastApprovedBy: 'u-mekuriya',
    lastApprovedAt: monthsAgo(11),
  },
  {
    id: 'bio-connelly',
    kind: 'bio',
    name: 'Stephen Connelly — Program Manager, Business Development',
    values: {
      name: 'Stephen Connelly',
      role: 'Program Manager, Business Development',
      credentials: 'Credentials to be supplied',
      email: 'contracts@intllogic.com',
      bio: 'Handles contract vehicles, pricing and capture. The named point of contact on every vehicle listed on this site. Biography detail to be supplied.',
    },
    createdAt: monthsAgo(11),
    updatedAt: monthsAgo(11),
    lastApprovedBy: 'u-mekuriya',
    lastApprovedAt: monthsAgo(11),
  },
];
