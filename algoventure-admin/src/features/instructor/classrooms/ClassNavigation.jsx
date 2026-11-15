import { useText } from "../../../preferences/preferencesContext";
import { Link } from "react-router-dom";
import { Layers, ClipboardList, Users } from "lucide-react";

const icons = { assignments: Layers, quizzes: ClipboardList, students: Users };

export default function ClassNavigation({ classId, active, state }) {
  const text = useText();
  const base = `/instructor/classes/${classId}`;
  const items = [
    ["assignments", "Bộ thử thách", `${base}?tab=assignments`],
    ["quizzes", "Trắc nghiệm", `${base}?tab=quizzes`],
    ["students", "Sinh viên", `${base}?tab=students`],
  ];
  return (
    <nav aria-label={text("Điều hướng lớp học")} className="instructor-tabs">
      {items.map(([id, label, to]) => {
        const Icon = icons[id];
        return (
        <Link key={id} to={to} state={state} aria-current={active === id ? "page" : undefined}
        >
          <Icon size={15} aria-hidden="true" />{label}
        </Link>
      );})}
    </nav>
  );
}
