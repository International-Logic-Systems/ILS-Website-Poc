/**
 * Contract vehicles.
 *
 * Every field is transcribed from the live ILS site source at
 * `OneDrive_2026-08-26/Master - Updated 2025 02 04/contracts.html` — contract
 * numbers, periods of performance, task areas, SINs and points of contact.
 * Spelling is corrected and the Windows-1252 punctuation repaired. Periods of
 * performance and the eFAST KSN point of contact were subsequently updated from
 * a team briefing (2026-09-01) and now differ from that file, which is stale.
 *
 * The five CIO-SP3 documents are the ones the old site linked publicly from
 * that page. The executed Mod 1 sits in the same source folder but was *not*
 * linked, so it is deliberately not republished here.
 */

export type VehicleStatus = "awarded" | "active" | "expiring" | "expired";

export type Poc = {
  name: string;
  role: string;
  email: string;
  phone: string;
  fax?: string;
};

export type Vehicle = {
  slug: string;
  /** Short label for tiles and the home strip. */
  short: string;
  /** Name as the awarding agency writes it. */
  name: string;
  fullName: string;
  agency: string;
  number: string;
  /** ISO dates, so status is derived rather than transcribed. */
  start: string;
  end: string;
  /** One or two lines for the tile. */
  summary: string;
  overview: string[];
  scope?: { label: string; items: string[] };
  sins?: { code: string; title: string; body: string; note?: string }[];
  terms?: { label: string; value: string }[];
  documents?: { label: string; href: string; size: string }[];
  pocs: Poc[];
  external?: { label: string; href: string };
};

/**
 * The single published point of contact for every vehicle. Held as one record
 * rather than repeated per vehicle so a change of number or title cannot land
 * on one contract page and be missed on another.
 */
const BD_PROGRAM_MANAGER: Poc = {
  name: "Nikki Shah",
  role: "Business Development Program Manager",
  email: "Nikki.Shah@Intllogic.com",
  phone: "(571) 243-8347",
};

export const vehicles: Vehicle[] = [
  {
    slug: "cio-sp3",
    short: "CIO-SP3 SB",
    name: "NITAAC CIO-SP3 Small Business",
    fullName: "Chief Information Officer — Solutions and Partners 3 (CIO-SP3) Small Business",
    agency: "NIH Information Technology Acquisition and Assessment Center",
    number: "75N98120D00167",
    start: "2020-05-11",
    end: "2026-12-31",
    summary:
      "A Best in Class GWAC for emerging technology solutions and services, including health and biomedical-related IT.",
    overview: [
      "The Chief Information Officer — Solutions and Partners 3 (CIO-SP3) Small Business Government-Wide Acquisition Contract (GWAC) is a ten-year Indefinite Delivery/Indefinite Quantity (IDIQ) contract. It provides information technology solutions and services as defined in FAR 2.101(b) and further clarified in the Clinger-Cohen Act of 1996.",
      "Those solutions and services include, but are not limited to, health and biomedical-related IT services meeting scientific, health, administrative, operational, managerial, and information management requirements.",
    ],
    scope: {
      label: "Scope of work",
      items: [
        "Task Area 1 — IT Services for Biomedical Research, Health Sciences, and Healthcare",
        "Task Area 2 — Chief Information Officer (CIO) Support",
        "Task Area 5 — IT Operations and Maintenance",
        "Task Area 6 — Integration Services",
        "Task Area 7 — Critical Infrastructure Protection and Information Assurance",
        "Task Area 8 — Digital Government",
        "Task Area 10 — Software Development",
      ],
    },
    terms: [{ label: "Prompt payment terms", value: "0.75% 10, Net 30" }],
    documents: [
      { label: "Standard Form 26", href: "/contracts/cio-sp3/sf-26.pdf", size: "1.6 MB" },
      { label: "Standard Form 30", href: "/contracts/cio-sp3/sf-30.pdf", size: "195 KB" },
      {
        label: "Conformed Contract",
        href: "/contracts/cio-sp3/conformed-contract.pdf",
        size: "1.1 MB",
      },
      {
        label: "Government Site Hourly Rate",
        href: "/contracts/cio-sp3/government-site-hourly-rate.pdf",
        size: "123 KB",
      },
      {
        label: "Contractor Site Hourly Rate",
        href: "/contracts/cio-sp3/contractor-site-hourly-rate.pdf",
        size: "123 KB",
      },
    ],
    pocs: [BD_PROGRAM_MANAGER],
    external: {
      label: "NITAAC CIO-SP3 Small Business",
      href: "https://nitaac.nih.gov/services/cio-sp3-small-business",
    },
  },
  {
    slug: "gsa-mas",
    short: "GSA MAS",
    name: "GSA Multiple Award Schedule",
    fullName: "GSA Multiple Award Schedule — IT 70",
    agency: "U.S. General Services Administration",
    number: "GS-35F-397DA",
    start: "2026-07-07",
    end: "2027-07-06",
    summary:
      "The most common purchasing vehicle for selling IT products and services to the federal government.",
    overview: [
      "The Multiple Award Schedule (MAS) for IT Professional Services is a long-term, government-wide Indefinite Delivery/Indefinite Quantity (ID/IQ) contract offering IT solutions to federal, state, and local government mission needs at fair and reasonable pricing.",
      "Ordering agencies may purchase services from the SINs listed in the ILS price catalog on a firm-fixed-price or labor-hour delivery/task order basis.",
    ],
    sins: [
      {
        code: "SIN 54151S",
        title: "Information Technology Professional Services",
        body: "IT professional services and labor categories including conversion and implementation support; database planning and design; Internet of Things (IoT); IT project management; migration services of all kinds; network services; programming; resources and facilities management; and systems analysis, design, and implementation.",
        note: "Subject to Cooperative Purchasing.",
      },
      {
        code: "SIN OLM",
        title: "Order-Level Materials",
        body: "OLMs are supplies and services acquired in direct support of an individual task or delivery order placed against a Schedule contract or BPA. Pricing is established at the order level rather than the contract level, so the ordering contracting officer makes the fair and reasonable price determination.",
        note: "Ancillary supplies and services not known at the time of Schedule award may be included and priced at the order level.",
      },
    ],
    pocs: [BD_PROGRAM_MANAGER],
  },
  {
    slug: "efast",
    short: "eFAST",
    name: "FAA eFAST",
    fullName: "Electronic FAA Accelerated and Simplified Tasks (eFAST)",
    agency: "Federal Aviation Administration",
    number: "693KA9-18-A-00102",
    start: "2018-01-23",
    end: "2029-09-30",
    summary:
      "The FAA's preferred small-business contracting vehicle for professional and support services.",
    overview: [
      "eFAST streamlines the procurement process for all stakeholders through a web-based acquisition tool and automated workflows compliant with applicable FAA standards.",
      "The vehicle covers a broad range of comprehensive professional and support services and allows long-term procurements across that range.",
    ],
    scope: {
      label: "Awarded functional areas",
      items: [
        "Business Administration and Management",
        "Computer/Information Systems Development",
        "Computer Systems Support",
        "Documentation and Training",
        "Engineering Services",
      ],
    },
    pocs: [
      {
        ...BD_PROGRAM_MANAGER,
        role: "KSN Point of Contact — Business Development Program Manager",
      },
    ],
  },
];

/** A vehicle within this many days of its end date reads as expiring, not active. */
const EXPIRING_WINDOW_DAYS = 180;

const DAY = 86_400_000;

/**
 * Status is derived from the period of performance rather than stored, so a
 * vehicle cannot sit on the site marked "active" after it has lapsed. Pages
 * that render it revalidate daily.
 */
export function statusOf(v: Vehicle, now: Date = new Date()): VehicleStatus {
  // A period that has not begun must not read as "Active" just because its end
  // date is in the future — the vehicle cannot be ordered from yet.
  if (new Date(`${v.start}T00:00:00Z`).getTime() > now.getTime()) return "awarded";

  const end = new Date(`${v.end}T23:59:59Z`).getTime();
  const days = (end - now.getTime()) / DAY;
  if (days < 0) return "expired";
  if (days <= EXPIRING_WINDOW_DAYS) return "expiring";
  return "active";
}

export const STATUS_LABEL: Record<VehicleStatus, string> = {
  awarded: "Not yet started",
  active: "Active",
  expiring: "Expiring soon",
  expired: "Expired",
};

export function vehicleBySlug(slug: string): Vehicle | undefined {
  return vehicles.find((v) => v.slug === slug);
}

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

export function formatDate(iso: string): string {
  return DATE_FMT.format(new Date(`${iso}T00:00:00Z`));
}

export function periodOf(v: Vehicle): string {
  return `${formatDate(v.start)} — ${formatDate(v.end)}`;
}
