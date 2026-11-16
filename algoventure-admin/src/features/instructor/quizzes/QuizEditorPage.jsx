import { useText } from "../../../preferences/preferencesContext";
import { useParams } from "react-router-dom";
import { useClassrooms } from "../workspace/ClassroomContext";
import InstructorBackLink from "../workspace/InstructorBackLink";
import QuizEditorForm from "./QuizEditorForm";
import { canEditQuiz } from "./quizStatus";

export default function QuizEditorPage() {
  const text = useText();
  const { classId, quizId } = useParams();
  const { classes, quizzes } = useClassrooms();
  const classroom = classes.find((item) => item.id === classId);
  const existing = quizzes.find(
    (item) => item.id === quizId && item.classId === classId,
  );
  if (!classroom || (quizId && !existing))
    return (
      <div className="panel p-8">
        <h1 className="text-xl font-bold">
          {text("Không tìm thấy lớp hoặc bộ câu hỏi")}
        </h1>
        <InstructorBackLink />
      </div>
    );
  if (classroom.archivedAt || (existing && !canEditQuiz(existing, classroom.archivedAt))) {
    const archived = classroom.archivedAt || existing?.archivedAt;
    const closed = existing?.status === "Closed";
    const title = classroom.archivedAt ? text("Lớp học đã lưu trữ")
      : existing?.archivedAt ? text("Bộ câu hỏi đã lưu trữ")
        : closed ? text("Bộ câu hỏi đã đóng") : text("Bộ câu hỏi đã được công bố");
    return (
      <div className="panel p-8">
        <h1 className="text-xl font-bold">
          {title}
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          {archived || closed
            ? text("Bạn có thể xem lại nội dung đã lưu.")
            : text("Không thể chỉnh sửa nội dung đã công bố.")}
        </p>
        <InstructorBackLink />
      </div>
    );
  }
  return (
    <QuizEditorForm
      key={`${classId}:${quizId ?? "new"}`}
      classroom={classroom}
      existing={existing}
    />
  );
}
