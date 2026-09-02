'use client';

/**
 * Analytics settings — the one screen that changes the public site's tracking.
 *
 * Written for someone who has never seen a container id: the fields say where
 * to find the value, the placeholder shows its shape, and a wrong value is
 * refused with the shape it should have rather than "invalid input". Saving
 * takes effect on the next page load; there is no deploy step.
 */

import * as React from 'react';
import { Button } from '@/components/admin/ui/button';
import { Badge, Card, CardBody, CardHeader, CardTitle, Eyebrow } from '@/components/admin/ui/primitives';

type Resolved = {
  gtmId: string | null;
  gaId: string | null;
  source: { gtm: 'admin' | 'env' | 'none'; ga: 'admin' | 'env' | 'none' };
  gaSuppressedByGtm: boolean;
};

type State = 'loading' | 'idle' | 'saving' | 'saved';

const field =
  'mt-1.5 w-full rounded-md border border-rule bg-card px-3 py-2 font-mono text-sm text-ink placeholder:text-muted focus:border-action focus:outline-none';

export function AnalyticsSettings() {
  const [state, setState] = React.useState<State>('loading');
  const [error, setError] = React.useState<string | null>(null);
  const [resolved, setResolved] = React.useState<Resolved | null>(null);
  const [gtmId, setGtmId] = React.useState('');
  const [gaId, setGaId] = React.useState('');

  const load = React.useCallback(async () => {
    const res = await fetch('/api/admin/settings');
    if (!res.ok) {
      setError('Could not load the current settings.');
      setState('idle');
      return;
    }
    const data = (await res.json()) as Resolved;
    setResolved(data);
    setGtmId(data.gtmId ?? '');
    setGaId(data.gaId ?? '');
    setState('idle');
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setState('saving');
    setError(null);

    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ gtmId, gaId }),
    });
    const data = (await res.json()) as Resolved & { ok?: boolean; error?: string };

    if (!res.ok || !data.ok) {
      setError(data.error ?? 'Could not save that.');
      setState('idle');
      return;
    }
    setResolved(data);
    setState('saved');
    window.setTimeout(() => setState('idle'), 2500);
  }

  const live = (id: string | null, suppressed = false) => {
    if (!id) return <Badge tone="draft">Not tracking</Badge>;
    if (suppressed) return <Badge tone="pending">Paused</Badge>;
    return <Badge tone="live">Tracking</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <Eyebrow>Public website</Eyebrow>
          <CardTitle>Analytics</CardTitle>
        </div>
        {resolved && live(resolved.gtmId ?? resolved.gaId, false)}
      </CardHeader>

      <CardBody>
        {state === 'loading' ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : (
          <form onSubmit={save} className="space-y-6">
            <div>
              <label className="block">
                <span className="text-sm font-semibold text-ink">Google Tag Manager container</span>
                <span className="mt-1 block text-sm text-muted">
                  In Google Tag Manager, this is shown at the top right of the workspace. Use this
                  if you want to manage Google Analytics and any other tags from Google&apos;s own
                  console.
                </span>
                <input
                  value={gtmId}
                  onChange={(e) => setGtmId(e.target.value)}
                  placeholder="GTM-ABC1234"
                  spellCheck={false}
                  className={field}
                />
              </label>
              {resolved && (
                <p className="mt-2 flex items-center gap-2 text-xs text-muted">
                  {live(resolved.gtmId)}
                  {resolved.source.gtm === 'env'
                    ? 'Set by the hosting environment, not here.'
                    : resolved.gtmId
                      ? 'Live on every public page.'
                      : 'Leave empty if you are not using Tag Manager.'}
                </p>
              )}
            </div>

            <div>
              <label className="block">
                <span className="text-sm font-semibold text-ink">
                  Google Analytics measurement ID
                </span>
                <span className="mt-1 block text-sm text-muted">
                  In Google Analytics: Admin → Data streams → your website. Only needed if you are
                  <em> not</em> using Tag Manager above.
                </span>
                <input
                  value={gaId}
                  onChange={(e) => setGaId(e.target.value)}
                  placeholder="G-ABC1234567"
                  spellCheck={false}
                  className={field}
                />
              </label>
              {resolved && (
                <p className="mt-2 flex items-center gap-2 text-xs text-muted">
                  {live(resolved.gaId, resolved.gaSuppressedByGtm)}
                  {resolved.gaSuppressedByGtm
                    ? 'Paused because Tag Manager is set. Add Analytics as a tag inside Tag Manager instead — running both would count every visit twice.'
                    : resolved.source.ga === 'env'
                      ? 'Set by the hosting environment, not here.'
                      : resolved.gaId
                        ? 'Live on every public page.'
                        : 'Leave empty if Tag Manager handles Analytics.'}
                </p>
              )}
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-md border border-danger-ring bg-danger-soft px-3 py-2 text-sm text-danger"
              >
                {error}
              </p>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" variant="primary" disabled={state === 'saving'}>
                {state === 'saving' ? 'Saving…' : 'Save'}
              </Button>
              {state === 'saved' && (
                <span className="text-sm text-green">Saved — live on the next page load.</span>
              )}
              <span className="ml-auto text-xs text-muted">
                Clear a field and save to stop tracking.
              </span>
            </div>
          </form>
        )}
      </CardBody>
    </Card>
  );
}
