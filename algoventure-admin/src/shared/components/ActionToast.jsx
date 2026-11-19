import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CircleAlert, CircleCheck, X } from "lucide-react";
import { useText } from "../../preferences/preferencesContext";
import "./ActionToast.css";

import { ToastContext } from "./useActionToast";

const MOTION_MS = 220;

function ActionToast({ toast, onDismiss }) {
  const text = useText();
  const [closing, setClosing] = useState(false);
  const duration = toast.error ? 8000 : 4500;

  useEffect(() => {
    if (!closing) return;
    const timeout = window.setTimeout(() => onDismiss(toast.id), MOTION_MS);
    return () => window.clearTimeout(timeout);
  }, [closing, onDismiss, toast.id]);

  const Icon = toast.error ? CircleAlert : CircleCheck;
  return (
    <div
      className="action-toast"
      data-error={toast.error || undefined}
      data-closing={closing || undefined}
      style={{ "--toast-duration": `${duration}ms`, "--toast-motion-duration": `${MOTION_MS}ms` }}
    >
      <Icon aria-hidden="true" size={20} />
      <p role={toast.error ? "alert" : "status"}>{text(toast.message)}</p>
      <button type="button" aria-label={text("Đóng thông báo", "Dismiss notification")} onClick={() => setClosing(true)}>
        <X aria-hidden="true" size={17} />
      </button>
      <span className="action-toast-progress" aria-hidden="true" onAnimationEnd={() => setClosing(true)} />
    </div>
  );
}

export function ActionToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const showToast = useCallback((message) => {
    const toast = { ...message, id: ++nextId.current };
    setToasts((current) => [...current, toast]);
  }, []);
  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toasts.length > 0 && createPortal(
        <div className="action-toast-stack">
          {toasts.map((toast) => <ActionToast key={toast.id} toast={toast} onDismiss={dismissToast} />)}
        </div>,
        document.querySelector("dialog:modal") ?? document.body,
      )}
    </ToastContext.Provider>
  );
}
