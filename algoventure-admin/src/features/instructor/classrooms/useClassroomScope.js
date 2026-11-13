import { useSearchParams } from "react-router-dom";
import { useClassrooms } from "../workspace/ClassroomContext";

export function useClassroomScope() {
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
