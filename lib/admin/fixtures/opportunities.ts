/**
 * Open solicitations, pre-scored against the ILS profile.
 *
 * Scores and rationales are precomputed so the page is instant and works with
 * no network and no API key. The Rescore action can overwrite a single
 * opportunity's score at runtime, from the Anthropic API when a key is present
 * and from a simulated pass when it is not.
 *
 * The spread is deliberate. A scorer that returns 80-plus for everything is
 * useless, so the list runs from a 94 that ILS should drop everything for to a
 * 24 that is a hard exclusion. The two lowest are the honest ones: no amount
 * of capability overcomes a set-aside ILS does not hold or a vehicle it is not
 * on, and the rationale says so rather than hedging.
 *
 * Notice IDs use the SAM.gov format. Solicitation numbers use each agency's
 * own convention, which is why they all look different.
 */

import { daysAgo, daysAhead } from '../clock';
import type { CaptureBrief, Opportunity } from '../types';

export const opportunities: Opportunity[] = [
  {
    id: 'opp-exim-elms-followon',
    noticeId: 'b7c1f2a9d4e34c1e8a6b52f0d9c3e114',
    solicitationNumber: '83000326R0014',
    title: 'EXIM Loan Management System — Operations, Sustainment and Modernization Follow-On',
    agency: 'Export-Import Bank of the United States',
    subAgency: 'Office of the Chief Information Officer',
    noticeType: 'Presolicitation',
    naics: '541512',
    naicsTitle: 'Computer Systems Design Services',
    setAside: 'Woman-Owned Small Business (WOSB)',
    postedDate: daysAgo(9, 13, 0),
    responseDeadline: daysAhead(18, 17, 0),
    placeOfPerformance: 'Washington, DC',
    estimatedValue: '$14M – $18M over five years',
    route: 'GSA Multiple Award Schedule, SIN 54151S',
    summary:
      'Follow-on to the incumbent task order for operations, sustainment and continued modernization of the EXIM Loan Management System. Scope covers application sustainment, the continuous monitoring cycle supporting the system authorisation, Section 508 remediation, and continued decomposition of the remaining legacy loan servicing components. The Bank has signalled it intends to set the requirement aside for woman-owned small business and to order through the Multiple Award Schedule.',
    fitScore: 94,
    rationale:
      'ILS is the incumbent on this exact system under task order 83000324F0071 and holds the WOSB status the set-aside requires. The NAICS is the ILS primary code, the ordering route is the GSA MAS contract ILS already holds, and the zero-authorisation-lapse record is directly responsive to the continuous monitoring scope. The single risk is not capability but the schedule contract number published on the ILS site, which no longer resolves in GSA eLibrary.',
    requirements: [
      {
        label: 'WOSB set-aside eligibility',
        state: 'met',
        note: 'SBA-certified WOSB, certification current through the recertification date on file.',
      },
      {
        label: 'NAICS 541512 primary',
        state: 'met',
        note: 'Primary NAICS on the SAM.gov registration. Small under the $34.0M size standard.',
      },
      {
        label: 'GSA MAS SIN 54151S',
        state: 'met',
        note: 'Awarded SIN under the current schedule contract.',
      },
      {
        label: 'Demonstrated federal loan servicing system experience',
        state: 'met',
        note: 'Incumbent on ELMS since 2024, and on the predecessor modernization before it.',
      },
      {
        label: 'RMF continuous monitoring and ATO support',
        state: 'met',
        note: 'Full continuous monitoring cycle run with zero authorisation lapses.',
      },
      {
        label: 'CMMI-DEV Maturity Level 3 or higher',
        state: 'met',
        note: 'Appraised at ML 3. Re-appraisal complete; the published appraisal record is pending approval.',
      },
      {
        label: 'Section 508 conformance reporting (VPAT)',
        state: 'partial',
        note: 'Remediation delivered on ELMS release 4.2, but no current VPAT exists for the whole system.',
      },
      {
        label: 'Key personnel: Program Manager with 10 years federal financial systems',
        state: 'partial',
        note: 'Candidate identified internally, not yet committed in writing to this pursuit.',
      },
    ],
  },
  {
    id: 'opp-usda-fpac-phase3',
    noticeId: '4f8a03d61b7e42a9b0c5d8e2f1a49c37',
    solicitationNumber: '12FPC826R0022',
    title: 'FPAC Business Center — Programme Application Cloud Migration, Phase III',
    agency: 'Department of Agriculture',
    subAgency: 'Farm Production and Conservation Business Center',
    noticeType: 'Solicitation',
    naics: '541512',
    naicsTitle: 'Computer Systems Design Services',
    setAside: 'Total Small Business',
    postedDate: daysAgo(6, 10, 30),
    responseDeadline: daysAhead(13, 14, 0),
    placeOfPerformance: 'Kansas City, MO and remote',
    estimatedValue: '$9M – $12M over three years',
    route: 'GSA Multiple Award Schedule, SIN 54151S',
    summary:
      'Phase III of the FPAC programme application migration, covering production cutover of the eleven applications that cleared the phase II readiness review, decommissioning of the end-of-life source infrastructure, and sustainment of the migrated estate in the FedRAMP-authorised target environment. Requires demonstrated data lineage preservation and a rehearsed rollback for each cutover window.',
    fitScore: 89,
    rationale:
      'ILS holds the phase II task order on this programme and put the eleven applications through the readiness review the phase III scope depends on. The lineage-preservation and rollback requirements are written around the delivery approach ILS already runs here, and the new Kansas City delivery presence puts engineers in the customer travel radius. Scoring below the EXIM follow-on only because the small business set-aside is open to a wider field than a WOSB set-aside.',
    requirements: [
      {
        label: 'Total Small Business set-aside eligibility',
        state: 'met',
        note: 'Small under NAICS 541512 on the current SAM.gov representation.',
      },
      {
        label: 'FedRAMP-authorised environment experience',
        state: 'met',
        note: 'Phase I and II delivered into the customer FedRAMP-authorised environment.',
      },
      {
        label: 'Demonstrated data lineage preservation on a federal migration',
        state: 'met',
        note: 'Delivered on this programme and on the Interior records migration.',
      },
      {
        label: 'On-site presence within the Kansas City commuting area',
        state: 'met',
        note: 'Delivery team established in Kansas City, four engineers and a delivery lead.',
      },
      {
        label: 'Public Trust eligibility for all cutover staff',
        state: 'met',
        note: 'Existing programme staff are Public Trust cleared and adjudicated.',
      },
      {
        label: 'Named past performance in the last three years, cited by contract number',
        state: 'partial',
        note: 'The FPAC case study naming this customer is pending approval and lacks written permission to name.',
      },
    ],
  },
  {
    id: 'opp-faa-ato-servicedesk',
    noticeId: '9d2e5c81a4f74b6e93b7c0a5d8e14f22',
    solicitationNumber: '693KA926R00047',
    title: 'Air Traffic Organization — Enterprise Service Desk Modernization',
    agency: 'Department of Transportation',
    subAgency: 'Federal Aviation Administration',
    noticeType: 'Combined Synopsis/Solicitation',
    naics: '541513',
    naicsTitle: 'Computer Facilities Management Services',
    setAside: 'Woman-Owned Small Business (WOSB)',
    postedDate: daysAgo(4, 9, 0),
    responseDeadline: daysAhead(11, 16, 0),
    placeOfPerformance: 'Washington, DC and Atlantic City, NJ',
    estimatedValue: '$6M – $8M over three years',
    route: 'FAA eFAST Master Ordering Agreement',
    summary:
      'Modernization of the Air Traffic Organization enterprise service desk: consolidation onto a single ITSM platform, migration of the existing known-error database, tiered support from Tier 1 through Tier 3, and service level reporting against the ATO service catalogue. Ordered through eFAST under the information technology services functional area.',
    fitScore: 86,
    rationale:
      'The ordering route is the eFAST Master Ordering Agreement ILS already holds, and the set-aside matches the WOSB status. ILS runs an ITIL-aligned service desk practice today under the FAA ATO IT service management task order, so this is an adjacent expansion rather than a new customer. The Atlantic City site is the one soft spot — ILS has no published New Jersey delivery presence supporting FAA specifically.',
    requirements: [
      {
        label: 'eFAST Master Ordering Agreement holder',
        state: 'met',
        note: 'MOA 693KA9-18-A-00102, information technology services functional area.',
      },
      {
        label: 'WOSB set-aside eligibility',
        state: 'met',
        note: 'SBA-certified woman-owned small business.',
      },
      {
        label: 'ITIL-aligned service management practice',
        state: 'met',
        note: 'Tier 1 to 3 support delivered under the FAA ATO and USPS engagements.',
      },
      {
        label: 'Incumbent FAA past performance',
        state: 'met',
        note: 'Task order 693KA925F00218, IT service management support, active since 2025.',
      },
      {
        label: 'On-site coverage at the William J. Hughes Technical Center, Atlantic City',
        state: 'gap',
        note: 'New Jersey is on the published footprint but no FAA-supporting staff are based there. Would require hiring or a teaming partner.',
      },
      {
        label: 'ITSM platform migration experience (ServiceNow or equivalent)',
        state: 'partial',
        note: 'Platform operations experience is strong; a full platform consolidation has not been delivered under a federal contract.',
      },
    ],
  },
  {
    id: 'opp-interior-digitization',
    noticeId: '1a6b9c4e2f8d47a3b5c1e0f7d2a89b46',
    solicitationNumber: '140D0426R0031',
    title: 'Records Digitization and Data Lineage Services',
    agency: 'Department of the Interior',
    subAgency: 'Interior Business Center',
    noticeType: 'Solicitation',
    naics: '541511',
    naicsTitle: 'Custom Computer Programming Services',
    setAside: 'Total Small Business',
    postedDate: daysAgo(12, 11, 0),
    responseDeadline: daysAhead(24, 17, 0),
    placeOfPerformance: 'Denver, CO and remote',
    estimatedValue: '$4M – $6M over three years',
    route: 'Full and open among small business schedule holders',
    summary:
      'Digitization of departmental records holdings with provenance preserved end to end, migration of the resulting record set into the departmental records platform, and establishment of a lineage register that satisfies NARA retention and audit requirements.',
    fitScore: 81,
    rationale:
      'ILS delivered the Interior records system migration under task order 140D0422F0083 and has a written customer release naming the department, which is unusually strong for a past performance citation. The lineage requirement is the discriminator and it is the exact problem ILS solved here. Colorado is on the published footprint, though the Denver on-site expectation would need staffing confirmed rather than assumed.',
    requirements: [
      {
        label: 'Total Small Business set-aside eligibility',
        state: 'met',
        note: 'Small under NAICS 541511 on the current SAM.gov representation.',
      },
      {
        label: 'Prior Department of the Interior past performance',
        state: 'met',
        note: 'Records system migration, 140D0422F0083, completed April 2025 with written release to cite.',
      },
      {
        label: 'Demonstrated data lineage preservation for audit',
        state: 'met',
        note: 'The core discriminator, delivered on the prior Interior award and on USDA FPAC.',
      },
      {
        label: 'NARA records retention and scheduling knowledge',
        state: 'partial',
        note: 'Delivered against retention obligations, but no staff hold a formal records management credential.',
      },
      {
        label: 'Denver, CO on-site presence',
        state: 'partial',
        note: 'Colorado is on the published footprint; no named staff currently based there.',
      },
      {
        label: 'High-volume document capture and OCR operations',
        state: 'gap',
        note: 'Physical digitization at volume is not an ILS capability. Requires a teaming partner.',
      },
    ],
  },
  {
    id: 'opp-gsa-acquisition-data',
    noticeId: '7c3f1e8a5b9d42c6a0e4b7f2d8c15a93',
    solicitationNumber: '47QFCA26R0008',
    title: 'Acquisition Data Quality and Programme Reporting Support',
    agency: 'General Services Administration',
    subAgency: 'Federal Acquisition Service',
    noticeType: 'Solicitation',
    naics: '541512',
    naicsTitle: 'Computer Systems Design Services',
    setAside: 'Total Small Business',
    postedDate: daysAgo(15, 14, 30),
    responseDeadline: daysAhead(9, 17, 0),
    placeOfPerformance: 'Remote, United States',
    estimatedValue: '$3M – $5M over three years',
    route: 'GSA Multiple Award Schedule, SIN 54151S',
    summary:
      'Data quality remediation and reporting support for acquisition programme data, including automated quality rules, exception workflow, and replacement of the current spreadsheet-based reporting cycle with governed pipelines.',
    fitScore: 78,
    rationale:
      'ILS has delivered acquisition programme reporting and data quality support to GSA before, and the "replace spreadsheet extracts with governed pipelines" scope is the same problem shape as the USDA reporting work. Fully remote suits the ILS data practice. The score is held down by the response deadline, which is nine days out with no capture work started, and by GSA past performance that predates the three-year lookback most evaluators apply.',
    requirements: [
      {
        label: 'GSA MAS SIN 54151S',
        state: 'met',
        note: 'Awarded SIN under the current schedule contract.',
      },
      {
        label: 'Total Small Business set-aside eligibility',
        state: 'met',
        note: 'Small under NAICS 541512.',
      },
      {
        label: 'Federal acquisition data domain knowledge',
        state: 'met',
        note: 'Prior GSA acquisition programme reporting support.',
      },
      {
        label: 'Governed data pipeline delivery',
        state: 'met',
        note: 'USDA programme reporting rebuilt on the migrated platform, replacing spreadsheet extracts.',
      },
      {
        label: 'Past performance within the last three years, same agency',
        state: 'gap',
        note: 'The GSA reporting engagement falls outside the three-year window. Adjacent USDA work would have to carry the citation.',
      },
      {
        label: 'Response by deadline with a compliant volume set',
        state: 'partial',
        note: 'Nine days remaining and no capture work started. Achievable, but it costs the team a weekend.',
      },
    ],
  },
  {
    id: 'opp-nih-niaid-sustainment',
    noticeId: '5e9d2b7c1a4f48e3b6c0d5a2f7e13b84',
    solicitationNumber: '75N93126R00019',
    title: 'Scientific Application Sustainment and Modernization Support',
    agency: 'Department of Health and Human Services',
    subAgency: 'National Institute of Allergy and Infectious Diseases',
    noticeType: 'Sources Sought',
    naics: '541512',
    naicsTitle: 'Computer Systems Design Services',
    setAside: 'Total Small Business',
    postedDate: daysAgo(21, 9, 30),
    responseDeadline: daysAhead(31, 17, 0),
    placeOfPerformance: 'Rockville, MD',
    estimatedValue: '$7M – $10M over five years',
    route: 'To be determined — market research phase',
    summary:
      'Market research to identify small businesses capable of sustaining and modernizing scientific and research administration applications, including data management, workflow, and reporting systems supporting extramural research programmes.',
    fitScore: 74,
    rationale:
      'A sources sought is cheap to answer and this one is squarely in the ILS technical lane: application sustainment and modernization under the primary NAICS, with a Maryland place of performance already on the footprint. The scientific research administration domain is new to ILS, which is the honest gap. The ordering route is undetermined, and the CIO-SP3 vehicle ILS holds with this customer family is winding down.',
    requirements: [
      {
        label: 'Total Small Business set-aside eligibility',
        state: 'met',
        note: 'Small under NAICS 541512.',
      },
      {
        label: 'Application sustainment and modernization capability',
        state: 'met',
        note: 'Core ILS service line with delivered federal past performance.',
      },
      {
        label: 'Maryland place of performance',
        state: 'met',
        note: 'Maryland is on the published delivery footprint.',
      },
      {
        label: 'Scientific or research administration domain experience',
        state: 'gap',
        note: 'No delivered past performance in research administration systems.',
      },
      {
        label: 'A viable ordering vehicle with this customer',
        state: 'partial',
        note: 'CIO-SP3 is winding down and the route for this requirement has not been set. GSA MAS is the likely fallback.',
      },
    ],
  },
  {
    id: 'opp-army-rmf-support',
    noticeId: '3b8c6a1e9d5f47b2a4e0c7d3f8a26e51',
    solicitationNumber: 'W52P1J26R0117',
    title: 'RMF Security Control Assessment and Continuous Monitoring Support',
    agency: 'Department of Defense',
    subAgency: 'Army Contracting Command — Rock Island',
    noticeType: 'Solicitation',
    naics: '541519',
    naicsTitle: 'Other Computer Related Services',
    setAside: 'Total Small Business',
    postedDate: daysAgo(8, 8, 0),
    responseDeadline: daysAhead(20, 15, 0),
    placeOfPerformance: 'Rock Island, IL and Aberdeen Proving Ground, MD',
    estimatedValue: '$5M – $7M over three years',
    route: 'GSA Multiple Award Schedule, SIN 54151HACS',
    summary:
      'Security control assessment, POA&M management and continuous monitoring support for Army systems under the Risk Management Framework, including assessment of cloud-hosted systems against the DoD Cloud Computing Security Requirements Guide.',
    fitScore: 71,
    rationale:
      'ILS holds the incumbent Army task order for RMF assessment and continuous monitoring support and holds the HACS SIN the requirement orders through. The blocker is clearance depth rather than capability: the requirement calls for cleared assessors at Secret across two sites, and ILS staffs one cleared ISSO role today with a second open. A facility clearance requirement, if it appears in the final solicitation, would be a hard stop.',
    requirements: [
      {
        label: 'GSA MAS SIN 54151HACS',
        state: 'met',
        note: 'Awarded SIN, covering risk and vulnerability assessment.',
      },
      {
        label: 'Incumbent Army past performance',
        state: 'met',
        note: 'Task order W52P1J23F0294, RMF assessment and continuous monitoring, active.',
      },
      {
        label: 'NIST SP 800-53 control assessment capability',
        state: 'met',
        note: 'Delivered on the Army engagement and inside the ILS ISO/IEC 27001 certified ISMS.',
      },
      {
        label: 'Cleared assessors at Secret across two sites',
        state: 'partial',
        note: 'One cleared ISSO on staff, a second role open. Two sites would require three to four cleared assessors.',
      },
      {
        label: 'DoD Cloud Computing SRG assessment experience',
        state: 'partial',
        note: 'FedRAMP assessment experience is strong; the DoD SRG impact levels are adjacent but not delivered.',
      },
      {
        label: 'Facility Clearance (FCL) at Secret',
        state: 'gap',
        note: 'ILS does not hold an FCL. If the final solicitation requires one, this is a no-bid without a cleared prime.',
      },
    ],
  },
  {
    id: 'opp-amtrak-data-warehouse',
    noticeId: '8f4a2c9e6b1d43f7a5c8e2b0d6f39a17',
    solicitationNumber: '2026-CIS-0208',
    title: 'Operational Data Warehouse Sustainment and Modernization',
    agency: 'National Railroad Passenger Corporation (Amtrak)',
    subAgency: 'Chief Information Office',
    noticeType: 'Request for Information',
    naics: '541511',
    naicsTitle: 'Custom Computer Programming Services',
    setAside: 'Full and Open',
    postedDate: daysAgo(17, 15, 0),
    responseDeadline: daysAhead(27, 17, 0),
    placeOfPerformance: 'Philadelphia, PA and remote',
    estimatedValue: 'Not stated',
    route: 'Amtrak commercial procurement — not a federal set-aside',
    summary:
      'Request for information on approaches to sustaining and modernizing the operational data warehouse supporting network planning and performance reporting, including migration off the current platform and establishment of automated data quality controls.',
    fitScore: 68,
    rationale:
      'ILS is the incumbent on Amtrak operational reporting sustainment and has written permission to cite the reference, so the relationship and the domain are both real. Pennsylvania is on the delivery footprint. The score reflects the procurement rather than the fit: Amtrak buys commercially, so none of the socio-economic advantages that carry ILS in federal competitions apply, and ILS competes here on price and delivery record against larger firms.',
    requirements: [
      {
        label: 'Incumbent Amtrak past performance',
        state: 'met',
        note: 'Operational reporting sustainment, agreement 2023-CIS-0417, with written permission to cite.',
      },
      {
        label: 'Data warehousing and dimensional modelling capability',
        state: 'met',
        note: 'Core ILS data and analytics service line.',
      },
      {
        label: 'Pennsylvania place of performance',
        state: 'met',
        note: 'Pennsylvania is on the published delivery footprint.',
      },
      {
        label: 'Competitive commercial rate structure',
        state: 'partial',
        note: 'ILS rates are built for federal schedule pricing. A commercial competition prices differently.',
      },
      {
        label: 'Socio-economic advantage',
        state: 'gap',
        note: 'Not a federal set-aside. WOSB status carries no evaluation weight here.',
      },
    ],
  },
  {
    id: 'opp-treasury-cobol',
    noticeId: '2d7e4b8c3a6f41e9b0d5c2a7f4b18e63',
    solicitationNumber: '2032H626R00041',
    title: 'Legacy Financial System Remediation and Language Migration',
    agency: 'Department of the Treasury',
    subAgency: 'Bureau of the Fiscal Service',
    noticeType: 'Solicitation',
    naics: '541511',
    naicsTitle: 'Custom Computer Programming Services',
    setAside: 'Total Small Business',
    postedDate: daysAgo(19, 10, 0),
    responseDeadline: daysAhead(16, 17, 0),
    placeOfPerformance: 'Parkersburg, WV and remote',
    estimatedValue: '$8M – $11M over four years',
    route: 'Full and open among small business schedule holders',
    summary:
      'Remediation and staged migration of COBOL-era financial processing components to a supported platform, with transaction-level reconciliation against the legacy system throughout the transition and no interruption to daily settlement.',
    fitScore: 63,
    rationale:
      'The technical fit is genuinely strong — mainframe and COBOL-era migration with lineage preserved is a named ILS service line, delivered for Interior and USDA. What holds the score down is everything around it: no Treasury past performance, no West Virginia presence, and a settlement-critical financial system where evaluators weight same-agency experience heavily. This is a credible bid with a teaming partner and a weak one alone.',
    requirements: [
      {
        label: 'Total Small Business set-aside eligibility',
        state: 'met',
        note: 'Small under NAICS 541511.',
      },
      {
        label: 'COBOL and mainframe-era migration capability',
        state: 'met',
        note: 'Named ILS service line, delivered on Interior and USDA migrations.',
      },
      {
        label: 'Federal financial system experience',
        state: 'met',
        note: 'EXIM loan servicing and disbursement reconciliation against Treasury payment files.',
      },
      {
        label: 'Treasury or Bureau of the Fiscal Service past performance',
        state: 'gap',
        note: 'None. On a settlement-critical system, evaluators weight this heavily.',
      },
      {
        label: 'Parkersburg, WV on-site presence',
        state: 'gap',
        note: 'West Virginia is not on the ILS delivery footprint.',
      },
      {
        label: 'Transaction-level reconciliation during a live migration',
        state: 'partial',
        note: 'Delivered at ELMS scale, not at daily federal settlement volume.',
      },
    ],
  },
  {
    id: 'opp-usps-logistics-sustainment',
    noticeId: '6a1c8e3f9b2d45a7c4e0b6d1f3a95c28',
    solicitationNumber: '3AAOPS-26-Q-0074',
    title: 'Logistics Application Sustainment and Tier 2/3 Support',
    agency: 'United States Postal Service',
    subAgency: 'Supply Management, IT Category',
    noticeType: 'Solicitation',
    naics: '541513',
    naicsTitle: 'Computer Facilities Management Services',
    setAside: 'Full and Open',
    postedDate: daysAgo(11, 13, 30),
    responseDeadline: daysAhead(22, 17, 0),
    placeOfPerformance: 'Raleigh, NC',
    estimatedValue: 'Not stated',
    route: 'USPS commercial procurement — not a federal set-aside',
    summary:
      'Sustainment of logistics support applications and Tier 2/3 service desk coverage, including incident management to root cause, known-error database maintenance, and service level reporting against the USPS IT service catalogue.',
    fitScore: 58,
    rationale:
      'ILS holds the incumbent USPS logistics sustainment agreement and North Carolina is on the delivery footprint, so continuity and coverage are both real. The score is moderate because USPS procures commercially rather than under FAR set-asides, so ILS competes on price against larger sustainment providers with no socio-economic offset, and the incumbency advantage on a re-compete of this size is smaller than it looks.',
    requirements: [
      {
        label: 'Incumbent USPS past performance',
        state: 'met',
        note: 'Logistics application sustainment and service desk, agreement 3AAOPS-24-B-0119.',
      },
      {
        label: 'Tier 2/3 service desk capability',
        state: 'met',
        note: 'Delivered under this agreement and the FAA ATO service management task order.',
      },
      {
        label: 'Raleigh, NC place of performance',
        state: 'met',
        note: 'North Carolina is on the published delivery footprint.',
      },
      {
        label: 'Commercial price competitiveness at re-compete',
        state: 'partial',
        note: 'Larger sustainment providers can undercut a small business on a pure labour-hour basis.',
      },
      {
        label: 'Socio-economic advantage',
        state: 'gap',
        note: 'USPS is not subject to FAR set-asides. WOSB status carries no weight.',
      },
    ],
  },
  {
    id: 'opp-va-t4ng2-cloud',
    noticeId: '4c9b7d2a5e8f43c1b6a0d3e7f2c84b19',
    solicitationNumber: '36C10B26R0093',
    title: 'Enterprise Cloud Migration and Platform Operations Support',
    agency: 'Department of Veterans Affairs',
    subAgency: 'Office of Information and Technology',
    noticeType: 'Solicitation',
    naics: '541512',
    naicsTitle: 'Computer Systems Design Services',
    setAside: 'Service-Disabled Veteran-Owned Small Business',
    postedDate: daysAgo(13, 11, 45),
    responseDeadline: daysAhead(25, 16, 0),
    placeOfPerformance: 'Austin, TX and remote',
    estimatedValue: '$20M – $26M over five years',
    route: 'VA T4NG2 — Transformation Twenty-One Total Technology Next Generation 2',
    summary:
      'Migration of VA enterprise applications into the departmental cloud platform, with platform operations, control inheritance documentation and FedRAMP boundary management. Ordered exclusively through the T4NG2 vehicle under a service-disabled veteran-owned small business set-aside.',
    fitScore: 41,
    rationale:
      'The technical scope is an exact match for the ILS cloud and migration practice, and on capability alone this would score in the eighties. It scores 41 because ILS cannot bid it: the requirement is set aside for service-disabled veteran-owned small business, which ILS is not, and it is ordered exclusively through T4NG2, which ILS does not hold. The only route in is as a subcontractor to a T4NG2 prime.',
    requirements: [
      {
        label: 'Cloud migration and platform operations capability',
        state: 'met',
        note: 'Core service line, delivered at USDA FPAC in a FedRAMP-authorised environment.',
      },
      {
        label: 'FedRAMP control inheritance documentation',
        state: 'met',
        note: 'Delivered and accepted by the customer ISSO on the FPAC programme.',
      },
      {
        label: 'SDVOSB set-aside eligibility',
        state: 'gap',
        note: 'ILS is a woman-owned small business, not service-disabled veteran-owned. Hard exclusion as a prime.',
      },
      {
        label: 'T4NG2 vehicle holder',
        state: 'gap',
        note: 'ILS does not hold T4NG2 and the on-ramp is closed. Subcontracting to a prime is the only route.',
      },
      {
        label: 'VA past performance',
        state: 'gap',
        note: 'None.',
      },
    ],
  },
  {
    id: 'opp-hhs-8a-data-platform',
    noticeId: '0e5f3a8c7b4d42e6a9c1b7d0f5e23a94',
    solicitationNumber: '75FCMC26C0006',
    title: 'Enterprise Data Platform Development and Sustainment',
    agency: 'Department of Health and Human Services',
    subAgency: 'Centers for Medicare and Medicaid Services',
    noticeType: 'Solicitation',
    naics: '541512',
    naicsTitle: 'Computer Systems Design Services',
    setAside: '8(a) Competitive',
    postedDate: daysAgo(7, 16, 0),
    responseDeadline: daysAhead(14, 17, 0),
    placeOfPerformance: 'Woodlawn, MD and remote',
    estimatedValue: '$12M – $16M over five years',
    route: 'SBA 8(a) Business Development Program',
    summary:
      'Development and sustainment of an enterprise data platform supporting programme integrity analytics, including ingestion pipelines, a governed semantic layer, and self-service reporting for programme staff.',
    fitScore: 24,
    rationale:
      'Competed under the SBA 8(a) Business Development Program, and ILS is not an 8(a) participant. That is a hard eligibility exclusion no amount of capability overcomes, so the score stays low regardless of the strong NAICS and data-platform match. Listed only so the team can see it went out and decide whether to approach an 8(a) firm about a subcontract.',
    requirements: [
      {
        label: 'SBA 8(a) programme participant',
        state: 'gap',
        note: 'ILS is not an 8(a) participant and cannot become one for this procurement. Hard exclusion.',
      },
      {
        label: 'NAICS 541512 primary',
        state: 'met',
        note: 'Primary NAICS on the SAM.gov registration.',
      },
      {
        label: 'Data platform and pipeline delivery',
        state: 'met',
        note: 'USDA and GSA programme reporting, governed pipelines replacing spreadsheet extracts.',
      },
      {
        label: 'CMS or healthcare programme integrity experience',
        state: 'gap',
        note: 'None.',
      },
    ],
  },
];

/** Ranked, highest fit first. The order the scorer page and the digest render in. */
export const rankedOpportunities = [...opportunities].sort((a, b) => b.fitScore - a.fitScore);

/** The three that make the every-morning digest on the Overview page. */
export const digestOpportunityIds = rankedOpportunities.slice(0, 3).map((o) => o.id);

/**
 * The pre-written capture brief for the top opportunity.
 *
 * This is the closing moment of the demo: the point of the scorer is not the
 * score, it is that the work after the score is already done.
 */
export const captureBriefs: CaptureBrief[] = [
  {
    opportunityId: 'opp-exim-elms-followon',
    preparedAt: daysAgo(0, 6, 12),
    preparedBy: 'u-connelly',
    bidRecommendation: 'Bid — protect the incumbency',
    confidence: 'High confidence, one dependency',
    sections: [
      {
        heading: 'The opportunity in one paragraph',
        body: `EXIM intends to re-compete the operations, sustainment and modernization of the Loan Management System as a woman-owned small business set-aside, ordered through the GSA Multiple Award Schedule, with an estimated value of $14M to $18M over five years. ILS is the incumbent under task order 83000324F0071, which runs to 30 September 2027. Responses to the presolicitation are due in eighteen days; the solicitation itself is expected within sixty.`,
      },
      {
        heading: 'Why ILS wins this',
        body: `**Incumbency on the actual system.** Not adjacent work, not a similar system at another agency — this system, currently, with the delivery team already adjudicated at Public Trust and already inside the customer environment.

**A verifiable authorisation record.** ELMS has run its full continuous monitoring cycle with zero authorisation lapses, and EXIM has confirmed that outcome in writing. The scope weights continuous monitoring support heavily; ILS can cite a customer-confirmed result where competitors will describe a methodology.

**Set-aside and vehicle alignment.** SBA-certified WOSB matching the intended set-aside, and an awarded SIN 54151S on the GSA schedule the Bank intends to order through. Both are eligibility gates, not evaluation factors — competitors missing either are not in the competition.

**Delivery evidence, not delivery narrative.** Release 4.2 retired a monthly two-person spreadsheet reconciliation by matching disbursements against Treasury payment files. That is the kind of specific, checkable outcome an evaluation panel remembers.`,
      },
      {
        heading: 'Where we are exposed',
        body: `**The published schedule number is wrong.** The ILS site publishes GS-35F-397DA, which no longer resolves in GSA eLibrary after schedule consolidation. If an evaluator or contracting officer checks the vehicle before the solicitation drops, ILS looks like it does not hold the contract it is bidding through. The correction is sitting in the approvals queue. **This is the single highest-value action on this pursuit and it takes one click.**

**No current VPAT.** Section 508 remediation was delivered on release 4.2, but no conformance report exists for the system as a whole. If the solicitation requires a VPAT at proposal rather than at delivery, this becomes a schedule problem.

**Key personnel not committed.** The Program Manager candidate meeting the ten-year federal financial systems requirement is identified internally but has not signed a letter of commitment.

**Incumbency cuts both ways.** Five years in, an evaluator looking for change will read incumbency as inertia. The proposal has to lead with what changes in the next period, not with continuity.`,
      },
      {
        heading: 'Capture actions before the solicitation drops',
        body: `| Action | Owner | By |
| --- | --- | --- |
| Approve the GSA MAS contract number correction | N. Shah | Today |
| Request a written Section 508 conformance position from the EXIM COR | S. Connelly | Within 5 days |
| Secure a signed letter of commitment from the PM candidate | N. Shah | Within 10 days |
| Refresh the ELMS past performance citation with release 4.2 outcomes | D. Brennan | Within 10 days |
| Confirm the CMMI re-appraisal record is published before proposal submission | L. Vásquez | Before submission |
| Draft the "what changes in the next period" modernization roadmap | S. Connelly | Within 14 days |`,
      },
      {
        heading: 'Teaming posture',
        body: `Bid as prime. There is no capability gap that requires a partner, and the set-aside means a large-business partner would need a subcontracting arrangement that adds cost without adding evaluation strength.

One exception worth pricing: if the solicitation carries a hard VPAT-at-proposal requirement, a specialist accessibility subcontractor is faster and cheaper than building the conformance report in house inside the response window.`,
      },
      {
        heading: 'Pricing posture',
        body: `Price against the current task order labour mix with the schedule rates, not below them. The set-aside limits the field to WOSB schedule holders, so this is not a price-to-win against a large business cost structure.

Hold the current rates rather than discounting to defend the incumbency. A discount signals the prior period was overpriced, and it sets the baseline for the following five years.`,
      },
      {
        heading: 'Recommendation',
        body: `**Bid.** This is the highest-scoring opportunity in the pipeline at 94, it is the largest single revenue line ILS holds, and losing it is a materially worse outcome than winning any other opportunity on the list.

The one dependency is the schedule contract number. Everything else on this brief is a normal capture task with time to complete it; that one is a live error on a public page, visible to the customer, today.`,
      },
    ],
  },
];

export function captureBriefFor(opportunityId: string): CaptureBrief | undefined {
  return captureBriefs.find((b) => b.opportunityId === opportunityId);
}
