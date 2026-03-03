import { useState, useCallback } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Generieke hook voor API calls naar de Azure Functions backend.
 * Auth via Entra ID is transparant via de Static Web App headers.
 */
export function useApi<T>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (url: string, options?: RequestInit) => {
    setState({ data: null, loading: true, error: null });
    try {
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Onbekende fout');
      setState({ data: json.data as T, loading: false, error: null });
      return json.data as T;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Netwerk fout';
      setState({ data: null, loading: false, error: msg });
      throw err;
    }
  }, []);

  return { ...state, execute };
}
