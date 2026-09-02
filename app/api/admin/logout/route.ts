import { SESSION_COOKIE } from "@/lib/admin/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Clears the session cookie. Max-Age=0 expires it immediately. */
export async function POST(): Promise<Response> {
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "set-cookie": `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax;${secure} Max-Age=0`,
    },
  });
}
