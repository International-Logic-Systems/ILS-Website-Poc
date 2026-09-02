import type { Metadata } from "next";
import Image from 'next/image';
import logoLockup from '@/public/logo-lockup.png';
import LoginForm from "@/components/admin/login-form";

// Sign-in for the dashboard. Inside the (admin) route group so it inherits the
// admin document and stylesheet, but outside (dashboard) so it gets none of the
// chrome — a login screen with a sidebar behind it invites clicks on nav the
// visitor has no session for.
//
// A server component, so the form is in the HTML rather than appearing after
// hydration. Query params are read here and handed down as props.

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-5 py-16">
      <div className="w-full max-w-sm">
        {/* Standard lockup here, not the reversed one: this screen is on paper,
            and the white variant would be invisible against it. */}
        <div className="mb-8">
          <Image src={logoLockup} alt="International Logic Systems" priority className="h-8 w-auto" />
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            Admin · Internal · authorised users
          </p>
        </div>

        <LoginForm next={next ?? null} unconfigured={error === "unconfigured"} />

        <p className="mt-6 text-center text-xs text-muted">
          This dashboard is not public. Sessions expire after 8 hours.
        </p>
      </div>
    </main>
  );
}
