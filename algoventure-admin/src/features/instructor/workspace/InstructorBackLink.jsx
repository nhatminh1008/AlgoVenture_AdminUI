import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useText } from "../../../preferences/preferencesContext";
import { useInstructorNavigation } from "./useInstructorNavigation";

export default function InstructorBackLink({ children, className, plain = false }) {
  const text = useText();
  const navigate = useNavigate();
  const { back } = useInstructorNavigation();
  if (!back.to) return null;

  return <Link to={back.to} replace
    className={className ?? "instructor-touch-link mb-5 inline-flex max-w-full items-center gap-2 text-left text-sm text-portal-muted hover:text-portal-purple-strong"}
    onClick={(event) => {
      if (!back.delta || event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      navigate(back.delta);
    }}>
    {!plain && <ArrowLeft className="shrink-0" size={16} aria-hidden="true" />}
    <span className="min-w-0 wrap-anywhere">{children ?? text("Quay lại")}</span>
  </Link>;
}
