import { useCallback } from "react";
import { useActionToast } from "../components/useActionToast.js";
import { useApiData } from "./useApiData.js";

export function useApiDataWithErrorToast(loadData, initial, enabled = true) {
  const toast = useActionToast();
  const onError = useCallback((message) => toast(message, true), [toast]);
  return useApiData(loadData, initial, enabled ? onError : undefined);
}
