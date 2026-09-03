# ILS website

The International Logic Systems website, plus an internal admin dashboard for
publishing to it. Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4.

Two applications in one codebase, as separate route groups with their own root
layouts and design systems:

| | | |
|---|---|---|
| **Public site** | `app/(site)` | 10 pages plus a detail page per contract vehicle — 13 URLs. Warm paper ground, forest header and hero, green accent. |
| **Admin** | `app/(admin)` | Behind a sign-in at `/admin`. Its own light theme. |

Typefaces ship from npm (`@fontsource/*`), so neither the build nor the runtime
needs network access for fonts.

## Run it

```bash
npm install
npm run dev            # http://localhost:3000
```

Production build. `build` also regenerates the assistant's search index, which
reads the rendered pages, so it must run after `next build` — the `build` script
already chains them:

```bash
npm run build
npm start
```

```bash
npm run typecheck      # tsc --noEmit
npm test               # node --test (57 tests)
npm run knowledge      # rebuild the assistant index only
```

Node 20.9 or newer.

## This is not a static site

It needs a running Node server. `output: export` fails — 14 routes are rendered
per request (7 API routes, 7 admin pages), plus middleware and scheduled
revalidation. A static export would drop the admin, publishing, the contact
form, the assistant and the live job listings.

Two routes also **write to disk** at runtime — `/api/admin/publish` and
`/api/admin/settings`. On a serverless host the filesystem is read-only and
ephemeral, so publishing would fail or silently vanish. Either deploy to a
long-lived Node host with a persistent volume, or move those two writes to a
datastore first.

## Database

Postgres holds staff accounts and news articles. It is optional — everything
degrades without it — but it is how the site is meant to run.

```bash
npm run db:up                                   # Postgres 17 in Docker
npm run db:migrate                              # apply db/migrations/*.sql
ADMIN_SEED_PASSWORD="ChangeMe-Now-2026" npm run db:seed   # first account
npm run db:status                               # migrations + row counts
npm run db:down                                 # stop (data is kept)
```

Add `DATABASE_URL` to `.env.local` (the value is in `.env.example`).

**Accounts are invite-only.** There is no sign-up page anywhere in the
application: `db:seed` creates the first administrator, and every account after
that is created by a signed-in admin from Settings → Staff accounts. `invited_by`
records who created each one. Passwords are per-user salted **scrypt**
(`lib/admin/password.ts`) — the previous scheme was an unsalted SHA-256, which is
both saltless and fast enough to brute-force.

Migrations are plain SQL applied in filename order and recorded in
`schema_migrations`, so re-running is safe. No ORM: the schema is small and SQL
is what a reviewer can read.

## How content reaches the site

```
lib/content.ts ─┐
lib/vehicles.ts ─┼─► pages render                    (edited in code)
                 │
Postgres ────────┴─► /news and the home page         (falls back to ↓)
server/published.json                                (falls back to ↓)
lib/content.ts seed list
```

Most copy is typed data in `lib/`, edited by a developer. News is different: it
comes from Postgres, with the admin-written JSON file and then the compiled seed
list as fallbacks — so a database outage degrades to the last published file
rather than an empty page, and a fresh clone still renders. Only rows with
`status = 'published'` ever reach the public site.

## Subsystems worth knowing about

**Site assistant** (`lib/chat/retrieval.ts`, `/api/chat`) — BM25 over
`server/knowledge.json`, built by `scripts/build-knowledge.mjs` from the typed
content modules *and* the rendered HTML. Retrieval only, no model: answers are
assembled from site text verbatim and cite the page they came from, so the
assistant cannot state something the site does not. Rebuilt at build time, so
newly published news is not quotable until the next build.

**Contract vehicles** (`lib/vehicles.ts`) — status is *derived* from each period
of performance (`statusOf`), never stored. A lapsed vehicle cannot sit on the
site marked Active. Pages revalidate daily.

**Open positions** (`lib/careers-feed.ts`) — read hourly from the iCIMS portal's
server-rendered listing. On failure it serves the last good read rather than
blanking the page; on a successful but empty response it shows none, because a
closed role left on the page is a false claim. Never invents a listing.

**Contact form** (`/api/contact`) — SMTP via nodemailer, `Reply-To` set to the
enquirer. Fails closed: with no SMTP credentials it tells the visitor to email
`inquiries@intllogic.com` directly rather than pretending to have sent.

**Analytics** — Google Tag Manager and GA4, both **managed from the admin**
(Settings → Analytics) rather than environment variables, so a non-developer can
change the container without a rebuild. Setting both suppresses the direct GA tag
and says why, because running both double-counts every visit. Never loaded on the
admin.

**CMMI appraisal** (`lib/content.ts`, `cmmi`) — ISACA's announcement rules are
documented above the data and enforced in the copy: "appraised at", never
"certified"; the appraised unit named rather than the whole company; the Partner
organization credited; the Appraisal Mark used only as supplied.

## Configuration

Copy `.env.example` to `.env.local`. Nothing is required to run the site; each
group degrades to a documented fallback.

| | |
|---|---|
| `ADMIN_SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_SHA256` | Admin sign-in. **Fails closed** — unset means nobody gets in. |
| `SMTP_HOST` / `PORT` / `USER` / `PASS`, `INQUIRY_TO` | Contact form delivery. |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for `sitemap.xml` and `robots.txt`. |
| `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_GA_ID` | Fallback only; the admin takes precedence. |
| `ANTHROPIC_API_KEY` | Optional, for the admin's opportunity rescoring. |

`server/*.json` is runtime state, not source, and is git-ignored:
`published.json` (published news), `settings.json` (analytics), `knowledge.json`
(assistant index, rebuilt by the build).

## Known gaps

- **Admin working state lives in the browser.** Published content is on disk and
  safe; unpublished drafts do not survive a refresh. The largest remaining piece
  of work before real users depend on the dashboard.
- **No Content-Security-Policy.** Deliberate: it belongs with consent handling,
  once the GTM tag inventory is settled. Other security headers are set in
  `next.config.mjs`.
- **No consent handling.** Analytics fires on first load. Fine for a US federal
  audience; EU or UK traffic needs Consent Mode v2.
- **Job listings parse iCIMS HTML.** An iCIMS redesign breaks parsing. Fails
  safe rather than showing wrong data.
- **Rate limits are per instance** (contact form, in memory).

## Repository notes

`HANDOFF.md` is a deeper working document, written before the site was rebuilt
in its current design — treat this README as authoritative where the two
disagree.
