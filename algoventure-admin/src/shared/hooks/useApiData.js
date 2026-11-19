import { useCallback, useEffect, useRef, useState } from "react";

export function useApiData(loadData, initial, onError) {
  const [data, setQueryData] = useState(initial);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const result = await loadData();
      if (id === requestId.current) {
        setQueryData(result);
        setError("");
      }
    } catch (failure) {
      if (id === requestId.current) {
        setError(failure.message);
        onError?.(failure.message);
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [loadData, onError]);

  const setData = useCallback((value) => {
    // A successful write supersedes any read already in flight.
    requestId.current++;
    setQueryData(value);
    setError("");
    setLoading(false);
  }, []);

  const invalidateRequest = useCallback(() => {
    requestId.current++;
  }, []);

  useEffect(() => {
    let active = true;
    // Strict Mode cleanup cancels the first scheduled request before it starts.
    queueMicrotask(() => {
      if (active) refresh();
    });
    return () => {
      active = false;
      invalidateRequest();
    };
  }, [refresh, invalidateRequest]);

  return { data, setData, error, loading, refresh };
}
