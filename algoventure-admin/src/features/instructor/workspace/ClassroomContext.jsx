import { useText } from "../../../preferences/preferencesContext";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { useAuth } from "../../../auth/useAuth";
import { createCurriculum } from "../../../shared/curriculum/curriculumCatalog";
import { useApiData } from "../../../shared/hooks/useApiData";
import {
  closeQuiz,
  deleteAssignmentTemplate,
  deleteQuiz,
  deliverAssignment,
  duplicateAssignmentTemplate,
  getInstructorState,
  saveAssignment,
  saveAssignmentTemplate,
  saveClassroom,
  saveQuiz,
} from "./instructorWorkspaceService";

const ClassroomContext = createContext(null);
export function ClassroomProvider({ children }) {
  const text = useText();
  const { user } = useAuth();
  const { data, setData, error: stateLoadError, refresh } = useApiData(getInstructorState, null);
  const topics = data?.topics;
  const curriculum = useMemo(() => topics && createCurriculum(topics), [topics]);
  useEffect(() => {
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [refresh]);
  async function save(collection, saveRecord, values, id) {
    const result = await saveRecord(values, id);
    setData((previous) => {
      const records = previous[collection];
      const recordId = id ?? result.id;
      const exists = records.some((item) => item.id === recordId);
      return {
        ...previous,
        [collection]: exists
          ? records.map((item) => (item.id === recordId ? result : item))
          : [...records, result],
      };
    });
    return result;
  }
  async function markQuizClosed(id) {
    await closeQuiz(id);
    setData((previous) => ({
      ...previous,
      quizzes: previous.quizzes.map((quiz) => quiz.id === id ? { ...quiz, status: "Closed" } : quiz),
    }));
    await refresh();
  }
  async function remove(collection, deleteRecord, id) {
    await deleteRecord(id);
    setData((previous) => ({
      ...previous,
      [collection]: previous[collection].filter((item) => item.id !== id),
    }));
  }
  async function deliver(classroomId, values) {
    const assignment = await save("assignments", (body) => deliverAssignment(classroomId, body), values);
    setData((previous) => ({
      ...previous,
      assignmentTemplates: previous.assignmentTemplates.map((template) =>
        template.id === values.assignmentTemplateId ? { ...template, locked: true } : template),
    }));
    return assignment;
  }
  if (!data)
    return (
      <div className="p-8">
        {stateLoadError ? (
          <p role="alert">
            {text(stateLoadError)}{" "}
            <button className="btn-secondary" onClick={refresh}>
              {text("Thử lại")}
            </button>
          </p>
        ) : (
          <p role="status">{text("Đang tải dữ liệu lớp học…")}</p>
        )}
      </div>
    );
  return (
    <ClassroomContext.Provider
      value={{
        ...data,
        ...curriculum,
        lessonName: (id) => text(curriculum.lessonName(id)),
        instructor: user,
        stateLoadError,
        refresh,
        saveClass: (v, id) => save("classes", saveClassroom, v, id),
        saveAssignment: (v, id) => save("assignments", saveAssignment, v, id),
        saveAssignmentTemplate: (v, id) => save("assignmentTemplates", saveAssignmentTemplate, v, id),
        duplicateAssignmentTemplate: (id) => save("assignmentTemplates", duplicateAssignmentTemplate, id),
        removeAssignmentTemplate: (id) => remove("assignmentTemplates", deleteAssignmentTemplate, id),
        deliverAssignment: deliver,
        saveQuiz: (v, id) => save("quizzes", saveQuiz, v, id),
        markQuizClosed,
        removeQuiz: (id) => remove("quizzes", deleteQuiz, id),
      }}
    >
      {children}
    </ClassroomContext.Provider>
  );
}
export function useClassrooms() {
  return useContext(ClassroomContext);
}
