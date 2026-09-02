import nodemailer from "nodemailer";

/**
 * Contact form → inquiries@intllogic.com.
 *
 * Sends over SMTP with credentials from the environment, so the mailbox
 * password never reaches the browser and the form has no third-party
 * dependency. Reply-To is set to the enquirer, so hitting reply in Outlook goes
 * back to them rather than to the sending account.
 *
 * Fails closed and says so. If SMTP is not configured the route returns 503 and
 * the form shows the address to write to directly — an enquiry that silently
 * disappears is worse than one that tells the visitor to send an email.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TO = process.env.INQUIRY_TO ?? "inquiries@intllogic.com";

const LIMITS = { name: 120, org: 160, email: 254, message: 5000 } as const;

/** Per-IP throttle. In-memory, so it resets on deploy — enough for one form. */
const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // crude cap; this is not a shared cache
  return recent.length > MAX_PER_WINDOW;
}

function smtp() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT ?? 587);
  return {
    from: process.env.INQUIRY_FROM ?? user,
    transport: nodemailer.createTransport({
      host,
      port,
      // 465 is implicit TLS; 587 upgrades with STARTTLS.
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
      auth: { user, pass },
    }),
  };
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Deliberately permissive: the aim is to catch a typo, not to adjudicate RFC 5322.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request): Promise<Response> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "local";

  if (rateLimited(ip)) {
    return Response.json(
      { error: "Too many messages from this address. Please try again shortly." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Expected JSON." }, { status: 400 });
  }

  // Honeypot: a real person never fills a hidden field. Answer 200 so a bot
  // cannot tell it was rejected.
  if (clean(body.company, 200)) return Response.json({ ok: true });

  const name = clean(body.name, LIMITS.name);
  const org = clean(body.org, LIMITS.org);
  const email = clean(body.email, LIMITS.email);
  const message = clean(body.message, LIMITS.message);

  if (!name) return Response.json({ error: "Please give us your name." }, { status: 400 });
  if (!EMAIL.test(email)) {
    return Response.json({ error: "That email address does not look right." }, { status: 400 });
  }
  if (message.length < 10) {
    return Response.json({ error: "Please tell us a little more." }, { status: 400 });
  }

  const config = smtp();
  if (!config) {
    return Response.json(
      {
        error: `Our contact form is not connected to email yet. Please write to ${TO} directly.`,
        mailto: TO,
      },
      { status: 503 },
    );
  }

  const lines = [
    `Name:         ${name}`,
    `Email:        ${email}`,
    `Organization: ${org || "—"}`,
    "",
    message,
    "",
    `— Sent from the contact form at intllogic.com on ${new Date().toUTCString()}`,
  ].join("\n");

  try {
    await config.transport.sendMail({
      from: `"ILS website" <${config.from}>`,
      to: TO,
      replyTo: `"${name}" <${email}>`,
      subject: `Website inquiry — ${name}${org ? ` (${org})` : ""}`,
      text: lines,
    });
  } catch (error) {
    // The address is in the message so the enquiry is not simply lost.
    console.error("contact: send failed", error);
    return Response.json(
      { error: `We could not send that just now. Please write to ${TO} directly.`, mailto: TO },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}
