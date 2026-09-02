/**
 * Legacy → modern migration hero. Self-contained: markup, styles and timing all
 * live in this file, no external assets and no animation library.
 *
 * Everything is one 8s CSS loop — no timers, no state, no JavaScript at all, so
 * this stays a server component. That is deliberate, and it is what makes the
 * motion smooth: an earlier version drove the sequence from a
 * requestAnimationFrame scheduler that swapped class names on step boundaries,
 * and every swap risked a dropped frame. Here the browser owns the whole
 * timeline and interpolates it on the compositor.
 *
 * Direction is left→right, always. Each component slides toward the node, blurs
 * out to nothing, and is then returned to its slot *while still invisible* —
 * the jump home happens at opacity 0, so nothing is ever seen travelling
 * backwards.
 *
 * Timeline
 * --------
 *   cycle = 8s, shared by every element so the picture reads as one process
 *   estate = five components staggered 1.6s apart, in listed order
 *   cards = each dips as its paired component leaves and is back as it lands
 *   node  = pulses every 1.6s, which is exactly when a component reaches it
 */

/**
 * The estate being retired, written the way it appears on a mainframe console:
 * dataset and program names, with the platform each one runs on.
 */
const ESTATE = [
  { name: "CLAIMS.CBL", kind: "COBOL", delay: "0s" }, // → claims-api
  { name: "SIGNON.CICS", kind: "CICS", delay: "1.6s" }, // → auth-service
  { name: "BATCH01.JCL", kind: "JCL", delay: "3.2s" }, // → batch-pipeline
  { name: "MASTER.VSAM", kind: "VSAM", delay: "4.8s" }, // → records-db
  { name: "ORDERS.WAR", kind: "STRUTS", delay: "6.4s" }, // → orders-web
];

/** What it becomes — one counterpart per component, in the same order. */
const PLATFORM = [
  { name: "claims-api", badge: "api", delay: "0s" },
  { name: "auth-service", badge: "svc", delay: "1.6s" },
  { name: "batch-pipeline", badge: "agent", delay: "3.2s" },
  { name: "records-db", badge: "cloud", delay: "4.8s" },
  { name: "orders-web", badge: "spa", delay: "6.4s" },
];

export default function MigrationHero({ embedded = false }: { embedded?: boolean }) {
  return (
    <div className={`mh-stage${embedded ? " mh-embed" : ""}`}>
      <style>{CSS}</style>

      <div className="mh-card">
        <div className="mh-head">
          <span>Legacy estate</span>
          <span className="mh-modern">Modern platform</span>
        </div>

        <div className="mh-body">
          <div className="mh-estate">
            {ESTATE.map((c) => (
              <div className="mh-row" key={c.name}>
                <div className="mh-legacy" style={{ animationDelay: c.delay }}>
                  <span className="mh-lname">{c.name}</span>
                  <span className="mh-kind">{c.kind}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mh-rule" aria-hidden />
          <div className="mh-node-wrap" aria-hidden>
            <div className="mh-node">
              <span>&rarr;</span>
            </div>
          </div>

          <div className="mh-services">
            {PLATFORM.map((s) => (
              <div
                className="mh-service"
                key={s.name}
                style={{ animationDelay: s.delay }}
              >
                <span className="mh-dot" />
                <span className="mh-name">{s.name}</span>
                <span className="mh-badge">{s.badge}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mh-foot">
          <span>AI-assisted refactor</span>
          <span>Zero-downtime cutover</span>
        </div>
      </div>
    </div>
  );
}

const CSS = `
.mh-stage {
  --green: #4ADE80;
  /* The junction is the one place the palette earns a second hue: green is the
     estate side, cyan the platform side, so the node reads as the handover it
     represents rather than as decoration. */
  --blue: #22D3EE;
  --soft: #B9C4BB;
  --dim: #606C63;
  --card-line: #39453D;
  /* Two monos on purpose. Courier is the type of a COBOL listing and a
     mainframe printout, so the estate is set in the face of the system being
     retired; the platform side stays in contemporary UI mono. The reader sees
     the difference before reading a word of it. */
  --legacy-face: "Courier Prime", "Courier New", Courier, monospace;
  --card-fill: #17261C;
  /* Travel far enough to dissolve at the divider, not past it. The gentle ramp
     below matters more to how this reads than the distance does. */
  --dx: 72px;

  display: grid;
  place-items: center;
  min-height: 100%;
  padding: 48px 24px;
  background: linear-gradient(180deg, #112417 0%, #0E1B12 100%);
  font-family: ui-monospace, "JetBrains Mono", "IBM Plex Mono", monospace;
}

/* Dropped into a hero that already paints a forest ground: keep the card and
   its type, lose the stage's own background and framing. */
.mh-stage.mh-embed {
  display: block;
  min-height: 0;
  padding: 0;
  background: none;
}

.mh-card {
  /* 610px wherever there is room, fluid below it. A fixed width here would set
     the min-content of whatever column holds the card and push the page into
     horizontal scroll on small screens. */
  width: 100%;
  max-width: 610px;
  height: 420px;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  /* Deliberately darker than the hero band around it: the card is an inset
     terminal, and on the lifted forest a lighter fill would dissolve into it. */
  background: linear-gradient(180deg, #101F16 0%, #0E1B13 100%);
  border: 1px solid rgba(74, 222, 128, 0.14);
  box-shadow: 0 24px 60px -20px rgba(0, 0, 0, 0.65), 0 2px 8px rgba(0, 0, 0, 0.4);
}

/* ── Header / footer micro-type ─────────────────────────────────────── */

.mh-head,
.mh-foot {
  display: flex;
  justify-content: space-between;
  padding: 18px 24px;
  font-size: 13px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--soft);
}

.mh-modern { color: var(--green); }

.mh-foot { border-top: 1px solid rgba(185, 196, 187, 0.10); }

/* ── Body: two columns, divider at 48% ──────────────────────────────── */

.mh-body {
  position: relative;
  flex: 1;
  display: grid;
  grid-template-columns: 48% 1fr;
  align-items: center;
}

.mh-rule {
  position: absolute;
  left: 48%;
  top: 50%;
  width: 1px;
  height: 180px;
  margin-left: -0.5px;
  background: #333F36;
  transform: translateY(-50%);
}

.mh-node-wrap {
  position: absolute;
  left: 48%;
  top: 50%;
  transform: translate(-50%, -50%);
}

/* Two animations, each owning a different property so they compose instead of
   fighting: the glow breathes on box-shadow, the arrival flashes on transform.
   The expanding ring is a separate pseudo-element for the same reason. */
.mh-node {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  /* Plain green ring is the floor; the gradient ring below replaces it where
     mask-composite is supported. */
  border: 1.5px solid var(--green);
  background: transparent;
  display: grid;
  place-items: center;
  color: var(--blue);
  font-size: 15px;
  line-height: 1;
  box-shadow: 0 0 12px rgba(74, 222, 128, 0.35);
  animation:
    mh-breathe 2.5s ease-in-out infinite,
    mh-node-hit 1.6s ease-out 1.44s infinite;
}

/* Glow is layered rather than blended: a tight green core and a wider cyan
   halo, so the two hues stay legible instead of muddying into teal. */
@keyframes mh-breathe {
  0%, 100% {
    box-shadow: 0 0 12px rgba(74, 222, 128, 0.35), 0 0 22px rgba(34, 211, 238, 0.22);
  }
  50% {
    box-shadow: 0 0 18px rgba(74, 222, 128, 0.55), 0 0 34px rgba(34, 211, 238, 0.42);
  }
}

/* Gradient ring, drawn as a masked pseudo-element so the centre stays
   transparent — a border cannot take a gradient. Rotating the element spins
   the gradient, which is a transform and therefore free. */
@supports ((-webkit-mask-composite: xor) or (mask-composite: exclude)) {
  .mh-node { border-color: transparent; }

  .mh-node::before {
    content: "";
    position: absolute;
    inset: -1.5px;
    border-radius: 50%;
    padding: 1.5px;
    background: conic-gradient(
      from 0deg,
      var(--green) 0deg,
      var(--green) 70deg,
      var(--blue) 180deg,
      var(--green) 290deg,
      var(--green) 360deg
    );
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    mask-composite: exclude;
    pointer-events: none;
    animation: mh-ring-spin 6s linear infinite;
  }
}

@keyframes mh-ring-spin {
  to { transform: rotate(1turn); }
}

/* Fires 1.44s into each 1.6s step — the moment a component dissolves. */
@keyframes mh-node-hit {
  0%   { transform: scale(1); }
  18%  { transform: scale(1.12); }
  60%  { transform: scale(1); }
  100% { transform: scale(1); }
}

.mh-node::after {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: 50%;
  border: 1px solid var(--blue);
  animation: mh-node-ring 1.6s ease-out 1.44s infinite;
}

@keyframes mh-node-ring {
  0%        { transform: scale(1); opacity: 0.7; }
  70%, 100% { transform: scale(1.9); opacity: 0; }
}

/* ── Left column: the legacy estate ─────────────────────────────────── */

/* Plain console listing, not cards. Fixed row heights: the text inside may
   translate, blur and fade, but the row never moves, so the column cannot
   reflow. Overflow is clipped at the column edge so a component dissolves into
   the divider rather than over the card. */
.mh-estate {
  padding-left: 24px;
  padding-right: 16px;
  overflow: hidden;
}

.mh-row {
  height: 29px;
  display: flex;
  align-items: center;
}

.mh-legacy {
  display: flex;
  align-items: baseline;
  gap: 12px;
  width: 100%;
  font-family: var(--legacy-face);
  /* Courier sits small and light for its em, so it is set a step up and a
     touch bolder to hold the same weight on screen as the platform column. */
  font-size: 15.5px;
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 21px;
  white-space: nowrap;
  color: var(--soft);
  /* The negative margin lets the highlight band sit wider than the text
     without the row drifting out of the column. */
  padding: 3px 7px;
  margin: 0 -7px;
  border-radius: 4px;
  will-change: transform, opacity, filter;
  animation: mh-transit 8s ease-in-out infinite;
}

.mh-lname { overflow: hidden; text-overflow: ellipsis; }

/* The platform each component runs on, set back so the name leads. */
.mh-kind {
  margin-left: auto;
  flex: none;
  font-weight: 400;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--dim);
}

/* Slide right, blur, go — then return from nothing at the original position,
   so the loop never reads as anything travelling backwards. The snap home
   happens between 18% and 19%, entirely at zero opacity. */
@keyframes mh-transit {
  0%, 4%    { opacity: 1;    transform: translateX(0);                      filter: blur(0);     color: var(--soft);  background: transparent; }
  9%        { opacity: 0.85; transform: translateX(calc(var(--dx) * 0.25)); filter: blur(1.2px); color: var(--green); background: rgba(74, 222, 128, 0.09); }
  14%       { opacity: 0.45; transform: translateX(calc(var(--dx) * 0.6));  filter: blur(3px);   color: var(--green); background: rgba(74, 222, 128, 0.07); }
  18%       { opacity: 0;    transform: translateX(var(--dx));              filter: blur(5px);   color: var(--green); background: transparent; }
  19%       { opacity: 0;    transform: translateX(0);                      filter: blur(4px);   color: var(--soft);  background: transparent; }
  30%, 100% { opacity: 1;    transform: translateX(0);                      filter: blur(0);     color: var(--soft);  background: transparent; }
}

/* ── Right column: what it becomes ──────────────────────────────────── */

.mh-services {
  display: flex;
  flex-direction: column;
  /* Five cards in a fixed-height card: the gap carries the adjustment rather
     than the type, so the names stay at their specified size. */
  gap: 10px;
  padding-left: 28px;
  padding-right: 24px;
  min-width: 0;
}

/* Opacity and border only — a dipped card keeps its slot. It never goes fully
   out: fading to 0.34 rather than 0 keeps the platform legible throughout. */
.mh-service {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 16px;
  border-radius: 6px;
  background: var(--card-fill);
  border: 1px solid var(--card-line);
  white-space: nowrap;
  will-change: opacity, border-color;
  animation: mh-online 8s ease-in-out infinite;
}

@keyframes mh-online {
  0%        { opacity: 1;    border-color: var(--card-line); }
  6%, 16%   { opacity: 0.34; border-color: rgba(185, 196, 187, 0.14); }
  22%       { opacity: 1;    border-color: rgba(74, 222, 128, 0.5); }
  30%, 100% { opacity: 1;    border-color: var(--card-line); }
}

.mh-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--green);
  flex: none;
}

.mh-name {
  color: #FFFFFF;
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mh-badge {
  margin-left: auto;
  color: var(--soft);
  font-size: 10.5px;
  letter-spacing: 0.08em;
  flex: none;
}

/* Narrower than the card's natural width the columns can no longer hold a full
   name at this size, so the type steps down and the card takes its natural
   height. Rows stay fixed — still no reflow mid-loop. */
@media (max-width: 620px) {
  .mh-card { height: auto; }
  .mh-head, .mh-foot { padding: 14px 16px; font-size: 11px; }
  .mh-estate { padding-left: 16px; padding-right: 12px; }
  .mh-legacy { font-size: 13px; }
  .mh-row { height: 26px; }
  .mh-services { padding-left: 16px; padding-right: 16px; gap: 10px; }
  .mh-service { padding: 10px 12px; gap: 9px; }
  .mh-name { font-size: 12px; }
  .mh-body { padding: 18px 0; }
}

/* Phone width: the estate needs more of the split than the platform does, and
   the type steps down again so a full component name still fits rather than
   being sliced. The divider and node move with the split. */
@media (max-width: 440px) {
  .mh-stage { --dx: 48px; }
  .mh-body { grid-template-columns: 54% 1fr; }
  .mh-rule { left: 54%; height: 150px; }
  .mh-node-wrap { left: 54%; }
  .mh-node { width: 30px; height: 30px; font-size: 13px; }
  .mh-estate { padding-left: 14px; padding-right: 8px; }
  .mh-legacy { font-size: 11.5px; gap: 7px; }
  .mh-row { height: 24px; }
  .mh-services { padding-left: 12px; padding-right: 12px; gap: 8px; }
  .mh-service { padding: 8px 10px; gap: 7px; }
  .mh-name { font-size: 11px; }
  .mh-kind, .mh-badge { font-size: 9px; }
}

/* The scene reads correctly frozen: the estate on one side, the platform on
   the other, the junction between them. */
@media (prefers-reduced-motion: reduce) {
  .mh-node, .mh-node::before, .mh-node::after, .mh-legacy, .mh-service {
    animation: none !important;
    opacity: 1 !important;
  }
}
`;
