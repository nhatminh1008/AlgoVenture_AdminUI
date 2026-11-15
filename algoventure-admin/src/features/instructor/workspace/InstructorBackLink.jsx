import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useText } from "../../../preferences/preferencesContext";

export default function InstructorBackLink({ destination, onBack, children }) {
  const text = useText();
  const className = "mb-5 inline-flex items-center gap-2 text-sm text-portal-muted hover:text-portal-purple-strong";
  const content = (
    <>
      <ArrowLeft size={16} aria-hidden="true" />
      {children ?? text("Quay lại")}
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
