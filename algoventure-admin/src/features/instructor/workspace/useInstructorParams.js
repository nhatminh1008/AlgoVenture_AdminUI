import { useLocation, useSearchParams } from "react-router-dom";

export function useInstructorParams(pageKey = "studentPage") {
  const { state } = useLocation();
  const [params, setParams] = useSearchParams();
  const rawPage = Number(params.get(pageKey));
  const page = Number.isSafeInteger(rawPage) && rawPage >= 0 && rawPage <= 214748364 ? rawPage : 0;

  function update(values, resetKeys = []) {
    const current = new URLSearchParams(window.location.search);
    const next = new URLSearchParams(current);
    resetKeys.forEach((key) => next.delete(key));
    for (const [name, value] of Object.entries(values)) {
      if (value) next.set(name, value);
      else next.delete(name);
    }
    if (next.toString() !== current.toString()) setParams(next, { replace: true, state });
  }

  function set(name, value, resetPage = false, resetKeys = []) {
    update({ [name]: value }, resetPage ? [pageKey, ...resetKeys] : resetKeys);
  }

  return { params, set, update, page, setPage: (value) => set(pageKey, value) };
}
