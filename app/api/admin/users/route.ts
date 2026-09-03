import { cookies } from "next/headers";
import { SESSION_COOKIE, credentials, verifyToken } from "@/lib/admin/auth";
import { passwordProblem } from "@/lib/admin/password";
import { findByEmail, inviteUser, listUsers, usersAvailable } from "@/lib/admin/users";

/**
 * Staff accounts — list and invite.
 *
 * There is no public counterpart to this route. Creating an account requires an
 * existing session, which is what "invite-only" means in practice: the only way
 * in is for someone already inside to let you in.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function session(): Promise<string | null> {
  const configured = credentials();
  if (!configured) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const s = token ? await verifyToken(token, configured.secret) : null;
  return s?.user ?? null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function GET(): Promise<Response> {
  if (!(await session())) return Response.json({ error: "Not signed in." }, { status: 401 });
  if (!usersAvailable()) {
    return Response.json({ available: false, users: [] });
  }
  return Response.json({ available: true, users: await listUsers() });
}

export async function POST(request: Request): Promise<Response> {
  const actor = await session();
  if (!actor) return Response.json({ error: "Not signed in." }, { status: 401 });

  if (!usersAvailable()) {
    return Response.json(
      { error: "No database is configured, so accounts cannot be created." },
      { status: 503 },
    );
  }

  let body: { email?: unknown; name?: unknown; password?: unknown; canApprove?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Expected JSON." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!name) return Response.json({ error: "Give the person a name." }, { status: 400 });
  if (!EMAIL.test(email)) {
    return Response.json({ error: "That email address does not look right." }, { status: 400 });
  }

  const weak = passwordProblem(password);
  if (weak) return Response.json({ error: weak }, { status: 400 });

  if (await findByEmail(email)) {
    return Response.json({ error: `${email} already has an account.` }, { status: 409 });
  }

  try {
    // Record who let them in. The session carries an email; resolve it to a row
    // so `invited_by` is a real foreign key rather than a claim in a comment.
    const inviter = await findByEmail(actor);

    const user = await inviteUser({
      email,
      name,
      password,
      canApprove: Boolean(body.canApprove),
      invitedBy: inviter?.id ?? null,
    });
    // Who invited whom is recorded on the row; the actor is the session email.
    console.info(`[users] ${actor} created an account for ${email}`);
    return Response.json({ ok: true, user });
  } catch (error) {
    console.error("[users] invite failed", error);
    return Response.json({ error: "Could not create that account." }, { status: 500 });
  }
}
