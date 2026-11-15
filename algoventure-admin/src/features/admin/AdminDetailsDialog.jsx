import { useId, useLayoutEffect, useRef } from "react";
import { X } from "lucide-react";
import { useText } from "../../preferences/preferencesContext";
import "./AdminDetailsDialog.css";

export default function AdminDetailsDialog({ title, onClose, closeDisabled = false, children }) {
  const text = useText();
  const titleId = useId();
  const dialogRef = useRef(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog.open) dialog.showModal();
    return () => { if (dialog.open) dialog.close(); };
  }, []);

  return (
    <dialog ref={dialogRef} aria-labelledby={titleId} className="admin-details-dialog panel"
      onCancel={(event) => { if (closeDisabled) event.preventDefault(); }}
      onClose={(event) => { if (!event.currentTarget.open) onClose(); }}>
      <header className="admin-details-dialog-header">
        <h2 id={titleId} className="text-lg font-bold">{title}</h2>
        <button type="button" className="btn-secondary admin-details-dialog-close"
          aria-label={text("Đóng", "Close")} disabled={closeDisabled} onClick={() => dialogRef.current.close()}>
          <X size={19} aria-hidden="true" />
        </button>
      </header>
      <div className="admin-details-dialog-body space-y-6">{children}</div>
    </dialog>
  );
}
