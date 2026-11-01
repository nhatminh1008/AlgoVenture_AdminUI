import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useClassrooms } from "../data/ClassroomContext";

export function useClassScope() {
  const data = useClassrooms();
  const [params, setParams] = useSearchParams();
  const classId = params.get("classId") || data.classrooms[0]?.id || "";
  const classroom = data.classrooms.find((item) => item.id === classId);
  const published = data.assignments.filter(
    (item) => item.classroomId === classId && item.status === "published",
  );
  const assignmentId = params.get("assignmentId") || "";
  const invalid =
    !data.loading &&
    (!classroom ||
      (assignmentId && !published.some((item) => item.id === assignmentId)));
  function select(name, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    if (name === "classId") next.delete("assignmentId");
    setParams(next);
  }
  return {
    ...data,
    classId,
    classroom,
    assignmentId,
    published,
    selectedAssignments: published.filter(
      (item) => !assignmentId || item.id === assignmentId,
    ),
    members: data.enrollments.filter((item) => item.classroomId === classId),
    history: data.attempts.filter(
      (item) =>
        published.some((assignment) => assignment.id === item.assignmentId) &&
        (!assignmentId || item.assignmentId === assignmentId),
    ),
    invalid,
    select,
  };
}
export default function ClassFilter({ scope, assignments = false }) {
  const [search, setSearch] = useState("");
  return (
    <div className="flex min-w-0 flex-wrap gap-3">
      <label className="min-w-0 flex-1 sm:min-w-56">
        <span className="sr-only">Chọn lớp học</span>
        <select
          className="field"
          value={scope.classId}
          onChange={(event) => scope.select("classId", event.target.value)}
        >
          {!scope.classroom && (
            <option value={scope.classId}>Chọn lớp học</option>
          )}
          {scope.classrooms.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </label>
      {assignments && (
        <label className="min-w-0 flex-1 sm:min-w-56">
          <span className="sr-only">Chọn bài tập</span>
          <select
            className="field"
            value={scope.assignmentId}
            onChange={(event) =>
              scope.select("assignmentId", event.target.value)
            }
          >
            <option value="">Tất cả bài tập đã giao</option>
            {scope.assignmentId &&
              !scope.published.some(
                (item) => item.id === scope.assignmentId,
              ) && (
                <option value={scope.assignmentId}>
                  Bài tập không khả dụng
                </option>
              )}
            {scope.published
              .filter(
                (item) =>
                  item.id === scope.assignmentId ||
                  item.title
                    .toLocaleLowerCase()
                    .includes(search.trim().toLocaleLowerCase()),
              )
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
          </select>
        </label>
      )}
      {assignments && (
        <input
          className="field sm:max-w-56"
          aria-label="Tìm bài tập theo tên"
          value={search}
          placeholder="Tìm trong danh sách bài tập..."
          onChange={(event) => setSearch(event.target.value)}
        />
      )}
    </div>
  );
}
