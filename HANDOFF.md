# ILS Website — Project Handoff

Working notes for picking this up in a fresh session. Written 2026-08-28.

**Location:** `C:\Users\Yash Shah\Documents\ils-poc\ils-poc`
*(note the nested folder — the outer `ils-poc` contains only this)*

---

## 1. What this is

A proof-of-concept website for **International Logic Systems, Inc.** (ILS) — a
woman-owned small business, CMMI Level 3, ISO 9001/27001 certified federal IT
contractor in Fairfax, VA. Customers: EXIM Bank, Amtrak, USDA.

It began as a dark "Palantir-style" rebuild of intllogic.com and has grown into
a near-complete site with a live federal market-intel feed, a retrieval-backed
assistant, and an authenticated admin dashboard.

**~15,600 lines** across app / components / lib / scripts / test.

---

## 2. Stack

| | |
|---|---|
| Framework | Next.js **15.5.23**, App Router |
| UI | React 19.2.8, TypeScript 5.9.3 (strict) |
| Styling | Tailwind CSS **v4** — no config file; theme lives in `@theme` inside `app/(site)/globals.css` |
| Admin UI | Radix (dialog, slot), lucide-react, CVA, clsx, tailwind-merge, **zustand** |
| AI | `@anthropic-ai/sdk` |
| Fonts | npm-vendored (`@fontsource/*`) — **no network at build or runtime** |
| Node | v22.22.0 |

### Scripts

```bash
npm run dev         # dev server
npm run build       # next build && npm run knowledge   <- both steps matter
npm start           # production server on :3000
npm run knowledge   # rebuild the RAG corpus
npm test            # node --test  (63 tests)
npm run typecheck   # tsc --noEmit
```

**`build` must run `knowledge` too.** The corpus is derived from the freshly
prerendered HTML in `.next/server/app/`. This was originally missing and the
assistant spent several turns quoting page sections that had been deleted.

---

## 3. Current state

Build clean · typecheck clean · **63/63 tests passing** · all routes 200.

### Public routes (dark navy theme)

```
/  /about  /leadership  /capabilities  /customers
/contracts  /contracts/[vehicle]        (efast, gsa-mas, cio-sp3)
/careers  /careers/opportunities  /careers/benefits  /careers/our-culture
/news  /intel  /contact
/accessibility  /privacy  /terms
```

### Admin (authenticated, light content + navy sidebar)

```
/admin  /admin/approvals  /admin/content
/admin/contracts  /admin/opportunities  /admin/settings
/admin/login   (public, no chrome)
```

### API

```
POST /api/chat           streams the assistant
POST /api/rescore        opportunity scoring (simulates without a key)
POST /api/admin/login    issues session cookie
POST /api/admin/logout   clears it
```

---

## 4. Design system

Current theme came from a design the user supplied — **midnight navy + phosphor
green + modern blue + clearance gold**:

```css
--color-ink:    #0a1626   /* navy base    */
--color-panel:  #0e1d33   /* panels       */
--color-line:   #1d3a5f   /* hairlines    */
--color-fg:     #e9eef5
--color-mute:   #8fa3bc
--color-gold:   #e3b34c   /* primary CTA  */
--color-legacy: #3fd97f   /* legacy code  */
--color-modern: #4da6ff   /* modern side  */
```

**Key mechanic:** every Tailwind v4 utility compiles to `var(--color-*)`. So
re-skinning is done by *redefining tokens*, not editing components. That is how
the entire site was retheme d several times in one edit each. Remember this —
it makes large visual changes cheap.

The homepage hero is `components/ModernizationPipeline.tsx`: COBOL/JCL lines
migrating across a pulsing seam into modern service modules. Pure CSS keyframes,
no canvas, no video.

Section numbering (`SEC 01 / ABOUT`) is **derived** from the `nav` array via
`sec()` / `secNumber()` in `lib/content.ts` — reorder a tab and every label
renumbers itself. Home page sections are `00.1`–`00.5`.

---

## 5. Notable subsystems

### Market Intel (`/intel`)

The only non-static route — **ISR, 1h revalidate**. Live federal data:

- **USAspending.gov** — recent IT awards (NAICS 541511/512/513/519, `date_signed`
  in the last 60 days). No API key.
- **Federal Register** — notices from ILS-relevant agencies. No API key.
- **SAM.gov** — open solicitations. **Requires `SAM_API_KEY`**; without it the
  panel falls back to keyless Grants.gov data and says so.

Every fetcher in `lib/feeds.ts` is fail-soft: 12s timeout, try/catch, returns
`{items: [], error}`. A government API having a bad morning must not break
`next build`.

### The assistant (ILS Agent)

Two-layer answering in `lib/chat/`:

1. **Curated** — `server/demo-answers.json`, 10 topics, loaded once into memory.
2. **BM25 retrieval** — `server/knowledge.json`, 76 chunks / 22 paths, built by
   `scripts/build-knowledge.mjs` from `knowledge/*.md` + the prerendered pages.
3. **Declines** when neither clears the bar.

Works **with no API key** (`x-chat-mode: demo-retrieval`, panel reads
"RAG · RETRIEVAL ONLY"). Adding `ANTHROPIC_API_KEY` switches the same pipeline
to Claude and relabels itself. Session transcripts live in
`lib/chat/sessions.ts` — in-memory, LRU-capped 200 sessions / 40 turns / 2h TTL.

### Admin

Ported from a parallel build at
`C:\Users\Yash Shah\Documents\ILS_Website_Mulu_Version\ILS-website`.

Its best idea is a **two-tier governance model**, enforced in the store rather
than the components:

- **Tier 1** (news, jobs, events) — publishes on click.
- **Tier 2** (vehicles, certifications, designations, references, bios) — cannot
  change without a second approver. Change requests snapshot previous values so
  the audit trail can answer "what did it say before".

**Important:** the admin has **no persistence**. It reads seed fixtures into a
zustand store; a refresh resets it. Nothing an admin does reaches the public
site, which renders hardcoded TS from `lib/*.ts`. Closing that gap is the real
next project.

### Auth

`middleware.ts` gates `/admin/:path*`. HMAC-signed stateless session cookie
(Web Crypto — `node:crypto` is unavailable in Edge middleware), 8h TTL,
httpOnly / SameSite=Lax / Secure in prod. **Fails closed** when unconfigured.
Login is rate-limited (8 attempts / 10 min / IP) and returns an identical
message for bad username and bad password — no account enumeration.

---

## 6. Environment variables

`.env.example` documents all of these. `.env.local` currently holds working
local values.

```bash
# Admin sign-in — REQUIRED, or nobody can reach /admin
ADMIN_SESSION_SECRET=      # openssl rand -base64 32
ADMIN_USERNAME=admin
ADMIN_PASSWORD_SHA256=     # node -e "console.log(require('crypto').createHash('sha256').update('PW').digest('hex'))"
# ADMIN_PASSWORD=          # plaintext fallback, local only

ANTHROPIC_API_KEY=         # optional — assistant runs in demo mode without it
ANTHROPIC_MODEL=           # optional
SAM_API_KEY=               # optional — /intel solicitations panel
SAM_API_BASE=              # optional — point at a local mock
```

> ⚠️ **Admin credentials are not recorded here.** They live only in
> `.env.local` (`ADMIN_USERNAME`, `ADMIN_PASSWORD_SHA256`), which is
> git-ignored. The demo password that used to be printed here must be rotated
> before any tunnel or deployment.

---

## 7. Deliberately unresolved

These are **not bugs**. The site states plainly what it does not know, using a
`known()` / `pending()` provenance type rendered as muted italics.

| Item | Count | Where |
|---|---|---|
| Vehicle facts unconfirmed | 3 | GSA MAS period of performance + SINs |
| Benefit figures | 4 | `[%]`, `[days]`, `[$]` in `lib/careers.ts` |
| LinkedIn URLs `null` | 3 | leadership in `lib/content.ts` |
| Legal / culture copy | 4 pages | "to be supplied" banners |

**Never invent values for these.** Contract numbers, periods of performance,
401(k) match and employer premium share are contractual facts. Fabricating them
for a federal contractor is how a bid protest starts. Real contract numbers that
*are* published: eFAST `693KA9-18-A-00102`, GSA MAS `GS-35F-397DA`, CIO-SP3
`75N98120D00167`.

Also removed on purpose: the supplied hero markup carried **NIST 800-171,
FedRAMP-Ready, CMMC Level 2** chips. ILS has published no evidence of any, so
they were replaced with credentials ILS actually holds.

---

## 8. Bugs found and fixed (worth remembering)

Several were subtle and would likely recur:

1. **Stale RAG corpus** — `build` didn't regenerate it, so the assistant quoted
   deleted page sections. Fixed by chaining `npm run knowledge`.
2. **Admin content in the public corpus** — 23 of 79 chunks were the dashboard
   (approval queues, user roles) and answerable by the public assistant. Added a
   route-prefix exclusion in `scripts/lib/sources.mjs`.
3. **`.beam` broke `position: fixed`** — an unlayered CSS rule beat Tailwind's
   layered `fixed`/`z-50`, dropping the agent launcher to the foot of the page.
   Unlayered CSS wins over layered regardless of specificity.
4. **`antialiased` on light backgrounds** — thinned glyph stems and made text
   look washed out at 18.9:1 contrast. It's correct for light-on-dark only.
5. **Login form absent from SSR** — `useSearchParams` forced a Suspense boundary;
   the form only appeared after hydration. Fixed by reading params in a server
   component.
6. **`scale` grew from the centre** — pushed the hero film left across the
   headline. Negative margin bleeds one direction; scale bleeds all four.
7. **Privacy page went stale** — it described a third-party Pexels request that
   no longer happened after self-hosting. Legal copy must track the build.
8. **Upstream test failure inherited** — 62/63 in the source repo; regenerating
   the corpus fixed it. Ours passes 63/63.

---

## 9. Not done / next steps

**Blockers before public launch**

1. `git init` + `.gitignore` — **there is no version control**
2. Change the admin password and session secret
3. Content sign-off for the items in §7

**High value, low effort**

4. `app/sitemap.ts` + `app/robots.ts` — neither exists; the per-vehicle and
   careers pages are currently only discoverable via internal links
5. JSON-LD (`Organization`, `BreadcrumbList`) — none present

**The real project**

6. **Persistence for the admin** — DB or git-backed JSON, then have the site read
   from it and call `revalidatePath()` on publish. Everything else in the admin
   is cosmetic until this exists.
7. Replace the in-memory `sessions.ts` / `ratelimit.ts` Maps with Redis before
   running more than one instance.
8. Real audit attribution — currently still `CURRENT_USER_ID` fixture, even
   though the header shows the signed-in username.

**Ideas surfaced from competitor analysis** (harmonytech.com)

- Named, productized solutions (their strongest differentiator — we have none)
- Per-award announcement pages (`/awarded-exim-bpa` style) for SEO
- `/why-us` page

---

## 10. Deployment

Cannot be a static export — `/intel` uses ISR and both API routes are
`force-dynamic`. Needs a Node 22+ runtime.

- **Vercel** for the POC — native Next.js, ISR + routes work unconfigured.
- **AWS** (App Runner / ECS Fargate behind CloudFront, Secrets Manager) for
  production, aligning with the Bedrock/Claude plan. No Dockerfile yet.

**ngrok 3.3.1 is installed** at
`C:\Users\Yash Shah\AppData\Local\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe`
but needs an authtoken from dashboard.ngrok.com before `ngrok http 3000` works.
`cloudflared` install was attempted and cancelled at a UAC prompt — it needs no
account and would give a free stable URL.

---

## 11. Related

`C:\Users\Yash Shah\Documents\ILS_Website_Mulu_Version\ILS-website` — a parallel
build (~11.8k lines, Next 16). Source of the admin, the RAG pipeline, the legal
pages and the structured vehicle/careers data. Still has things not ported:
`/doing-business`, `/past-performance` (+ detail), `/capabilities/cyber-security`,
and a `design-reference/` folder of HTML mockups.

Note there are now **two content sources**: `lib/content.ts` (ours) and
`lib/site.ts` / `lib/vehicles.ts` / `lib/careers.ts` (ported). The duplicated
`vehicles` and `roles` arrays were removed, but consolidating the rest is
outstanding.
