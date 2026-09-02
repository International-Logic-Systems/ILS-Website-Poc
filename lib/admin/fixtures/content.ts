/**
 * Tier 1 content — publishes on click, no gate.
 *
 * News posts, job openings and event notices. Nothing here is a fact a
 * contracting officer would rely on to make an award decision, so nothing here
 * needs a second approver. The point of the tier is that it feels instant.
 *
 * One item of each kind is seeded as a draft so the presenter always has
 * something to publish live. The CMMI re-appraisal draft is deliberate: the
 * announcement goes out in one click, while the appraisal date on the
 * capability statement is a Tier 2 record that cannot.
 */

import { daysAgo, daysAhead } from '../clock';
import type { ContentItem } from '../types';

export const content: ContentItem[] = [
  /* ------------------------------------------------------------ news */
  {
    id: 'news-iso-27001-surveillance',
    kind: 'news',
    title: 'ILS closes ISO/IEC 27001:2022 surveillance audit with no major non-conformities',
    slug: 'iso-27001-surveillance-audit-2026',
    summary:
      'The second surveillance audit of the ILS information security management system closed with two minor observations, both remediated inside the audit window.',
    body: `International Logic Systems has completed the second surveillance audit of its ISO/IEC 27001:2022 information security management system with no major non-conformities recorded.

The audit covered the full declared ISMS scope: the Fairfax corporate network, the delivery environments supporting federal programme work, and the personnel security processes behind every Public Trust and Secret position ILS staffs.

**What the auditors examined**

- Privileged account review and access recertification across delivery environments
- Supplier and subcontractor security assessment records
- Incident response exercise evidence from the preceding twelve months
- Continuity of the risk treatment plan against the 2022 Annex A control set

Two minor observations were raised. Both concerned evidence retention rather than control design, and both were closed before the audit window ended.

"Our customers inherit our security posture whether they audit it or not," said Luis Vásquez, Quality and Compliance Manager. "A surveillance audit is the cheapest possible way to find out we are wrong about something."

The certificate remains in force. Agencies requiring a copy for a supply-chain risk assessment can request it through the contracts inbox.`,
    tags: ['ISO 27001', 'Cyber security', 'Compliance'],
    status: 'published',
    authorId: 'u-vasquez',
    createdAt: daysAgo(8, 14, 5),
    updatedAt: daysAgo(6, 10, 12),
    publishedAt: daysAgo(6, 10, 15),
  },
  {
    id: 'news-elms-release-42',
    kind: 'news',
    title: 'ELMS release 4.2 delivers automated disbursement reconciliation for EXIM Bank',
    slug: 'elms-release-4-2-disbursement-reconciliation',
    summary:
      'The latest EXIM Loan Management System release replaces a monthly spreadsheet reconciliation with an automated match against Treasury disbursement files.',
    body: `Release 4.2 of the EXIM Loan Management System (ELMS) entered production this month, delivering automated disbursement reconciliation to trade finance officers at the Export-Import Bank of the United States.

Before 4.2, reconciling ELMS disbursement records against Treasury payment files was a monthly spreadsheet exercise owned by two staff. The release replaces it with a scheduled match that flags only the exceptions.

**In the release**

- Automated match of ELMS disbursement records against the Treasury payment file
- Exception queue with reason codes, replacing the free-text annotation column
- Audit event emitted for every manual override, retained for the authorisation package
- Section 508 remediation of the disbursement detail view

The release shipped through the same CMMI-DEV/SVC ML 3 pipeline as every ELMS change: peer review, automated security scan, and control evidence captured on merge rather than reconstructed at audit time.

ELMS has run its full continuous monitoring cycle with zero authorisation lapses. Release 4.2 did not change that.`,
    tags: ['EXIM Bank', 'Application modernization', 'Release'],
    status: 'published',
    authorId: 'u-brennan',
    createdAt: daysAgo(21, 11, 0),
    updatedAt: daysAgo(19, 9, 45),
    publishedAt: daysAgo(19, 9, 50),
  },
  {
    id: 'news-fpac-migration-milestone',
    kind: 'news',
    title: 'USDA Farm Production and Conservation cloud migration passes phase II readiness review',
    slug: 'usda-fpac-phase-ii-readiness-review',
    summary:
      'Eleven programme applications cleared the phase II readiness review, clearing the way for cutover from end-of-life infrastructure.',
    body: `The ILS team supporting the USDA Farm Production and Conservation Business Center has cleared the phase II readiness review for its cloud migration programme.

Eleven programme applications were assessed against the readiness criteria agreed with the customer at phase I: a validated data lineage record, a rehearsed rollback, an accepted security control inheritance model, and a named government owner for every interface.

**Where phase II landed**

- Eleven applications assessed, eleven cleared without a conditional finding
- Two interfaces re-scoped after lineage review showed an undocumented downstream consumer
- Rollback rehearsed end to end for the two highest-criticality applications
- FedRAMP control inheritance documented and accepted by the customer ISSO

The undocumented consumer is the finding worth naming. It existed for years, was not in any interface control document, and would have failed silently after cutover. Lineage review is how it surfaced.

Phase III begins with the first production cutover window.`,
    tags: ['USDA', 'Cloud engineering', 'Legacy migration'],
    status: 'published',
    authorId: 'u-brennan',
    createdAt: daysAgo(34, 15, 20),
    updatedAt: daysAgo(33, 8, 30),
    publishedAt: daysAgo(33, 8, 35),
  },
  {
    id: 'news-kansas-city-presence',
    kind: 'news',
    title: 'ILS opens a delivery presence in Kansas City to support USDA programme work',
    slug: 'kansas-city-delivery-presence',
    summary:
      'A small delivery team now sits alongside the USDA Farm Production and Conservation Business Center, adding Kansas to the ILS footprint.',
    body: `International Logic Systems has established a delivery presence in Kansas City, Missouri, placing engineers in the same time zone and travel radius as the USDA Farm Production and Conservation Business Center.

The team is small by design — four engineers and a delivery lead — and exists to shorten the distance between a customer question and an engineer who can answer it.

**Why Kansas City**

The Business Center consolidated USDA programme support functions in the Kansas City area. Supporting a cutover programme from Fairfax alone meant every on-site day cost a travel day. Co-location removes that.

Kansas joins Virginia, Maryland, Washington DC, Delaware, New Jersey, New York, Pennsylvania, North Carolina, Colorado, California and Missouri on the published ILS footprint.

Corporate functions, contracts and pricing remain in Fairfax. Stephen Connelly stays the named point of contact on every vehicle.`,
    tags: ['Company', 'USDA', 'Locations'],
    status: 'published',
    authorId: 'u-brennan',
    createdAt: daysAgo(48, 13, 0),
    updatedAt: daysAgo(47, 9, 10),
    publishedAt: daysAgo(47, 9, 15),
  },
  {
    id: 'news-wipp-panel',
    kind: 'news',
    title: 'Nikki Shah joins WIPP panel on capital access for woman-owned federal contractors',
    slug: 'wipp-capital-access-panel',
    summary:
      'The ILS chief executive spoke on working-capital constraints facing woman-owned small businesses carrying multi-year federal task orders.',
    body: `Nikki Shah, chief executive of International Logic Systems, joined a Women Impacting Public Policy panel on capital access for woman-owned small businesses in the federal market.

The panel addressed a structural problem that rarely reaches acquisition policy discussions: a woman-owned small business that wins a multi-year task order carries payroll for cleared staff against invoices paid on a thirty-day cycle, and the working capital to do that is priced as though the receivable were commercial.

**Points raised**

- Prompt Payment Act interest does not offset the cost of the line of credit that bridges it
- Contract novation and vehicle transitions interrupt the payment history lenders underwrite against
- Size-standard growth can remove a firm's set-aside eligibility before its balance sheet catches up

Shah founded ILS in Fairfax, Virginia in 1998. The firm has delivered to seven federal customers and holds CMMI-DEV/SVC ML 3.

A recording is expected from the organisers.`,
    tags: ['Company', 'WOSB', 'Leadership'],
    status: 'published',
    authorId: 'u-brennan',
    createdAt: daysAgo(63, 16, 40),
    updatedAt: daysAgo(61, 10, 0),
    publishedAt: daysAgo(61, 10, 5),
  },
  {
    id: 'news-cmmi-reappraisal',
    kind: 'news',
    title: 'ILS completes CMMI-DEV/SVC Maturity Level 3 re-appraisal',
    slug: 'cmmi-ml3-reappraisal-2026',
    summary:
      'The benchmark re-appraisal is complete and the new appraisal record has been published to the CMMI Institute PARS directory.',
    body: `International Logic Systems has completed its CMMI-DEV/SVC benchmark re-appraisal and has been reaffirmed at Maturity Level 3 for both the development and services constellations.

The appraisal was conducted by a certified Lead Appraiser against the CMMI V3.0 model and covered the practice areas ILS applies across federal delivery: requirements development and management, technical solution, verification and validation, configuration management, process quality assurance, and service delivery management.

**What the appraisal sampled**

- Application modernization delivery on the EXIM ELMS programme
- Cloud and legacy migration delivery on the USDA Farm Production and Conservation programme
- Service delivery management across IT operations engagements

Maturity Level 3 means the processes are defined at the organisation level and tailored to each programme from a common asset library, rather than reinvented per contract.

The appraisal record is publicly verifiable in the CMMI Institute Published Appraisal Results System. The appraisal identifier and expiration date shown on the ILS capability statement are being updated separately.`,
    tags: ['CMMI', 'Quality', 'Compliance'],
    status: 'draft',
    authorId: 'u-vasquez',
    createdAt: daysAgo(3, 16, 25),
    updatedAt: daysAgo(1, 11, 40),
    publishedAt: null,
  },

  /* ------------------------------------------------------------ jobs */
  {
    id: 'job-isso',
    kind: 'job',
    title: 'Information System Security Officer',
    slug: 'information-system-security-officer',
    summary:
      'Own the control evidence and continuous monitoring for a federal authorisation package. Secret clearance required.',
    body: `ILS is hiring an Information System Security Officer to own control evidence and continuous monitoring for a federal system authorisation.

**What you will do**

- Maintain the system security plan and the control implementation evidence behind it
- Run the continuous monitoring cycle: scan review, POA&M management, and control assessment support
- Prepare and defend evidence packages for the authorising official
- Work with the delivery team so control evidence is captured on merge, not reconstructed before an audit

**What you need**

- Active Secret clearance
- Five years supporting RMF authorisation packages under NIST SP 800-53
- Working knowledge of continuous monitoring tooling and POA&M discipline
- The judgement to distinguish a finding that matters from a scanner artefact

**Nice to have**

- Experience inside an ISO/IEC 27001 certified ISMS
- CISSP, CAP, or equivalent

Fairfax, Virginia. Full time. ILS is a woman-owned small business and an equal opportunity employer.`,
    tags: ['Cyber security', 'Secret', 'Fairfax'],
    status: 'published',
    authorId: 'u-brennan',
    createdAt: daysAgo(26, 10, 0),
    updatedAt: daysAgo(25, 9, 0),
    publishedAt: daysAgo(25, 9, 5),
    programme: 'Cyber security',
    location: 'Fairfax, VA',
    clearance: 'Secret',
    employmentType: 'Full time',
  },
  {
    id: 'job-senior-java-developer',
    kind: 'job',
    title: 'Senior Java Developer',
    slug: 'senior-java-developer',
    summary:
      'Build and sustain loan servicing software for the EXIM Loan Management System. Public Trust eligibility required.',
    body: `ILS is hiring a Senior Java Developer for the EXIM Loan Management System (ELMS), the loan servicing platform used by trade finance officers at the Export-Import Bank of the United States.

**What you will do**

- Design and build services in the ELMS platform, cut over portfolio by portfolio so the mission never pauses
- Work in a CMMI-DEV/SVC ML 3 pipeline: peer review, automated scan, evidence captured on merge
- Take features from a trade finance officer's actual problem through to production
- Mentor developers earlier in their federal delivery careers

**What you need**

- Seven years building production Java services, Spring or equivalent
- Relational data modelling against a domain you did not design
- Eligibility for a Public Trust position
- Comfort working on a system where a defect has a financial consequence

**Nice to have**

- Federal financial systems experience
- Section 508 accessibility remediation

Washington, DC. Full time.`,
    tags: ['Application modernization', 'EXIM', 'Public Trust'],
    status: 'published',
    authorId: 'u-brennan',
    createdAt: daysAgo(19, 11, 30),
    updatedAt: daysAgo(18, 8, 45),
    publishedAt: daysAgo(18, 8, 50),
    programme: 'Application modernization · EXIM programme',
    location: 'Washington, DC',
    clearance: 'Public Trust',
    employmentType: 'Full time',
  },
  {
    id: 'job-cloud-engineer-aws',
    kind: 'job',
    title: 'Cloud Engineer, AWS',
    slug: 'cloud-engineer-aws',
    summary:
      'Migrate and operate USDA programme workloads in a FedRAMP-authorised environment. Public Trust eligibility required.',
    body: `ILS is hiring a Cloud Engineer to migrate and operate USDA programme workloads in a FedRAMP-authorised AWS environment.

**What you will do**

- Move programme applications off end-of-life infrastructure with lineage preserved for audit
- Build and maintain infrastructure as code for the target environment
- Document control inheritance so the customer ISSO can accept it rather than re-derive it
- Rehearse rollback before every cutover window, and mean it

**What you need**

- Five years operating production AWS workloads
- Terraform or CloudFormation at a level where you own the state, not just the templates
- Eligibility for a Public Trust position
- Migration experience where the source system had no reliable documentation

**Nice to have**

- FedRAMP or GovCloud environment experience
- Database migration across engine boundaries

Fairfax, VA, hybrid. Full time.`,
    tags: ['Cloud engineering', 'USDA', 'Public Trust'],
    status: 'published',
    authorId: 'u-brennan',
    createdAt: daysAgo(15, 14, 0),
    updatedAt: daysAgo(14, 9, 20),
    publishedAt: daysAgo(14, 9, 25),
    programme: 'Cloud engineering · USDA programme',
    location: 'Fairfax, VA · hybrid',
    clearance: 'Public Trust',
    employmentType: 'Full time',
  },
  {
    id: 'job-data-engineer',
    kind: 'job',
    title: 'Data Engineer',
    slug: 'data-engineer',
    summary:
      'Rebuild programme reporting on a migrated platform, replacing spreadsheet extracts with governed pipelines.',
    body: `ILS is hiring a Data Engineer to rebuild federal programme reporting on migrated platforms, replacing spreadsheet extracts with governed pipelines.

**What you will do**

- Build warehousing and reporting pipelines for programme and financial reporting
- Establish data quality checks that fail loudly rather than producing a plausible wrong number
- Work with programme staff who know the data better than any schema does
- Retire the spreadsheet extracts, permanently

**What you need**

- Five years building production data pipelines
- SQL at a level where you can read someone else's four-hundred-line report query and find the bug
- Dimensional modelling and slowly changing dimensions in practice, not just in theory

**Nice to have**

- Federal programme or financial reporting experience
- Data lineage and governance tooling

Remote, United States. Full time. No clearance required.`,
    tags: ['Data and analytics', 'Remote'],
    status: 'published',
    authorId: 'u-brennan',
    createdAt: daysAgo(12, 10, 15),
    updatedAt: daysAgo(11, 13, 0),
    publishedAt: daysAgo(11, 13, 5),
    programme: 'Data and analytics',
    location: 'Remote (US)',
    clearance: 'None required',
    employmentType: 'Full time',
  },
  {
    id: 'job-business-analyst',
    kind: 'job',
    title: 'Business Analyst',
    slug: 'business-analyst',
    summary:
      'Translate between federal programme staff and an engineering team on an application modernization programme.',
    body: `ILS is hiring a Business Analyst for an application modernization programme, working between federal programme staff and the engineering team.

**What you will do**

- Elicit and document requirements from programme staff who describe outcomes, not systems
- Maintain traceability from a stated need through to the delivered capability
- Facilitate user acceptance testing with people who have day jobs
- Write the interface control documentation that does not exist yet

**What you need**

- Four years as a business analyst on federal software delivery
- Requirements traceability under a defined process — CMMI ML 3 or equivalent
- Eligibility for a Public Trust position
- The patience to ask the fourth clarifying question

Washington, DC. Full time.`,
    tags: ['Application modernization', 'Public Trust'],
    status: 'published',
    authorId: 'u-brennan',
    createdAt: daysAgo(9, 9, 0),
    updatedAt: daysAgo(8, 15, 30),
    publishedAt: daysAgo(8, 15, 35),
    programme: 'Application modernization',
    location: 'Washington, DC',
    clearance: 'Public Trust',
    employmentType: 'Full time',
  },
  {
    id: 'job-service-desk-tier-2',
    kind: 'job',
    title: 'Service Desk Analyst, Tier 2',
    slug: 'service-desk-analyst-tier-2',
    summary:
      'Second-line support for federal logistics and programme support systems, in an ITIL-aligned service management practice.',
    body: `ILS is hiring a Tier 2 Service Desk Analyst supporting federal logistics and programme support systems.

**What you will do**

- Resolve escalations from Tier 1 against a documented service catalogue
- Own incidents through to root cause rather than through to closure code
- Contribute to the known-error database so the same incident is cheaper the second time
- Work to ITIL-aligned service management with real service level targets

**What you need**

- Three years in a Tier 2 or equivalent support role
- Windows and Linux endpoint and server troubleshooting
- Ticketing discipline: a record someone else can act on without calling you

**Nice to have**

- ITIL Foundation
- Federal service desk experience

Fairfax, VA. Full time. No clearance required.`,
    tags: ['IT operations', 'Fairfax'],
    status: 'draft',
    authorId: 'u-brennan',
    createdAt: daysAgo(2, 15, 10),
    updatedAt: daysAgo(0, 8, 20),
    publishedAt: null,
    programme: 'IT operations',
    location: 'Fairfax, VA',
    clearance: 'None required',
    employmentType: 'Full time',
  },

  /* ---------------------------------------------------------- events */
  {
    id: 'event-efast-industry-day',
    kind: 'event',
    title: 'FAA eFAST functional area briefing — industry day',
    slug: 'faa-efast-functional-area-briefing',
    summary:
      'ILS will attend the FAA eFAST industry day covering the information technology services functional area and the FY27 ordering outlook.',
    body: `ILS will attend the FAA electronic Federal Aviation Simplified Acquisition Tool (eFAST) industry day.

The session covers the information technology services functional area, changes to the ordering process, and the FY27 outlook for task order competition under the Master Ordering Agreement.

**Who should come**

Contracting officers and programme staff considering an eFAST task order for IT services, and small businesses evaluating a teaming arrangement on the vehicle.

**Finding us**

Stephen Connelly, Program Manager for Business Development, is the named ILS point of contact on eFAST and will be present for the full session. ILS holds eFAST Master Ordering Agreement 693KA9-18-A-00102.

If you want a specific requirement discussed, send it ahead through the contracts inbox rather than raising it cold on the day.`,
    tags: ['eFAST', 'FAA', 'Industry day'],
    status: 'published',
    authorId: 'u-connelly',
    createdAt: daysAgo(24, 10, 0),
    updatedAt: daysAgo(23, 11, 15),
    publishedAt: daysAgo(23, 11, 20),
    eventStart: daysAhead(16, 9, 0),
    venue: 'FAA Headquarters, Orville Wright Building',
    city: 'Washington, DC',
    registrationLabel: 'Registration through the FAA eFAST programme office',
  },
  {
    id: 'event-acquisition-teaming-session',
    kind: 'event',
    title: 'Small business teaming session — GSA MAS information technology services',
    slug: 'gsa-mas-small-business-teaming-session',
    summary:
      'An open teaming session for small businesses looking at a Contractor Teaming Arrangement under the GSA Multiple Award Schedule.',
    body: `ILS is hosting an open teaming session for small businesses evaluating a Contractor Teaming Arrangement under the GSA Multiple Award Schedule for information technology services.

**What we will cover**

- How a CTA is structured under MAS, and where firms usually get the privity wrong
- Which capabilities ILS is actively seeking a partner for: identity management, and geospatial data engineering
- What ILS brings: CMMI-DEV/SVC ML 3 process discipline, an ISO/IEC 27001:2022 certified ISMS, and delivery past performance with seven federal customers
- What we will ask of you: named past performance, a real security posture, and a size representation that holds up

**Who should come**

Small businesses with delivered federal past performance in the two capability areas above. This is not a capability briefing and there will be no slides about our founding story.

Attendance is capped so the conversations stay useful.`,
    tags: ['GSA MAS', 'Teaming', 'Small business'],
    status: 'published',
    authorId: 'u-connelly',
    createdAt: daysAgo(11, 16, 0),
    updatedAt: daysAgo(10, 9, 30),
    publishedAt: daysAgo(10, 9, 35),
    eventStart: daysAhead(29, 13, 0),
    venue: 'ILS corporate office, 12150 Monument Drive, Suite 825',
    city: 'Fairfax, VA',
    registrationLabel: 'Register through the teaming inbox',
  },
  {
    id: 'event-afcea-bethesda',
    kind: 'event',
    title: 'ILS at the AFCEA Bethesda Health IT Summit',
    slug: 'afcea-bethesda-health-it-summit',
    summary:
      'ILS staff will attend the AFCEA Bethesda Health IT Summit, with a focus on legacy modernization sessions.',
    body: `ILS delivery and business development staff will attend the AFCEA Bethesda Health IT Summit.

Our interest is the legacy modernization track: agencies presenting on moving mainframe and COBOL-era systems to supported platforms without losing the data lineage an auditor will ask for.

**Why we are going**

ILS has delivered legacy migration for the Department of the Interior and the USDA Farm Production and Conservation Business Center. The technical problem is well understood. The part that is consistently underestimated is the undocumented downstream consumer — the interface nobody recorded, which fails silently after cutover.

We would rather compare notes with agencies who have hit it than present at them.

**Finding us**

We are attending, not exhibiting. Reach out through the teaming inbox to arrange a conversation on either day.`,
    tags: ['AFCEA', 'Conference', 'Legacy migration'],
    status: 'published',
    authorId: 'u-brennan',
    createdAt: daysAgo(38, 9, 45),
    updatedAt: daysAgo(37, 14, 0),
    publishedAt: daysAgo(37, 14, 5),
    eventStart: daysAhead(45, 8, 0),
    venue: 'Bethesda North Marriott Hotel and Conference Center',
    city: 'Bethesda, MD',
    registrationLabel: 'Registration through AFCEA Bethesda',
  },
  {
    id: 'event-cleared-open-house',
    kind: 'event',
    title: 'Virtual open house — cleared engineering roles',
    slug: 'virtual-open-house-cleared-engineering',
    summary:
      'A one-hour virtual session for engineers holding an active Secret clearance or eligible for Public Trust.',
    body: `ILS is running a one-hour virtual open house for engineers holding an active Secret clearance, or eligible for a Public Trust position.

**Format**

Thirty minutes on what the work actually is — the programmes, the customers, the delivery process — and thirty minutes of questions with the hiring managers, not a recruiter reading a slide.

**Roles in scope**

- Information System Security Officer (Secret, Fairfax VA)
- Senior Java Developer (Public Trust, Washington DC)
- Cloud Engineer, AWS (Public Trust, Fairfax VA hybrid)
- Business Analyst (Public Trust, Washington DC)

**What we will be straight about**

Clearance processing timelines, whether the role is genuinely hybrid, and which programmes are funded through which option year. Ask.

Joining details are sent on registration.`,
    tags: ['Careers', 'Cleared', 'Virtual'],
    status: 'draft',
    authorId: 'u-brennan',
    createdAt: daysAgo(1, 13, 50),
    updatedAt: daysAgo(0, 10, 5),
    publishedAt: null,
    eventStart: daysAhead(21, 16, 0),
    venue: 'Virtual — joining link on registration',
    city: 'Online',
    registrationLabel: 'Register through the careers inbox',
  },
];

/** Counts used by the Overview cards, derived so they never drift from the data. */
export const contentByKind = {
  news: content.filter((c) => c.kind === 'news'),
  job: content.filter((c) => c.kind === 'job'),
  event: content.filter((c) => c.kind === 'event'),
};
