/**
 * The ILS capability profile the scorer scores against.
 *
 * Hard-coded rather than derived from the store on purpose: an opportunity
 * score has to be reproducible, and a profile that shifts every time someone
 * approves a change request produces scores nobody can explain.
 *
 * `ILS_PROFILE_PROMPT` is what the rescore route handler sends to the model.
 * It is kept as prose because that is what the model reads best, and because a
 * human being able to read the exact text that produced a score matters more
 * here than avoiding the duplication with the fixtures.
 */

export const ilsProfile = {
  legalName: 'International Logic Systems, Inc.',
  founded: 1998,
  headquarters: 'Fairfax, Virginia',
  uei: 'K9TFMDLQ3XB7',
  cage: '4HRJ8',
  primaryNaics: '541512',
  naics: ['541511', '541512', '541513', '541519', '541618', '518210'],
  setAsides: ['Woman-Owned Small Business (WOSB)', 'Small business'],
  notEligibleFor: [
    '8(a) Business Development Program',
    'Service-Disabled Veteran-Owned Small Business',
    'HUBZone',
  ],
  vehicles: [
    'FAA eFAST Master Ordering Agreement (693KA9-18-A-00102)',
    'GSA Multiple Award Schedule, SINs 54151S and 54151HACS (47QTCA22D008N)',
    'NITAAC CIO-SP3 Small Business (75N98120D00167) — winding down',
  ],
  certifications: [
    'CMMI-DEV/SVC Maturity Level 3',
    'ISO 9001:2015',
    'ISO/IEC 27001:2022',
  ],
  capabilities: [
    'Application modernization — service-based rebuilds with staged cutover',
    'Cyber security — ATO support, RMF control assessment, continuous monitoring',
    'Cloud engineering — FedRAMP-authorised environments',
    'Legacy migration — mainframe and COBOL-era systems, data lineage preserved',
    'Data and analytics — warehousing, reporting, governance',
    'Software development and DevSecOps — CMMI ML 3 process, scanned pipelines',
    'IT operations and service desk — Tier 1 to 3, ITIL-aligned',
  ],
  customers: [
    'EXIM Bank — Loan Management System, incumbent',
    'USDA Farm Production and Conservation — cloud migration, incumbent',
    'FAA — IT service management support, incumbent',
    'US Army — RMF assessment and continuous monitoring, incumbent',
    'Amtrak — operational reporting sustainment, incumbent',
    'USPS — logistics application sustainment, incumbent',
    'Department of the Interior — records migration, completed 2025',
    'GSA — acquisition programme reporting, completed',
  ],
  clearancePosture:
    'Public Trust across federal delivery staff. One Secret-cleared ISSO on staff with a second role open. No facility clearance (FCL).',
  footprint:
    'Virginia (HQ), Maryland, Washington DC, Delaware, New Jersey, New York, Pennsylvania, North Carolina, Colorado, California, Kansas, Missouri',
} as const;

/** The system prompt sent with a rescore request. */
export const ILS_PROFILE_PROMPT = `You are scoring federal contracting opportunities for fit against one specific company. Score honestly — a scorer that rates everything highly is useless to a capture team.

COMPANY PROFILE — International Logic Systems, Inc. (ILS)

Founded 1998, headquartered in Fairfax, Virginia. UEI ${ilsProfile.uei}, CAGE ${ilsProfile.cage}.

Socio-economic status: SBA-certified Woman-Owned Small Business. Small under all registered NAICS codes.
NOT eligible for: ${ilsProfile.notEligibleFor.join('; ')}. Treat a set-aside ILS does not hold as a hard exclusion that caps the score below 45 no matter how strong the technical fit is.

NAICS: primary ${ilsProfile.primaryNaics} (Computer Systems Design Services). Also registered under ${ilsProfile.naics.filter((n) => n !== ilsProfile.primaryNaics).join(', ')}.

Contract vehicles held:
${ilsProfile.vehicles.map((v) => `- ${v}`).join('\n')}
An opportunity ordered exclusively through a vehicle ILS does not hold is capped below 50, prime-subcontractor routes notwithstanding.

Certifications: ${ilsProfile.certifications.join('; ')}.

Capabilities:
${ilsProfile.capabilities.map((c) => `- ${c}`).join('\n')}

Past performance and current customers:
${ilsProfile.customers.map((c) => `- ${c}`).join('\n')}

Clearance posture: ${ilsProfile.clearancePosture}
Delivery footprint: ${ilsProfile.footprint}

SCORING GUIDANCE
90-100  Incumbent or near-incumbent, set-aside and vehicle both held, no material gap.
75-89   Strong technical and eligibility fit, one or two addressable gaps.
60-74   Credible bid with real gaps — missing same-agency past performance, a domain ILS has not delivered in, or a thin clearance position.
45-59   Bid only with a partner, or a competition where ILS's socio-economic status carries no weight.
Below 45  Hard exclusion: a set-aside ILS does not hold, or a vehicle it cannot order through.

Weight in this order: eligibility gates first (set-aside, vehicle, clearance), then NAICS and past-performance match, then technical capability, then geography and response time.`;
