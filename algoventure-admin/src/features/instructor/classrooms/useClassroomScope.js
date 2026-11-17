import { useInstructorParams } from "../workspace/useInstructorParams";
import { useClassrooms } from "../workspace/useClassrooms";

export function useClassroomScope() {
  const { params, set } = useInstructorParams();
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
  const select = (value) => set("classId", value, true);
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
