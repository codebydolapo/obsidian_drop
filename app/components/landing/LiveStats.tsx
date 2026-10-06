'use client';

import { useEffect, useState } from 'react';
import { SOCKET_SERVER_URL } from '../../lib/config';

type State = { status: 'loading' } | { status: 'ready'; online: number } | { status: 'unavailable' };

// The server can take ~60s to wake from sleep; this request also warms it up for the app
const TIMEOUT_MS = 75_000;

export function LiveStats() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    fetch(`${SOCKET_SERVER_URL}/stats`, { signal: controller.signal, cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data: { online?: unknown }) => {
        if (!active) return;
        setState(typeof data.online === 'number' ? { status: 'ready', online: data.online } : { status: 'unavailable' });
      })
      .catch(() => {
        // Timeout, network error or older server without /stats
        if (active) setState({ status: 'unavailable' });
      })
      .finally(() => clearTimeout(timer));

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-accent/30 bg-accent/5 p-6">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          {state.status === 'ready' && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />}
          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${state.status === 'unavailable' ? 'bg-line-strong' : 'bg-accent'}`} />
        </span>
        <span className="font-mono text-xs uppercase tracking-widest text-accent-ink">Live</span>
      </div>
      <div className="mt-6" aria-live="polite">
        {state.status === 'loading' && (
          <>
            <div className="h-10 w-16 animate-pulse rounded-lg bg-raised" />
            <p className="mt-2 text-sm text-muted">Waking up the server…</p>
          </>
        )}
        {state.status === 'ready' && state.online === 0 && (
          <>
            <p className="text-2xl font-semibold tracking-tight text-ink">Quiet right now</p>
            <p className="mt-2 text-sm text-subtle">Be the first on the radar</p>
          </>
        )}
        {state.status === 'ready' && state.online > 0 && (
          <>
            <p className="text-4xl font-semibold tracking-tight text-ink">{state.online.toLocaleString()}</p>
            <p className="mt-2 text-sm text-subtle">{state.online === 1 ? 'person' : 'people'} on a radar right now</p>
          </>
        )}
        {state.status === 'unavailable' && (
          <>
            <p className="text-4xl font-semibold tracking-tight text-ink">—</p>
            <p className="mt-2 text-sm text-muted">Live count unavailable right now</p>
          </>
        )}
      </div>
    </div>
  );
}
