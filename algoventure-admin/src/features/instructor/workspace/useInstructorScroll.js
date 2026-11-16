import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export function useInstructorScroll() {
  const { key, pathname } = useLocation();
  const action = useNavigationType();
  const positions = useRef(new Map());
  const previousPath = useRef(pathname);

  useLayoutEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  useLayoutEffect(() => {
    const saved = action === "POP" ? positions.current.get(key) : undefined;
    if (action === "PUSH" || previousPath.current !== pathname || saved !== undefined) {
      window.scrollTo({ top: saved ?? 0, behavior: "instant" });
    }
    previousPath.current = pathname;

    // Reports can render their tables after the initial mount.
    let observer;
    let timeout;
    function stopRestoring() {
      observer?.disconnect();
      observer = null;
      window.clearTimeout(timeout);
    }
    const main = document.getElementById("main-content");
    if (main && saved > window.scrollY) {
      observer = new ResizeObserver(() => {
        window.scrollTo({ top: saved, behavior: "instant" });
        if (window.scrollY >= saved) stopRestoring();
      });
      observer.observe(main);
      timeout = window.setTimeout(stopRestoring, 2500);
    }
    const save = () => {
      if (observer) return;
      positions.current.set(key, window.scrollY);
      if (positions.current.size > 100) positions.current.delete(positions.current.keys().next().value);
    };
    save();
    const interactions = ["wheel", "touchstart", "pointerdown", "keydown"];
    interactions.forEach((event) => window.addEventListener(event, stopRestoring, { passive: true }));
    window.addEventListener("scroll", save, { passive: true });
    return () => {
      stopRestoring();
      interactions.forEach((event) => window.removeEventListener(event, stopRestoring));
      window.removeEventListener("scroll", save);
    };
  }, [action, key, pathname]);
}
