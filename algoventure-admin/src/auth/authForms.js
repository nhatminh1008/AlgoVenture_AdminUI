import { useEffect, useRef, useState } from "react";
import { useText } from "../preferences/preferencesContext";

export function useAuthForm() {
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState(null);

  async function run(action) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setFailure(null);
    try {
      await action();
    } catch (error) {
      setFailure(error);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return { run, busy, failure, setFailure };
}

export function useSecondsRemaining(deadline) {
  const [now, setNow] = useState(Date.now);
  const seconds = Math.max(0, Math.ceil((deadline - now) / 1000));
  useEffect(() => {
    if (!deadline) return;
    const update = () => setNow(Date.now());
    const initial = window.setTimeout(update, 0);
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= deadline) window.clearInterval(timer);
    }, 1000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [deadline]);
  return seconds;
}

export function useFieldError(failure) {
  const text = useText();
  return (name) => failure?.fields?.[name] && text(failure.fields[name]);
}
