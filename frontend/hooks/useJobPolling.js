'use client';

import { useEffect, useRef, useState } from 'react';
import { fetchJobStatus } from '../services/api/client';

const TERMINAL = new Set(['completed', 'failed']);

export function useJobPolling(jobId, options = {}) {
  const intervalMs = options.intervalMs ?? 1200;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(jobId));
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!jobId) {
      setData(null);
      setLoading(false);
      setError(null);
      return undefined;
    }

    let cancelled = false;

    async function tick() {
      try {
        const next = await fetchJobStatus(jobId);
        if (cancelled) return;
        setData(next);
        setError(null);
        setLoading(false);
        if (TERMINAL.has(next.status)) {
          if (timerRef.current) clearInterval(timerRef.current);
        }
      } catch (e) {
        if (cancelled) return;
        setError(e.message || 'Failed to load job status');
        setLoading(false);
      }
    }

    setLoading(true);
    tick();
    timerRef.current = setInterval(tick, intervalMs);

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [jobId, intervalMs]);

  return { data, loading, error };
}
