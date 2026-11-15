import { useLocation } from "react-router-dom";

export function useInstructorNavigation(fallback) {
  const { pathname, search, state } = useLocation();
  const parent = state?.back;
  return {
    back: parent ?? { to: fallback },
    childState: {
      back: {
        to: pathname + search,
        state: parent ? { back: parent } : undefined,
      },
    },
  };
}
