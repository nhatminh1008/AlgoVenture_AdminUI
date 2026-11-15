import { useText } from "../../preferences/preferencesContext";
export function ApiFeedback({ state = {}, message, actionError }) {
  const text = useText();
  return (
    <>
      {state.loading && (
        <p role="status" className="mb-4 text-sm text-slate-500">
          {text("Đang tải dữ liệu…")}
        </p>
      )}
      {state.error && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {text(state.error)}{" "}
          <button onClick={state.refresh} className="underline">
            {text("Thử lại")}
          </button>
        </p>
      )}
      {actionError && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {text(actionError)}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="mb-4 rounded-xl bg-portal-lavender p-4 text-sm text-portal-ink"
        >
          {text(message)}
        </p>
      )}
    </>
  );
}
