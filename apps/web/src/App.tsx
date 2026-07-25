import { useEffect, useState } from 'react';

interface HealthResponse {
  status: string;
  service: string;
  phase: string;
}

type ApiState =
  | { kind: 'loading' }
  | { kind: 'ok'; data: HealthResponse }
  | { kind: 'error'; message: string };

export function App(): JSX.Element {
  const [api, setApi] = useState<ApiState>({ kind: 'loading' });

  useEffect(() => {
    fetch('/api/health')
      .then(async (res): Promise<HealthResponse> => {
        if (!res.ok) {
          throw new Error(`API responded with ${res.status}`);
        }
        return (await res.json()) as HealthResponse;
      })
      .then((data) => setApi({ kind: 'ok', data }))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setApi({ kind: 'error', message });
      });
  }, []);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>ASE-OS</h1>
      <p>AI Video Editing MVP — Phase 1</p>
      <section>
        <h2>API status</h2>
        {api.kind === 'loading' && <p>Checking API…</p>}
        {api.kind === 'ok' && (
          <p>
            ✅ {api.data.service} — {api.data.status} ({api.data.phase})
          </p>
        )}
        {api.kind === 'error' && <p>❌ {api.message}</p>}
      </section>
    </main>
  );
}
