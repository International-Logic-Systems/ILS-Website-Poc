/**
 * Domain types for the admin dashboard demo.
 *
 * Two tiers, one rule: Tier 1 content publishes on click, Tier 2 records —
 * the ones a contracting officer might rely on — can only change through a
 * second approver. Anything a CO could quote back at ILS lives in Tier 2.
 */

/* ---------------------------------------------------------------- people */

export type UserId = string;

export type User = {
  id: UserId;
  name: string;
  /** Short form used in audit lines and diff headers. */
  shortName: string;
  role: string;
  email: string;
  /** Only approvers may decide a Tier 2 change request. */
  canApprove: boolean;
  initials: string;
};

/* --------------------------------------------------- tier 1: fast content */

export type ContentKind = 'news' | 'job' | 'event';
export type ContentStatus = 'draft' | 'published';

type ContentBase = {
  id: string;
  kind: ContentKind;
  title: string;
  slug: string;
  /** One-line teaser for the list view and the public index card. */
  summary: string;
  /** Markdown. The editor renders a live preview beside it. */
  body: string;
  tags: string[];
  status: ContentStatus;
  authorId: UserId;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type NewsPost = ContentBase & { kind: 'news' };

export type JobOpening = ContentBase & {
  kind: 'job';
  /** Mirrors the public careers listing: every role states its clearance. */
  programme: string;
  location: string;
  clearance: 'Secret' | 'Public Trust' | 'None required';
  employmentType: string;
};

export type EventNotice = ContentBase & {
  kind: 'event';
  eventStart: string;
  venue: string;
  city: string;
  /** Empty when there is nothing to register for. */
  registrationLabel: string;
};

export type ContentItem = NewsPost | JobOpening | EventNotice;

/* ----------------------------------------- tier 2: second-approval records */

export type RecordKind =
  | 'vehicle'
  | 'certification'
  | 'designation'
  | 'reference'
  | 'bio';

/** How a field renders in the form, the detail view and the diff. */
export type FieldType = 'text' | 'code' | 'date' | 'textarea' | 'markdown';

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  /** Shown under the input on the change form. */
  help?: string;
};

export type RecordTypeDef = {
  kind: RecordKind;
  /** Plural, for nav and list headings. */
  label: string;
  singular: string;
  /** Why this record type is gated. Printed on the change form and the confirm dialog. */
  exposure: string;
  fields: FieldDef[];
};

/**
 * A Tier 2 record. `values` is always the *live* value — the one the public
 * site renders. A pending change never touches it; it sits alongside in
 * {@link ChangeRequest.proposed} until a second approver applies it.
 */
export type GovRecord = {
  id: string;
  kind: RecordKind;
  /** Display name in lists and in the approvals queue. */
  name: string;
  values: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  lastApprovedBy: UserId | null;
  lastApprovedAt: string | null;
};

export type ChangeStatus = 'pending' | 'approved' | 'rejected';

export type ChangeRequest = {
  id: string;
  recordId: string;
  recordKind: RecordKind;
  /** Denormalised, so the queue still reads correctly for records that do not exist yet. */
  recordName: string;
  /** True when approving this request creates the record for the first time. */
  isNew: boolean;
  /**
   * The live values at the moment the change was proposed.
   *
   * Needed because approving a request overwrites the record: without a
   * snapshot, a decided request has no way to show what the value used to be,
   * and an audit trail that cannot answer "what did it say before" is not one.
   * Null when {@link isNew} — there was nothing there.
   */
  previous: Record<string, string> | null;
  /** Full proposed value set. The diff is computed field by field against `previous`. */
  proposed: Record<string, string>;
  proposedBy: UserId;
  proposedAt: string;
  /** The editor's note to the approver — why this change, and what it is based on. */
  rationale: string;
  /** The concrete consequence of getting this wrong. Printed in the confirm dialog. */
  exposure: string;
  status: ChangeStatus;
  decidedBy: UserId | null;
  decidedAt: string | null;
  /** Required on reject, optional on approve. */
  decisionComment: string | null;
};

/* -------------------------------------------------------------- audit log */

export type AuditAction =
  | 'created'
  | 'published'
  | 'unpublished'
  | 'proposed'
  | 'approved'
  | 'rejected'
  | 'synced'
  | 'rescored'
  | 'reset';

export type AuditEvent = {
  id: string;
  at: string;
  actorId: UserId;
  action: AuditAction;
  /** Set for Tier 2 events so a record's own trail can be derived from the log. */
  recordId: string | null;
  recordKind: RecordKind | null;
  changeRequestId: string | null;
  /** One line, past tense, no trailing full stop. */
  summary: string;
  /** Optional second line — the reject comment, the fields touched. */
  detail: string | null;
};

/* ------------------------------------------ sam.gov / usaspending mirrors */

export type RegistrationStatus = 'Active' | 'Expiring' | 'Expired' | 'Submitted';

export type NaicsCode = {
  code: string;
  title: string;
  isPrimary: boolean;
  /** SBA size standard for the code, as SAM.gov prints it. */
  sizeStandard: string;
  isSmall: boolean;
};

/** Mirrors the SAM.gov Entity Management record for one entity. */
export type EntityRegistration = {
  legalBusinessName: string;
  dbaName: string;
  uei: string;
  cageCode: string;
  physicalAddress: string;
  registrationStatus: RegistrationStatus;
  /** SAM.gov calls this the Expiration Date; it is the annual renewal deadline. */
  expirationDate: string;
  activationDate: string;
  initialRegistrationDate: string;
  lastUpdatedDate: string;
  purposeOfRegistration: string;
  naics: NaicsCode[];
  pscCodes: { code: string; title: string }[];
  /** From the Federal Awardee Performance and Integrity Information System. */
  exclusionStatus: string;
  repsAndCertsCompleteThrough: string;
  entityStructure: string;
  stateOfIncorporation: string;
};

export type AwardStatus = 'Active' | 'Expiring' | 'Winding down' | 'Complete';

/** One row of the awarded-contract table, shaped like a USAspending award. */
export type Award = {
  id: string;
  /** Vehicle or programme name, as ILS publishes it. */
  vehicle: string;
  /** Procurement Instrument Identifier. */
  piid: string;
  /** Parent award for task orders; null for the vehicle itself. */
  parentPiid: string | null;
  agency: string;
  subAgency: string;
  awardType: string;
  startDate: string;
  endDate: string;
  status: AwardStatus;
  obligated: string;
  ceiling: string;
  setAside: string;
  naics: string;
  /**
   * `usaspending` rows would refresh from the API. `customer` rows are
   * non-appropriated buyers that never appear there and stay hand-maintained.
   */
  source: 'usaspending' | 'customer';
};

export type SyncResult = {
  syncedAt: string;
  entity: EntityRegistration;
  awards: Award[];
};

/* ---------------------------------------------------- opportunity scorer */

export type SetAside =
  | 'Woman-Owned Small Business (WOSB)'
  | 'Total Small Business'
  | '8(a) Competitive'
  | 'Service-Disabled Veteran-Owned Small Business'
  | 'Full and Open';

export type NoticeType =
  | 'Solicitation'
  | 'Combined Synopsis/Solicitation'
  | 'Sources Sought'
  | 'Presolicitation'
  | 'Request for Information';

export type RequirementState = 'met' | 'partial' | 'gap';

export type Requirement = {
  label: string;
  state: RequirementState;
  /** How ILS meets it, or precisely what is missing. */
  note: string;
};

export type Opportunity = {
  id: string;
  /** SAM.gov notice ID, as printed on the notice page. */
  noticeId: string;
  solicitationNumber: string;
  title: string;
  agency: string;
  subAgency: string;
  noticeType: NoticeType;
  naics: string;
  naicsTitle: string;
  setAside: SetAside;
  postedDate: string;
  responseDeadline: string;
  placeOfPerformance: string;
  estimatedValue: string;
  /** Vehicle the work would be ordered through, or how it is competed. */
  route: string;
  summary: string;
  /** 0–100. Precomputed in fixtures; a rescore may overwrite it. */
  fitScore: number;
  /** Two to three sentences, referencing ILS's actual profile. */
  rationale: string;
  requirements: Requirement[];
  /** Set once a rescore has run in this session. */
  rescoredAt?: string;
  rescoredBy?: 'anthropic' | 'simulated';
};

export type CaptureBriefSection = {
  heading: string;
  /** Markdown body. */
  body: string;
};

export type CaptureBrief = {
  opportunityId: string;
  preparedAt: string;
  preparedBy: UserId;
  bidRecommendation: string;
  confidence: string;
  sections: CaptureBriefSection[];
};
