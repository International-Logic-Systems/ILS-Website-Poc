// Single source of truth for site content (simulates the future CMS).
// Copy is drawn from intllogic.com with spelling corrected.

export const org = {
  name: "International Logic Systems, Inc.",
  short: "ILS",
  /**
   * One line for what ILS does. Shown in the footer on every page and read by
   * the site assistant, so it stays in step with the home hero headline rather
   * than drifting into a second, competing description.
   */
  tagline: "Legacy systems, modernized at mission speed.",
  // "CMMI Level 3, ISO-certified" sat the two credentials side by side, which
  // reads as though CMMI were a certification — the conflation ISACA's
  // guidelines exist to prevent. Reordered so "certified" can only attach to
  // ISO, and "appraised" only to CMMI.
  sub: "An ISO-certified government contractor in the Washington, DC area, appraised at CMMI Maturity Level 3. ILS provides integrated services and flexible solutions built on more than 25 years of best practices.",
  /**
   * Home hero only. `sub` stays the company description because /about leads
   * with it; the hero needs to say what we do, not what we are.
   */
  heroLede:
    "ILS helps federal agencies migrate legacy code to secure, cloud-native platforms — using AI-accelerated engineering to cut modernization timelines from years to months, without breaking what already works.",
  /** The four marks a contracting officer checks first. Shown as hero chips. */
  compliance: ["CMMI-DEV / SVC ML3", "ISO 9001:2015", "ISO/IEC 27001:2022", "Section 508"],
  hq: ["International Logic Systems, Inc.", "12150 Monument Drive, Suite #825", "Fairfax, VA 22033"],
  social: {
    twitter: "https://twitter.com/intllogicsystem",
    linkedin: "https://www.linkedin.com/company/international-logic-systems",
  },
  credentials: [
    "CMMI-DEV / CMMI-SVC ML3",
    "ISO 9001:2015",
    "ISO/IEC 27001:2022",
    "25+ YRS PAST PERFORMANCE",
    "WASHINGTON DC METRO",
  ],
};

/**
 * CMMI appraisal, taken from the CMMI Appraisal Mark issued by ISACA.
 *
 * ISACA's announcement guidelines constrain how this may be stated, and the
 * rules are encoded here rather than left to whoever writes the next page:
 *
 *   - say "appraised at" or "rated at"; never awarded, certified, certification,
 *     accredited or accreditation — ISACA neither certifies nor accredits;
 *   - name the organizational unit that was appraised, never the whole company;
 *   - name the Partner organization that performed the appraisal;
 *   - never name ISACA as the appraising organization;
 *   - the Appraisal Mark may only be the supplied PNG, never recoloured,
 *     recreated or enlarged, and must stay visually secondary to the ILS logo.
 *
 * Both required fields are now known: the appraised unit and the Partner
 * organization that performed the appraisal.
 */
export const cmmi = {
  level: "Maturity Level 3",
  levelShort: "ML3",
  models: ["CMMI-DEV", "CMMI-SVC"] as const,
  appraisalNumber: "83914",
  /** ISO date, so "current" is derived rather than asserted. */
  expires: "2029-07-31",
  expiresLabel: "31 July 2029",
  /** Public record customers can check the rating against. */
  parsUrl: "https://cmmiinstitute.com/learning/appraisals/results",
  /**
   * The appraised organizational unit — taken from the filename ISACA issued
   * the marks under. Naming it is required: the guidelines prohibit announcing
   * that the entire organization was appraised.
   */
  unit: "Application Development and Services",
  /**
   * The Partner organization that performed the appraisal. Naming it is
   * required; naming ISACA as the appraiser is prohibited.
   */
  leadAppraiser: "Williamsburg Process Solutions, LLC",
  /**
   * The Appraisal Marks exactly as ISACA supplied them — copied byte for byte,
   * never recoloured, redrawn or re-encoded. Both are 701×254; the guidelines
   * forbid enlarging them and set a 56px floor on height.
   */
  markSrc: "/cmmi/cmmi-appraised-ml3-dev-svc.png",
  markAlt:
    "CMMI Appraised — Maturity Level 3, CMMI-DEV and CMMI-SVC. Appraisal #83914, expires 31 July 2029.",
  /** Same appraisal, capability-level mark. Kept for materials that need it. */
  capabilityMarkSrc: "/cmmi/cmmi-appraised-cl3.png",
};

export type Leader = {
  name: string;
  role: string;
  initials: string;
  /**
   * Full LinkedIn profile URL. While null the card shows a muted, inert
   * LinkedIn mark — paste the real URL here to make it a live link. No other
   * change needed.
   */
  linkedin: string | null;
};

export const leadership: Leader[] = [
  { name: "Nikki Shah", role: "Chief Executive Officer", initials: "NS", linkedin: null },
  { name: "Stephen Connelly", role: "Chief Technology Officer", initials: "SC", linkedin: null },
  { name: "Shirish Bendre", role: "Senior Project Manager", initials: "SB", linkedin: null },
];

export const nav = [
  { href: "/about", label: "About" },
  { href: "/leadership", label: "Leadership" },
  { href: "/capabilities", label: "Capabilities" },
  { href: "/customers", label: "Customers" },
  { href: "/contracts", label: "Contracts" },
  { href: "/careers", label: "Careers" },
  { href: "/news", label: "News" },
  { href: "/intel", label: "Intel" },
  { href: "/contact", label: "Contact" },
];

/**
 * Two-digit section number for a route, taken from its position in `nav`.
 * Page heroes, the side-rail numbering, and the tab order are all derived from
 * this one list, so reordering a tab renumbers the whole site automatically —
 * they cannot drift apart.
 *
 * The home page is not a tab, so it falls through to "00" and its own sections
 * become 00.1, 00.2, … keeping them clear of the numbered pages.
 */
export function secNumber(href: string): string {
  const i = nav.findIndex((n) => n.href === href);
  return String(i + 1).padStart(2, "0");
}

/**
 * Full section label: sec("/about", "ABOUT") -> "SEC 01 / ABOUT".
 * Pass `sub` for a section inside a page -> "SEC 01.1 / CREDENTIALS".
 */
export function sec(href: string, label: string, sub?: number): string {
  const n = secNumber(href);
  return `SEC ${sub ? `${n}.${sub}` : n} / ${label}`;
}

export const missionFeed = [
  "CERT ISO 9001:2015 · QUALITY MANAGEMENT · RECERTIFIED 2024",
  "CERT ISO/IEC 27001:2022 · INFOSEC MANAGEMENT · RECERTIFIED 2024",
  "APPRAISAL CMMI-DEV + CMMI-SVC · MATURITY LEVEL 3",
  "VEHICLE NITAAC CIO-SP3 SMALL BUSINESS",
  "VEHICLE GSA MULTIPLE AWARD SCHEDULE · SIN 54151S",
  "VEHICLE FAA eFAST",
  "CUSTOMER EXPORT-IMPORT BANK OF THE UNITED STATES",
  "CUSTOMER AMTRAK · NATIONAL RAILROAD PASSENGER CORP",
  "CUSTOMER USDA · AMS / FSA / FNS / RMA / NRCS",
  "DELIVERY EXIM LOAN MANAGEMENT SYSTEM · LAUNCHED 2024",
  "DELIVERY AMTRAK SDR · CLOUD MIGRATION",
];

export const solutions = [
  {
    title: "Program & Project Management",
    body: "Agile practitioners and coaches who start from the maturity and tooling you already have, then adopt and scale the practices that fit it. Measured on what actually moves: time to market, requirements that can change without a replan, and stakeholders who can see progress.",
  },
  {
    title: "Operations & Maintenance",
    body: "Keeping what already runs, running. We manage IT infrastructure across government and commercial estates — performance, capacity and networking — against service levels rather than ticket counts, from routine installation through to advanced capability.",
  },
  {
    title: "Security & Accreditation",
    body: "Security for systems where the access, storage and transmission of data is the mission rather than an afterthought. We design, implement and operate the controls — through accreditation and past it, so the system stays authorised instead of passing once.",
  },
  {
    title: "Strategic Planning & Roadmap",
    body: "Every estate needs a route out, and modernization usually stalls for want of one. We align the roadmap to organizational goals and back it with the procedures and practices that keep it moving after the planning phase ends.",
  },
  {
    title: "Customer Relationship Management",
    body: "CRM implementation and support for organizations that are judged on service. We help clients build and manage the relationships they already have, and the ones they are still earning.",
  },
];

export const services = [
  { title: "Artificial Intelligence", tags: "CHATBOTS · NLP · ML", body: "Chatbots, virtual assistants, NLP and machine learning, delivered end to end on IBM, AWS and Azure cloud services." },
  { title: "Cloud Computing", tags: "AWS · AZURE · SALESFORCE", body: "Migration and cloud operations that cut operating cost while improving scalability, efficiency and security — three things that usually trade against each other." },
  { title: "Business Intelligence", tags: "POWER BI · TABLEAU · SAS", body: "Analytics that surface a trend while it still matters — SAS, Power BI, OBIEE, Tableau, SAP BO and Cognos, over data warehousing and ETL with Oracle Exadata and Informatica." },
  { title: "Digital Delivery & UX", tags: "LEAN · AGILE · DEVOPS", body: "Lean discovery, agile delivery and a DevOps mindset: mobile-first responsive design, UI/UX, CMS development and modernization, with the user in the room rather than in the requirements." },
  { title: "Web Services & E-commerce", tags: "JAVA · ESB · MULESOFT", body: "Java, web and e-commerce delivery across the stack: Java, UI, UX, ESB, CMS, SSO, webMethods, C, C++ and MuleSoft." },
  { title: "Database Management", tags: "ORACLE · SQL SERVER · DB2", body: "Business-critical data kept available and current through management, monitoring, upgrades and support: Oracle, SQL Server, MySQL, DB2 and IDMS." },
  { title: "Microsoft Solutions", tags: ".NET · SHAREPOINT · O365", body: "End-to-end delivery in Microsoft technologies — .NET, Visual Studio, SharePoint and Office 365 — at any organizational scale." },
  { title: "Mobile Applications", tags: "iOS · ANDROID", body: "Native iOS and Android development, from a first release through to an estate that has to be maintained." },
  { title: "Business Analysis & QA", tags: "TEST · EVALUATE · DOCUMENT", body: "Business analysis that finds the process worth improving, then test, evaluation and documentation services that show the improvement held." },
  { title: "Architecture Services", tags: "CLOUD · MDM", body: "Cloud architecture and master data management — the structural decisions that determine whether a transformation compounds or has to be redone." },
  { title: "Staff Augmentation", tags: "CONTRACT · C2H · PERMANENT", body: "Contract, contract-to-hire, permanent and temporary staffing — the roles a program needs before the next milestone rather than after it." },
  { title: "Legacy & Mainframe Support", tags: "COBOL · CICS · JCL", body: "COBOL, CICS, VSAM, CLIST, REXX and JCL, plus Access, Delphi, PowerBuilder, ColdFusion and WebLogic: full-scale mainframe integration, operations and maintenance. The estate has to keep running while it is being replaced." },
];

export const customers = [
  { name: "Export-Import Bank of the United States", detail: "Official export credit agency of the U.S. ILS delivered the Loan Management System (ELMS) and provides business intelligence and data-warehouse services.", url: "https://www.exim.gov/" },
  { name: "Amtrak", detail: "National Railroad Passenger Corporation. ILS supported the Safety Data Repository (SDR) cloud migration.", url: "https://www.amtrak.com/" },
  { name: "USDA", detail: "United States Department of Agriculture — AMS, FSA, FNS, RMA, and NRCS.", url: "https://www.usda.gov/" },
];

// Contract vehicles live in lib/vehicles.ts — full detail, transcribed from
// the live site source, with status derived from the period of performance.


// Newest first — the news page and the home "Latest from the ledger" strip
// both read this order directly.
export const news = [
  // Compliant announcement: names the appraised unit rather than the whole
  // company, credits the Partner organization that performed the appraisal,
  // uses "appraised at", and never calls it a certification.
  { date: "AUG 2026", title: "ILS Application Development and Services appraised at CMMI Maturity Level 3", body: "The Application Development and Services unit of International Logic Systems was appraised at Maturity Level 3 against both the CMMI for Development (CMMI-DEV) and CMMI for Services (CMMI-SVC) models. The appraisal was performed by Williamsburg Process Solutions, LLC. Appraisal #83914, valid to 31 July 2029, and verifiable in the Published Appraisal Results directory." },
  { date: "MAY 2026", title: "ILS expands AWS cloud modernization support for EXIM Bank", body: "ILS is expanding its support for the Export-Import Bank of the United States' ongoing AWS cloud modernization initiative. The effort extends cloud migration activities across development, testing, user acceptance, and production environments, and includes application infrastructure, development tools, middleware, testing, production deployment, and legacy environment transition." },
  { date: "SEP 2025", title: "ILS supports EXIM Online modernization initiative", body: "ILS is supporting the modernization of the Export-Import Bank of the United States' EXIM Online (EOL) system. The initiative focuses on transitioning the existing monolithic application toward a microservices-based, containerized architecture and advancing DevSecOps practices to support a more modern and maintainable application environment." },
  { date: "MAY 2025", title: "ILS supports ELMS modernization with CTEP implementation", body: "ILS is supporting the continued modernization of the EXIM Loan Management System (ELMS), including implementation of the China Transformational Export Program (CTEP) review workflow and migration of the Working Capital Guarantee application from a monolithic architecture to a microservices-based architecture." },
  { date: "MAR 2025", title: "ILS supports EXIM Bank's AWS cloud migration", body: "ILS is supporting the Export-Import Bank of the United States' migration of business applications from its on-premises data center to Amazon Web Services (AWS). ILS is providing support for cloud infrastructure and middleware configuration, DevSecOps, testing, documentation, and production migration activities." },
  { date: "AUG 2024", title: "ILS recertified for ISO 9001:2015", body: "ILS has met the ISO 9001:2015 standard for its Quality Management System, which governs software development and service delivery for federal and commercial customers. Certificate issued by BSI Group." },
  { date: "AUG 2024", title: "ILS recertified for ISO/IEC 27001:2022", body: "ILS conforms to the ISO/IEC 27001:2022 standard for Information Security Management, covering strategic planning, program and project management, and software development, implementation, maintenance, and operations. Certificate issued by BSI Group." },
  { date: "JUL 2024", title: "EXIM awards ILS five-year BI & data warehouse contract", body: "The Export-Import Bank of the United States selected ILS for a five-year business intelligence and data warehousing engagement." },
  { date: "MAY 2024", title: "EXIM Loan Management System launches", body: "The ILS-built Loan Management System (ELMS) went live at the Export-Import Bank of the United States." },
  { date: "JUN 2023", title: "ILS appraised at CMMI Maturity Level 3", body: "ILS was appraised at Maturity Level 3 for both CMMI for Development (CMMI-DEV) and Services (CMMI-SVC)." },
  { date: "JUL 2018", title: "Amtrak SDR cloud migration", body: "ILS supported the migration of Amtrak's Safety Data Repository to the cloud." },
];

/**
 * Deep link to the iCIMS job search results, not the portal landing page, so
 * "Search open positions" lands on the openings themselves. Listings are
 * maintained in the applicant tracking system — nothing about them is
 * duplicated here, which is why there is no role list to go stale.
 */
export const careersPortal = "https://careers-intllogic.icims.com/jobs/search?ss=1";

/** Transcribed from careers.html on the live site. */
export const benefits = [
  {
    title: "Compensation",
    icon: "compensation",
    body: "Competitive pay to employees from all experience levels.",
  },
  {
    title: "Time off",
    icon: "timeoff",
    body: "Annual time off and paid holidays to balance work and personal life.",
  },
  {
    title: "Medical",
    icon: "medical",
    body: "Affordable health, dental, life and AD&D, and short and long-term disability insurances.",
  },
  {
    title: "Retirement",
    icon: "retirement",
    body: "401(k) plan with company match for eligible employees.",
  },
  {
    title: "Educational Assistance",
    icon: "education",
    body: "Tuition reimbursement for work-related education.",
  },
  {
    title: "Employee Referral Program",
    icon: "referral",
    body: "Incentive for each successful, referred new hire.",
  },
] as const;
