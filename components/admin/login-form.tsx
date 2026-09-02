"use client";

import { useState } from "react";

/**
 * The sign-in form.
 *
 * `next` and `unconfigured` arrive as props from the server component rather
 * than being read with useSearchParams here. That matters: useSearchParams
 * forces a Suspense boundary, which meant the form was absent from the server
 * response and only appeared after hydration — a blank page for anyone on a
 * slow connection and a dead end for anyone without JavaScript.
 */
export default function LoginForm({
  next,
  unconfigured,
}: {
  next: string | null;
  unconfigured: boolean;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Sign-in failed.");
        setBusy(false);
        return;
      }

      // Full navigation, not a client transition: the middleware has to see the
      // new cookie before it will let the dashboard render.
      window.location.assign(next && next.startsWith("/admin") ? next : "/admin");
    } catch {
      setError("Could not reach the server.");
      setBusy(false);
    }
  }

  return (
    <>
      {unconfigured && (
        <div className="mb-6 rounded-md border border-warn-ring bg-warn-soft p-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-warn">
            Not configured
          </p>
          <p className="mt-2 text-sm text-slate">
            Sign-in is unavailable until <code>ADMIN_SESSION_SECRET</code> and a password are set.
            See <code>.env.example</code>. Access stays denied until then.
          </p>
        </div>
      )}

      <form onSubmit={submit} className="rounded-lg border border-rule bg-card p-6 shadow-sm">
        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate">
            Username
          </span>
          <input
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            className="mt-2 w-full rounded-md border border-rule bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-action"
          />
        </label>

        <label className="mt-4 block">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate">
            Password
          </span>
          <input
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="mt-2 w-full rounded-md border border-rule bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-action"
          />
        </label>

        {error && (
          <p role="alert" className="mt-4 text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-md bg-action px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </>
  );
}
