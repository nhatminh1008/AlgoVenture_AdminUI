import { createContext, useCallback, useContext } from "react";

export const ToastContext = createContext(null);

export function useActionToast() {
  const setToast = useContext(ToastContext);
  return useCallback((message, error = false) => setToast({ message, error }), [setToast]);
}
