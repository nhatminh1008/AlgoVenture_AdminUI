import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useText } from "../../../preferences/preferencesContext";

export default function InstructorBackLink({ destination, onBack, children }) {
  const text = useText();
  const className = "instructor-touch-link mb-5 inline-flex max-w-full items-center gap-2 text-left text-sm text-portal-muted hover:text-portal-purple-strong";
  const content = (
    <>
      <ArrowLeft className="shrink-0" size={16} aria-hidden="true" />
      <span className="min-w-0 wrap-anywhere">{children ?? text("Quay lại")}</span>
    </>
  );
  return onBack ? (
    <button type="button" onClick={onBack} className={className}>{content}</button>
  ) : (
    <Link to={destination.to} state={destination.state} replace className={className}>
      {content}
    </Link>
  );
}
