import { createContext, useContext } from "react";
// Stable across provider hot reloads; avoids mismatched Context instances.
export const ClassroomContext = createContext(null);
export function useClassrooms() {
  return useContext(ClassroomContext);
}
