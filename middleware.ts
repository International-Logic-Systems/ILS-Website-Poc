import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, credentials, verifyToken } from "@/lib/admin/auth";

/**
 * Gate on every admin route.
 *
 * The admin pages are statically prerendered, so without this their HTML is
 * served to anyone who guesses the URL — approvals queue, user roles, audit
 * trail and all. `noindex` keeps them out of search results; it does not keep
 * people out.
 *
 * Fails closed. If ADMIN_SESSION_SECRET and a password are not configured, no
 * one gets in — an unconfigured deployment must not be an open one.
 */

export const config = {
  // Matches /admin and everything beneath it. API routes live under /api and
  // are matched separately below where they need it.
  matcher: ["/admin/:path*"],
};

const LOGIN_PATH = "/admin/login";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const configured = credentials();

  if (pathname === LOGIN_PATH) {
    // Already signed in? Skip the form.
    if (configured) {
      const token = request.cookies.get(SESSION_COOKIE)?.value;
      if (token && (await verifyToken(token, configured.secret))) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }
    return NextResponse.next();
  }

  if (!configured) {
    const url = new URL(LOGIN_PATH, request.url);
    url.searchParams.set("error", "unconfigured");
    return NextResponse.redirect(url);
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifyToken(token, configured.secret) : null;

  if (!session) {
    const url = new URL(LOGIN_PATH, request.url);
    // Come back to where they were headed once signed in.
    if (pathname !== "/admin") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Prevent any shared cache from holding an authenticated admin page.
  const res = NextResponse.next();
  res.headers.set("cache-control", "no-store, private");
  return res;
}
