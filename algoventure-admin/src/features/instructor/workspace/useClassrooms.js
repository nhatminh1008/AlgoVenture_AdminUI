import { createContext, useContext } from "react";

export const ClassroomContext = createContext(null);

export function useClassrooms() {
  return useContext(ClassroomContext);
}
