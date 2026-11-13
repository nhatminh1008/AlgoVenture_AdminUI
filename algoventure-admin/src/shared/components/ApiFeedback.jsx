export function ApiFeedback({ state, message, actionError }) {
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
      {actionError && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {actionError}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="mb-4 rounded-xl bg-portal-lavender p-4 text-sm text-portal-ink"
        >
          {message}
        </p>
      )}
    </>
  );
}
