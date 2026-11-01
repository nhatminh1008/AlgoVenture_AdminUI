import { useSearchParams } from "react-router-dom";
import { useClassrooms } from "../data/ClassroomContext";

export function useClassScope() {
  const [params, setParams] = useSearchParams();
  const { classes, students, assignments, quizzes } = useClassrooms();
  const requested = params.get("classId");
  const classroom = classes.find((item) => item.id === requested);
  const invalid = Boolean(requested && !classroom);
  const rows = students.filter(
    (item) => !requested || item.classId === classroom?.id,
  );
  const sets = assignments.filter(
    (item) => !requested || item.classId === classroom?.id,
  );
  const select = (value) => {
    const next = new URLSearchParams(params);
    if (value) next.set("classId", value);
    else next.delete("classId");
    setParams(next);
  };
  return {
    classes,
    classroom,
    rows,
    sets,
    quizzes: quizzes.filter(
      (item) => !requested || item.classId === classroom?.id,
    ),
    invalid,
    selected: requested ?? "",
    select,
  };
}
export default function ClassFilter({ scope }) {
  return (
    <label className="min-w-0 sm:min-w-56">
      <span className="sr-only">Chọn lớp học</span>
      <select
        className="field"
        value={scope.selected}
        onChange={(event) => scope.select(event.target.value)}
      >
        <option value="">Tất cả lớp của tôi</option>
        {scope.invalid && (
          <option value={scope.selected}>Lớp không khả dụng</option>
        )}
        {scope.classes.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </label>
  );
}
