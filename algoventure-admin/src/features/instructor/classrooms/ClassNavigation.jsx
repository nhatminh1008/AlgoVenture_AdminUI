import { useText } from "../../../preferences/preferencesContext";
import { useLocation } from "react-router-dom";
import { Layers, ClipboardList, Users } from "lucide-react";
import InstructorLink from "../workspace/InstructorLink";

const items = [
  ["assignments", "Bộ thử thách", Layers],
  ["quizzes", "Trắc nghiệm", ClipboardList],
  ["students", "Sinh viên", Users],
];

export default function ClassNavigation({ classId, active }) {
  const text = useText();
  const location = useLocation();
  const base = `/instructor/classes/${classId}`;
  const sameClass = location.pathname.replace(/\/+$/, "") === base;
  return (
    <nav aria-label={text("Điều hướng lớp học")} className="instructor-tabs">
      {items.map(([id, label, Icon]) => {
        const params = new URLSearchParams(sameClass ? location.search : "");
        params.set("tab", id);
        return (
          <InstructorLink key={id} to={`${base}?${params}`} replace={sameClass} aria-current={active === id ? "page" : undefined}>
            <Icon size={15} aria-hidden="true" />{text(label)}
          </InstructorLink>
        );
      })}
    </nav>
  );
}
