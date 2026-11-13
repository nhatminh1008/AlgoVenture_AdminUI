import { useContext } from "react";
import { AuthSessionContext } from "./AuthSessionContext";

export function useAuth() {
  return useContext(AuthSessionContext);
}
