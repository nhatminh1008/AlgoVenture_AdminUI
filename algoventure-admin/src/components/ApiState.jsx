import { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";

export function useApiData(path, initial) {
  const [data, setData] = useState(initial);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api(path));
      setError("");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setLoading(false);
    }
  }, [path]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return { data, setData, error, setError, loading, refresh };
}

export function ApiFeedback({ state, message }) {
  return (
    <>
      {state.loading && (
        <p role="status" className="mb-4 text-sm text-slate-500">
          Đang tải dữ liệu…
        </p>
      )}
      {state.error && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {state.error}{" "}
          <button onClick={state.refresh} className="underline">
            Thử lại
          </button>
        </p>
      )}
      {message && (
        <p
          role="status"
          className="mb-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {message}
        </p>
      )}
    </>
  );
}

export function AdminHeader({ title, children }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-1 text-sm text-slate-500">Admin Console / {title}</p>
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
      </div>
      {children}
    </div>
  );
}
